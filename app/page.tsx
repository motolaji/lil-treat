'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import StampCard from './components/StampCard';
import ConsumerNav from './components/ConsumerNav';
import CandyMascot from './components/CandyMascot';
import {
  getOrCreateUser, getUserCards, expireCard, getPromotionsForUser, getRewardsForMerchants,
  LoyaltyCard, UserRow, Reward, supabase,
} from '../lib/supabase';
import { getExpiryStatus } from '../lib/expiry';
import { cheapestActiveCost } from '../lib/rewards';

interface StampEvent {
  card: LoyaltyCard;
  newCount: number;
  isReward: boolean;
}

export default function WalletPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserRow | null>(null);
  const [cards, setCards] = useState<LoyaltyCard[]>([]);
  const [rewardsByMerchant, setRewardsByMerchant] = useState<Record<string, Reward[]>>({});
  const [stampEvent, setStampEvent] = useState<StampEvent | null>(null);
  const [redeemedToast, setRedeemedToast] = useState(false);
  const [hasUnreadPromos, setHasUnreadPromos] = useState(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userRef = useRef<UserRow | null>(null);
  const cardsRef = useRef<LoyaltyCard[]>([]);
  const rewardsByMerchantRef = useRef<Record<string, Reward[]>>({});

  useEffect(() => {
    async function init() {
      const u = await getOrCreateUser();
      if (!u) return;
      setUser(u);
      userRef.current = u;
      let c = await getUserCards(u.id);

      const expired = c.filter((card) => getExpiryStatus(card).expired);
      if (expired.length > 0) {
        await Promise.all(expired.map((card) => expireCard(card.id)));
        c = await getUserCards(u.id);
      }

      setCards(c);
      cardsRef.current = c;
      applyRewardsByMerchant(await getRewardsForMerchants(c.map((card) => card.merchant_id)));

      const promos = await getPromotionsForUser(u.id);
      if (promos.length > 0) {
        const seenAt = localStorage.getItem('stackpot_promos_seen_at');
        const newest = new Date(promos[0].created_at).getTime();
        setHasUnreadPromos(!seenAt || newest > new Date(seenAt).getTime());
      }
    }
    init();
  }, []);

  // Realtime subscription — fires when merchant issues a stamp
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`wallet-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'loyalty_cards', filter: `user_id=eq.${user.id}` },
        async (payload) => {
          const updated = payload.new as LoyaltyCard;
          const prev = cardsRef.current.find((c) => c.id === updated.id);
          const prevCount = prev?.stamps_current ?? 0;

          // If card not in local state yet (first stamp), fetch full card with merchant join
          let merged: LoyaltyCard;
          if (!prev) {
            const fresh = await getUserCards(user.id);
            setCards(fresh);
            cardsRef.current = fresh;
            merged = fresh.find((c) => c.id === updated.id) ?? updated;
            applyRewardsByMerchant(await getRewardsForMerchants(fresh.map((c) => c.merchant_id)));
          } else {
            merged = { ...updated, merchants: prev.merchants };
            const newCards = cardsRef.current.map((c) => c.id === merged.id ? merged : c);
            setCards(newCards);
            cardsRef.current = newCards;
          }

          // Balance decreased — either a tier was redeemed (deducted by that tier's
          // cost) or the card expired (reset fully to 0). Either way, no "new treat"
          // animation applies, just the redeemed toast.
          if (updated.stamps_current < prevCount) {
            setRedeemedToast(true);
            setTimeout(() => setRedeemedToast(false), 2500);
            return;
          }

          // Only animate if stamp count actually increased
          if (updated.stamps_current <= prevCount) return;

          const rewards = rewardsByMerchantRef.current[merged.merchant_id] ?? [];
          const target = cheapestActiveCost(rewards, merged.merchants?.stamp_target ?? 9);
          const isReward = updated.stamps_current >= target;

          if (dismissTimer.current) clearTimeout(dismissTimer.current);
          setStampEvent({ card: merged, newCount: updated.stamps_current, isReward });

          if (!isReward) {
            dismissTimer.current = setTimeout(() => setStampEvent(null), 3000);
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  function applyRewardsByMerchant(map: Record<string, Reward[]>) {
    setRewardsByMerchant(map);
    rewardsByMerchantRef.current = map;
  }

  function dismissStampEvent() {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    setStampEvent(null);
  }

  const isEmpty = cards.length === 0;
  const atRiskCards = cards.filter((card) => getExpiryStatus(card, rewardsByMerchant[card.merchant_id] ?? []).atRisk);
  const hasReadyReward = cards.some((card) =>
    card.stamps_current >= cheapestActiveCost(rewardsByMerchant[card.merchant_id] ?? [], card.merchants?.stamp_target ?? 9),
  );

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#FAF9F6' }}>
      {stampEvent && (
        <StampOverlay
          card={stampEvent.card}
          newCount={stampEvent.newCount}
          isReward={stampEvent.isReward}
          rewards={rewardsByMerchant[stampEvent.card.merchant_id] ?? []}
          onDismiss={dismissStampEvent}
        />
      )}

      {redeemedToast && (
        <div style={{
          position: 'fixed', top: 'calc(env(safe-area-inset-top) + 16px)', left: '50%', transform: 'translateX(-50%)',
          zIndex: 70, background: '#1C1C1A', color: '#FFFFFF', padding: '10px 20px', borderRadius: 9999,
          fontSize: 14, fontWeight: 500, boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        }}>
          Redeemed! 🎉
        </div>
      )}

      <main style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {/* Top bar */}
        <div style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 14px)', padding: '0 16px', marginBottom: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => router.push('/receipts')} aria-label="Receipts" style={walletMarkStyle}>
              <svg width="17" height="17" viewBox="0 0 22 22" fill="none">
                <path d="M5 3h12v16l-2.5-1.5L12 19l-2.5-1.5L7 19l-2-1.5V3z" stroke="#1C1C1A" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M8 8h6M8 11.5h6M8 15h3" stroke="#1C1C1A" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
            <button onClick={() => router.push('/account')} aria-label="Account" style={walletMarkStyle}>
              <svg width="17" height="17" viewBox="0 0 22 22" fill="none">
                <rect x="2" y="6" width="18" height="13" rx="3" stroke="#1C1C1A" strokeWidth="1.6" />
                <path d="M2 10h18" stroke="#1C1C1A" strokeWidth="1.6" />
                <rect x="14" y="13" width="4" height="2.5" rx="1.25" fill="#1C1C1A" />
              </svg>
            </button>
          </div>

          {atRiskCards.length > 0 && (
            <div style={{
              background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 9999,
              padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ fontSize: 12 }}>⚠️</span>
              <p style={{ color: '#D97706', fontWeight: 800, fontSize: 10.5, letterSpacing: '0.05em', margin: 0 }}>
                AVOID LOSING TREATS
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => router.push('/promos')} aria-label="Promos" style={{ ...walletMarkStyle, position: 'relative' }}>
              <svg width="17" height="17" viewBox="0 0 22 22" fill="none">
                <path d="M5 16V9.5a6 6 0 0112 0V16l2 2H3l2-2z" stroke="#1C1C1A" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M8.5 18.5a2.5 2.5 0 005 0" stroke="#1C1C1A" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              {hasUnreadPromos && (
                <span style={{
                  position: 'absolute', top: 7, right: 7, width: 8, height: 8, borderRadius: '50%',
                  background: '#DC2626', border: '1.5px solid #FFFFFF',
                }} />
              )}
            </button>
            <button onClick={() => router.push('/nearby')} aria-label="Nearby vendors" style={walletMarkStyle}>
              <svg width="17" height="17" viewBox="0 0 22 22" fill="none">
                <path d="M11 20s7-6.5 7-11.5A7 7 0 004 8.5C4 13.5 11 20 11 20z" stroke="#1C1C1A" strokeWidth="1.6" strokeLinejoin="round" />
                <circle cx="11" cy="8.5" r="2.4" stroke="#1C1C1A" strokeWidth="1.6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Hero — scan to claim */}
        <div style={{ textAlign: 'center', padding: '18px 16px 26px' }}>
          <p style={{
            color: '#1C1C1A', fontWeight: 800, fontSize: 13, letterSpacing: '0.12em', margin: '0 0 18px',
            fontFamily: "'Syne', sans-serif",
          }}>
            SCAN VENDOR QR CODE
          </p>

          <div style={{
            position: 'relative', width: 168, height: 118, margin: '0 auto 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={cornerStyle('tl')} />
            <div style={cornerStyle('tr')} />
            <div style={cornerStyle('bl')} />
            <div style={cornerStyle('br')} />
            <CandyMascot excited={hasReadyReward} size={104} />
          </div>

          <button
            onClick={() => router.push('/scan')}
            style={{
              background: '#13B96D', color: '#FFFFFF', border: 'none', borderRadius: 9999,
              padding: '13px 28px', fontSize: 14, fontWeight: 700, letterSpacing: '0.03em',
              cursor: 'pointer', fontFamily: 'inherit', touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent', boxShadow: '0 6px 18px rgba(19,185,109,0.3)',
            }}
          >
            + CLAIM A TREAT
          </button>
        </div>

        {/* My Treats — dark panel */}
        <div style={{
          background: '#1C1C1A', borderRadius: '28px 28px 0 0', padding: '22px 18px 28px',
          minHeight: 240, boxShadow: '0 -8px 24px rgba(0,0,0,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <h1 style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 19, margin: 0, fontFamily: "'Syne', sans-serif", letterSpacing: '-0.01em' }}>
              My Treats
            </h1>
            <button onClick={() => router.push('/history')} aria-label="Visit history" style={darkIconBtnStyle}>
              <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
                <line x1="4" y1="6" x2="18" y2="6" stroke="rgba(255,255,255,0.75)" strokeWidth="1.6" strokeLinecap="round" />
                <circle cx="9" cy="6" r="2.1" fill="rgba(255,255,255,0.75)" />
                <line x1="4" y1="11" x2="18" y2="11" stroke="rgba(255,255,255,0.75)" strokeWidth="1.6" strokeLinecap="round" />
                <circle cx="14" cy="11" r="2.1" fill="rgba(255,255,255,0.75)" />
                <line x1="4" y1="16" x2="18" y2="16" stroke="rgba(255,255,255,0.75)" strokeWidth="1.6" strokeLinecap="round" />
                <circle cx="7" cy="16" r="2.1" fill="rgba(255,255,255,0.75)" />
              </svg>
            </button>
          </div>

          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, margin: '0 0 18px' }}>
            {hasReadyReward
              ? 'You have a big treat ready to redeem!'
              : isEmpty
                ? 'Scan a vendor to start your first treat card'
                : 'You have some big treats coming up'}
          </p>

          {isEmpty ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>No treats collected yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {cards.map((card, i) => {
                const rewards = rewardsByMerchant[card.merchant_id] ?? [];
                const expiry = getExpiryStatus(card, rewards);
                return (
                  <StampCard
                    key={card.id}
                    merchantId={card.merchant_id}
                    index={i}
                    merchantName={card.merchants?.name ?? 'Unknown'}
                    stampsEarned={card.stamps_current}
                    rewards={rewards}
                    expiryKind={expiry.kind}
                    expiryDaysRemaining={expiry.daysRemaining}
                    expiryAtRisk={expiry.atRisk}
                    onOpenVendor={(merchantId) => router.push(`/nearby/${merchantId}`)}
                  />
                );
              })}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 22 }}>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10.5, lineHeight: 1.4, margin: 0, maxWidth: 220 }}>
              Treats for a vendor expire after 90 days of inactivity — use them before they're gone.
            </p>
            <button
              aria-label="Help"
              title="Treats expire after 90 days without a visit. Redeeming resets your progress with that vendor."
              style={{
                width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)',
                fontSize: 12, fontWeight: 700, cursor: 'default', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit',
              }}
            >
              ?
            </button>
          </div>
        </div>
      </main>

      <ConsumerNav />
    </div>
  );
}

const walletMarkStyle: React.CSSProperties = {
  width: 36, height: 36, borderRadius: '50%', background: '#FFFFFF', border: '1px solid #EBEBE8',
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', flexShrink: 0,
};

const darkIconBtnStyle: React.CSSProperties = {
  width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center',
  justifyContent: 'center', cursor: 'pointer', touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent', flexShrink: 0,
};

function cornerStyle(pos: 'tl' | 'tr' | 'bl' | 'br'): React.CSSProperties {
  const base: React.CSSProperties = { position: 'absolute', width: 22, height: 22 };
  const color = '#13B96D';
  switch (pos) {
    case 'tl': return { ...base, top: 0, left: 0, borderTop: `3px solid ${color}`, borderLeft: `3px solid ${color}`, borderTopLeftRadius: 10 };
    case 'tr': return { ...base, top: 0, right: 0, borderTop: `3px solid ${color}`, borderRight: `3px solid ${color}`, borderTopRightRadius: 10 };
    case 'bl': return { ...base, bottom: 0, left: 0, borderBottom: `3px solid ${color}`, borderLeft: `3px solid ${color}`, borderBottomLeftRadius: 10 };
    case 'br': return { ...base, bottom: 0, right: 0, borderBottom: `3px solid ${color}`, borderRight: `3px solid ${color}`, borderBottomRightRadius: 10 };
  }
}

function StampOverlay({ card, newCount, isReward, rewards, onDismiss }: {
  card: LoyaltyCard;
  newCount: number;
  isReward: boolean;
  rewards: Reward[];
  onDismiss: () => void;
}) {
  const target = cheapestActiveCost(rewards, card.merchants?.stamp_target ?? 9);
  const toGo = Math.max(0, target - newCount);
  const rewardLabel = rewards.find((r) => r.active && r.cost === target)?.label ?? card.merchants?.reward_label ?? 'Reward';

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(28,28,26,0.5)', backdropFilter: 'blur(6px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '0 16px',
      }}
      onClick={isReward ? undefined : onDismiss}
    >
      {/* Big stamp / reward icon */}
      <div style={{ marginBottom: 28, animation: 'stampDrop 500ms cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
        <div style={{
          width: 100, height: 100, borderRadius: isReward ? 28 : '50%',
          background: isReward ? 'linear-gradient(135deg,#F59E0B,#D97706)' : '#13B96D',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: isReward ? '0 8px 32px rgba(217,119,6,0.45)' : '0 8px 32px rgba(19,185,109,0.4)',
          fontSize: isReward ? 48 : undefined,
        }}>
          {isReward ? '🎉' : (
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path d="M10 24l10 10 18-18" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>

      {/* Card */}
      <div
        style={{
          background: '#FFFFFF', borderRadius: 24, padding: 24,
          width: '100%', maxWidth: 380,
          boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
          animation: 'slideUp 350ms 150ms cubic-bezier(0.34,1.2,0.64,1) both',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <p style={{ fontSize: 20, fontWeight: 700, color: '#1C1C1A', margin: '0 0 4px', fontFamily: "'Syne', sans-serif", letterSpacing: '-0.02em', textAlign: 'center' }}>
          {isReward ? 'Reward unlocked!' : 'Treat received!'}
        </p>
        <p style={{ color: '#AEADA7', fontSize: 14, margin: '0 0 20px', textAlign: 'center' }}>
          {card.merchants?.name}
        </p>

        {/* Stamp grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(34px, 1fr))',
          gap: 7, marginBottom: 16,
        }}>
          {Array.from({ length: target }).map((_, i) => {
            const filled = i < newCount;
            const isNew = i === newCount - 1;
            return (
              <div key={i} style={{
                aspectRatio: '1', borderRadius: '50%',
                background: filled ? (isReward ? '#FEF3C7' : '#DCFCE7') : '#F7F7F5',
                border: `1.5px solid ${filled ? (isReward ? '#FCD34D' : '#13B96D') : '#EBEBE8'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: isNew ? 'newStamp 450ms 500ms cubic-bezier(0.34,1.56,0.64,1) both' : undefined,
              }}>
                {filled && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7l3 3L11.5 4" stroke={isReward ? '#D97706' : '#13B96D'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>

        {isReward ? (
          <div style={{ background: '#FFFBEB', borderRadius: 12, padding: '14px 18px', marginBottom: 16, textAlign: 'center', border: '1px solid #FCD34D' }}>
            <p style={{ color: '#D97706', fontWeight: 600, margin: 0 }}>{rewardLabel}</p>
            <p style={{ color: '#AEADA7', fontSize: 13, margin: '4px 0 0' }}>Tap your card in the wallet to redeem</p>
          </div>
        ) : (
          <p style={{ color: '#AEADA7', fontSize: 13, textAlign: 'center', margin: '0 0 16px' }}>
            {newCount} of {target} · {toGo} more to go
          </p>
        )}

        <button onClick={onDismiss} style={{
          width: '100%', padding: '14px', borderRadius: 14,
          background: isReward ? '#D97706' : '#13B96D',
          color: '#FFFFFF', fontWeight: 600, fontSize: 16,
          border: 'none', cursor: 'pointer', touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit',
        }}>
          {isReward ? 'Got it' : 'Done'}
        </button>
      </div>

      <style>{`
        @keyframes stampDrop {
          0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
          60%  { transform: scale(1.15) rotate(3deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes newStamp {
          from { transform: scale(0); }
          to   { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

