'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import RedeemQRModal from '../../components/RedeemQRModal';
import {
  getOrCreateUser, getOrCreateCard, getMerchantRewards,
  LoyaltyCard, UserRow, Reward,
} from '../../../lib/supabase';
import { getInventoryItems, InventoryItem } from '../../../lib/inventory';

type Tab = 'redeem' | 'collect';

export default function VendorDetailPage() {
  const router = useRouter();
  const params = useParams<{ merchantId: string }>();
  const searchParams = useSearchParams();
  const merchantId = params.merchantId;
  const tab: Tab = searchParams.get('tab') === 'collect' ? 'collect' : 'redeem';

  const [user, setUser] = useState<UserRow | null>(null);
  const [card, setCard] = useState<LoyaltyCard | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeemingReward, setRedeemingReward] = useState<Reward | null>(null);

  useEffect(() => {
    async function load() {
      const u = await getOrCreateUser();
      if (!u) { setLoading(false); return; }
      setUser(u);

      const [c, r, inv] = await Promise.all([
        getOrCreateCard(u.id, merchantId),
        getMerchantRewards(merchantId, true),
        getInventoryItems(merchantId),
      ]);
      setCard(c);
      setRewards(r);
      setItems(inv.filter((item) => item.treats_value > 0));
      setLoading(false);
    }
    load();
  }, [merchantId]);

  function setTab(next: Tab) {
    router.push(`/nearby/${merchantId}?tab=${next}`);
  }

  const merchantName = card?.merchants?.name ?? 'Vendor';
  const balance = card?.stamps_current ?? 0;

  return (
    <div style={{ minHeight: '100dvh', background: '#F7F7F5', padding: '16px' }}>
      {redeemingReward && card && user && (
        <RedeemQRModal
          card={card}
          user={user}
          reward={redeemingReward}
          onClose={() => setRedeemingReward(null)}
        />
      )}

      <div style={{ paddingTop: 'env(safe-area-inset-top)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.push('/nearby')} style={backBtnStyle}>‹</button>
        <div style={{ minWidth: 0 }}>
          <h1 style={titleStyle}>{merchantName}</h1>
          {!loading && (
            <p style={{ color: '#AEADA7', fontSize: 13, margin: '2px 0 0' }}>
              {balance} small treats collected
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <p style={{ color: '#AEADA7', fontSize: 14, textAlign: 'center', paddingTop: 40 }}>Loading…</p>
      ) : (
        <>
          <div style={{ display: 'flex', background: '#EBEBE8', borderRadius: 12, padding: 3, gap: 2, marginBottom: 16 }}>
            {(['redeem', 'collect'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 9, border: 'none',
                  background: tab === t ? '#FFFFFF' : 'transparent',
                  color: tab === t ? '#1C1C1A' : '#AEADA7',
                  fontWeight: tab === t ? 600 : 400,
                  fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {t === 'redeem' ? 'Redeem Big Treats' : 'Collect Small Treats'}
              </button>
            ))}
          </div>

          {tab === 'redeem' ? (
            rewards.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {rewards.map((reward) => {
                  const ready = balance >= reward.cost;
                  const progress = Math.min(balance / reward.cost, 1);
                  return (
                    <div key={reward.id} style={{
                      background: ready ? '#DCFCE7' : '#FFFFFF',
                      border: `1px solid ${ready ? '#13B96D' : '#EBEBE8'}`,
                      borderRadius: 16, padding: '16px 18px',
                    }}>
                      <p style={{ color: '#1C1C1A', fontWeight: 700, fontSize: 15, margin: '0 0 4px', fontFamily: "'Syne', sans-serif" }}>
                        {reward.label}
                      </p>
                      {reward.description && (
                        <p style={{ color: '#AEADA7', fontSize: 13, margin: '0 0 10px' }}>{reward.description}</p>
                      )}
                      <div style={{ height: 5, background: '#F7F7F5', borderRadius: 9999, marginBottom: 10, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${progress * 100}%`, borderRadius: 9999,
                          background: ready ? '#13B96D' : '#F59E0B', transition: 'width 0.5s ease',
                        }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <p style={{ color: '#AEADA7', fontSize: 12, margin: 0 }}>
                          {balance}/{reward.cost} small treats collected
                        </p>
                        <button
                          onClick={() => setRedeemingReward(reward)}
                          disabled={!ready}
                          style={{
                            padding: '8px 16px', borderRadius: 9999, border: 'none', fontSize: 12,
                            fontWeight: 700, cursor: ready ? 'pointer' : 'default',
                            background: ready ? '#13B96D' : '#F7F7F5',
                            color: ready ? '#FFFFFF' : '#AEADA7',
                            fontFamily: 'inherit', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                          }}
                        >
                          Redeem now
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', paddingTop: 40 }}>
                <p style={{ color: '#AEADA7', fontSize: 14 }}>No big treats set up yet</p>
              </div>
            )
          ) : (
            items.length > 0 ? (
              <div style={{ background: '#FFFFFF', border: '1px solid #EBEBE8', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ display: 'flex', padding: '12px 18px', borderBottom: '1px solid #EBEBE8' }}>
                  <p style={{ flex: 1, color: '#AEADA7', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, margin: 0 }}>Item</p>
                  <p style={{ color: '#AEADA7', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, margin: 0 }}>Small treats</p>
                </div>
                {items.map((item) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid #F7F7F5' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: '#1C1C1A', fontSize: 14, fontWeight: 600, margin: 0 }}>{item.name}</p>
                      <p style={{ color: '#AEADA7', fontSize: 12, margin: '2px 0 0' }}>£{item.price.toFixed(2)}</p>
                    </div>
                    <p style={{ color: '#13B96D', fontSize: 14, fontWeight: 700, margin: 0 }}>{item.treats_value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', paddingTop: 40 }}>
                <p style={{ color: '#AEADA7', fontSize: 14 }}>No small treat rates set up yet</p>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}

const titleStyle: React.CSSProperties = {
  fontSize: 20, fontWeight: 700, margin: 0, color: '#1C1C1A',
  fontFamily: "'Syne', sans-serif", letterSpacing: '-0.02em',
};

const backBtnStyle: React.CSSProperties = {
  width: 32, height: 32, borderRadius: '50%', background: '#FFFFFF', border: '1px solid #EBEBE8',
  color: '#1C1C1A', fontSize: 20, lineHeight: 1, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
};
