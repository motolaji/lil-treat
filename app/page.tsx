'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import StampCard from './components/StampCard';
import QRDisplay from './components/QRDisplay';
import ConsumerNav from './components/ConsumerNav';
import { getOrCreateUser, getUserCards, LoyaltyCard, UserRow, supabase } from '../lib/supabase';

interface SavedCard {
  id: string;
  name: string;
  barcode: string;
}

interface StampEvent {
  card: LoyaltyCard;
  newCount: number;
  isReward: boolean;
}

export default function WalletPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserRow | null>(null);
  const [cards, setCards] = useState<LoyaltyCard[]>([]);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [showBarcode, setShowBarcode] = useState<string | null>(null);
  const [stampEvent, setStampEvent] = useState<StampEvent | null>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userRef = useRef<UserRow | null>(null);
  const cardsRef = useRef<LoyaltyCard[]>([]);

  useEffect(() => {
    async function init() {
      const u = await getOrCreateUser();
      if (!u) return;
      setUser(u);
      userRef.current = u;
      const c = await getUserCards(u.id);
      setCards(c);
      cardsRef.current = c;
    }
    init();

    const stored = localStorage.getItem('stackpot_saved_cards');
    if (stored) {
      try { setSavedCards(JSON.parse(stored)); } catch { /* ignore */ }
    }
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

          // If card not in local state yet (first stamp), fetch full card with merchant join
          let merged: LoyaltyCard;
          if (!prev) {
            const fresh = await getUserCards(user.id);
            setCards(fresh);
            cardsRef.current = fresh;
            merged = fresh.find((c) => c.id === updated.id) ?? updated;
          } else {
            merged = { ...updated, merchants: prev.merchants };
            const newCards = cardsRef.current.map((c) => c.id === merged.id ? merged : c);
            setCards(newCards);
            cardsRef.current = newCards;
          }

          // Only animate if stamp count actually increased
          const prevCount = prev?.stamps_current ?? 0;
          if (updated.stamps_current <= prevCount) return;

          const target = merged.merchants?.stamp_target ?? 9;
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

  function dismissStampEvent() {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    setStampEvent(null);
  }

  function deleteSavedCard(id: string) {
    const updated = savedCards.filter((c) => c.id !== id);
    setSavedCards(updated);
    localStorage.setItem('stackpot_saved_cards', JSON.stringify(updated));
  }

  const isEmpty = cards.length === 0 && savedCards.length === 0;

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#F7F7F5' }}>
      {showBarcode && (
        <BarcodeModal
          card={savedCards.find((c) => c.id === showBarcode)!}
          onClose={() => setShowBarcode(null)}
        />
      )}

      {stampEvent && (
        <StampOverlay
          card={stampEvent.card}
          newCount={stampEvent.newCount}
          isReward={stampEvent.isReward}
          onDismiss={dismissStampEvent}
        />
      )}

      <main style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px' }}>
        <div style={{ paddingTop: 'env(safe-area-inset-top)', marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#1C1C1A', fontFamily: "'Syne', sans-serif", letterSpacing: '-0.02em' }}>Stackpot</h1>
          {user && (
            <p style={{ fontSize: 12, color: '#AEADA7', margin: '2px 0 0', fontFamily: "'DM Mono', monospace" }}>
              {user.handle}
            </p>
          )}
        </div>

        {isEmpty ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 80, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>☕</div>
            <p style={{ color: '#1C1C1A', fontSize: 17, fontWeight: 600, margin: '8px 0 0', fontFamily: "'Syne', sans-serif" }}>Your wallet is empty</p>
            <p style={{ color: '#AEADA7', fontSize: 14, margin: 0 }}>Tap Scan to earn your first stamp</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {cards.map((card) => (
              <StampCard
                key={card.id}
                merchantName={card.merchants?.name ?? 'Unknown'}
                stampsEarned={card.stamps_current}
                stampTarget={card.merchants?.stamp_target ?? 9}
                rewardLabel={card.merchants?.reward_label ?? 'Reward'}
              />
            ))}

            {savedCards.map((sc) => (
              <div key={sc.id} style={{
                background: '#FFFFFF', border: '1px solid #EBEBE8',
                borderRadius: 20, padding: '16px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}>
                <div>
                  <p style={{ color: '#1C1C1A', fontWeight: 500, margin: 0 }}>{sc.name}</p>
                  <p style={{ color: '#AEADA7', fontSize: 12, margin: '2px 0 0', fontFamily: "'DM Mono', monospace" }}>
                    {sc.barcode.length > 22 ? sc.barcode.slice(0, 22) + '…' : sc.barcode}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setShowBarcode(sc.id)} style={pillBtn('#13B96D', '#FFFFFF')}>Show</button>
                  <button onClick={() => deleteSavedCard(sc.id)} style={pillBtn('#F7F7F5', '#AEADA7')}>✕</button>
                </div>
              </div>
            ))}

            <button
              onClick={() => router.push('/scan?mode=barcode')}
              style={{
                background: 'transparent', border: '1.5px dashed #EBEBE8',
                borderRadius: 20, padding: '16px 20px', color: '#AEADA7',
                fontSize: 14, cursor: 'pointer', width: '100%', textAlign: 'center',
                fontFamily: 'inherit', touchAction: 'manipulation',
              }}
            >
              + Add loyalty card (scan barcode)
            </button>
          </div>
        )}
      </main>

      <ConsumerNav />
    </div>
  );
}

function StampOverlay({ card, newCount, isReward, onDismiss }: {
  card: LoyaltyCard;
  newCount: number;
  isReward: boolean;
  onDismiss: () => void;
}) {
  const target = card.merchants?.stamp_target ?? 9;
  const toGo = Math.max(0, target - newCount);

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
          {isReward ? 'Reward unlocked!' : 'Stamp received!'}
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
            <p style={{ color: '#D97706', fontWeight: 600, margin: 0 }}>{card.merchants?.reward_label}</p>
            <p style={{ color: '#AEADA7', fontSize: 13, margin: '4px 0 0' }}>Show to the merchant to claim</p>
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
          {isReward ? 'Claim reward' : 'Done'}
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

function BarcodeModal({ card, onClose }: { card: SavedCard; onClose: () => void }) {
  if (!card) return null;
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(28,28,26,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={onClose}
    >
      <div style={{ background: '#FFFFFF', borderRadius: 24, padding: 28, width: '100%', maxWidth: 360, textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.12)', border: '1px solid #EBEBE8' }} onClick={(e) => e.stopPropagation()}>
        <p style={{ color: '#1C1C1A', fontWeight: 600, fontSize: 17, margin: '0 0 6px', fontFamily: "'Syne', sans-serif" }}>{card.name}</p>
        <p style={{ color: '#AEADA7', fontSize: 12, fontFamily: "'DM Mono', monospace", margin: '0 0 20px', wordBreak: 'break-all' }}>{card.barcode}</p>
        <QRDisplay value={card.barcode} size={200} />
        <button onClick={onClose} style={{ ...pillBtn('#F7F7F5', '#1C1C1A'), marginTop: 20, padding: '12px 32px' }}>Close</button>
      </div>
    </div>
  );
}

function pillBtn(bg: string, color: string): React.CSSProperties {
  return {
    background: bg, color, border: 'none', borderRadius: 9999,
    padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
    fontFamily: 'inherit', touchAction: 'manipulation',
  };
}
