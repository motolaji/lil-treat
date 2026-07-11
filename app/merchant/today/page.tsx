'use client';

import { useEffect, useState } from 'react';
import { getTodayStamps, getTodayTransactions, getMerchantClaims, resolveClaim, PointClaim } from '../../../lib/supabase';
import { useMerchant } from '../MerchantContext';

export default function MerchantTodayPage() {
  const { merchant } = useMerchant();
  const [todayCount, setTodayCount] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [todayTx, setTodayTx] = useState<any[]>([]);
  const [claims, setClaims] = useState<PointClaim[]>([]);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    if (!merchant) return;
    async function load() {
      const [count, tx, allClaims] = await Promise.all([
        getTodayStamps(merchant!.id),
        getTodayTransactions(merchant!.id),
        getMerchantClaims(merchant!.id),
      ]);
      setTodayCount(count);
      setTodayTx(tx);
      setClaims(allClaims.filter((c) => c.status === 'pending'));
    }
    load();
  }, [merchant?.id]);

  async function handleResolve(claim: PointClaim, approve: boolean) {
    setResolvingId(claim.id);
    const ok = await resolveClaim(
      claim.id,
      approve,
      approve ? claim.loyalty_card_id : undefined,
      approve ? claim.merchant_id : undefined,
      approve ? claim.user_id : undefined,
    );
    setResolvingId(null);
    if (ok) setClaims((prev) => prev.filter((c) => c.id !== claim.id));
  }

  return (
    <div style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 20px', color: '#1C1C1A', fontFamily: "'Syne', sans-serif", letterSpacing: '-0.02em' }}>Today</h1>

      <div style={{
        background: '#FFFFFF', border: '1px solid #EBEBE8',
        borderRadius: 20, padding: '24px', textAlign: 'center', marginBottom: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <p style={{ color: '#AEADA7', fontSize: 12, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>Treats issued today</p>
        <p style={{ color: '#13B96D', fontSize: 56, fontWeight: 700, margin: 0, lineHeight: 1, fontFamily: "'Syne', sans-serif" }}>{todayCount}</p>
      </div>

      {claims.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          <p style={{ color: '#AEADA7', fontSize: 11, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
            Pending claims
          </p>
          {claims.map((claim) => (
            <div key={claim.id} style={{
              background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 12, padding: '14px 16px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}>
              <p style={{ color: '#1C1C1A', fontSize: 14, margin: '0 0 2px', fontFamily: "'DM Mono', monospace" }}>
                {claim.users?.handle ?? 'unknown'}
              </p>
              <p style={{ color: '#1C1C1A', fontSize: 13, margin: '0 0 10px' }}>{claim.note}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleResolve(claim, false)}
                  disabled={resolvingId === claim.id}
                  style={{ flex: 1, padding: '9px', background: '#FFFFFF', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 9999, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Reject
                </button>
                <button
                  onClick={() => handleResolve(claim, true)}
                  disabled={resolvingId === claim.id}
                  style={{ flex: 1, padding: '9px', background: '#13B96D', color: '#FFFFFF', border: 'none', borderRadius: 9999, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {todayTx.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ color: '#AEADA7', fontSize: 11, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>Recent activity</p>
          {todayTx.map((tx, i) => {
            const handle = tx.loyalty_cards?.users?.handle ?? 'unknown';
            const time = new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return (
              <div key={i} style={{
                background: '#FFFFFF', border: '1px solid #EBEBE8',
                borderRadius: 12, padding: '12px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              }}>
                <p style={{ color: '#1C1C1A', fontSize: 14, margin: 0, fontFamily: "'DM Mono', monospace" }}>{handle}</p>
                <p style={{ color: '#AEADA7', fontSize: 12, margin: 0 }}>{time}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', paddingTop: 40 }}>
          <p style={{ color: '#AEADA7', fontSize: 14 }}>No treats issued yet today</p>
        </div>
      )}
    </div>
  );
}
