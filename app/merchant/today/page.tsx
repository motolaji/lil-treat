'use client';

import { useEffect, useState } from 'react';
import { getTodayStamps, getTodayTransactions } from '../../../lib/supabase';
import { useMerchant } from '../MerchantContext';

export default function MerchantTodayPage() {
  const { merchant } = useMerchant();
  const [todayCount, setTodayCount] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [todayTx, setTodayTx] = useState<any[]>([]);

  useEffect(() => {
    if (!merchant) return;
    async function load() {
      const [count, tx] = await Promise.all([getTodayStamps(merchant!.id), getTodayTransactions(merchant!.id)]);
      setTodayCount(count);
      setTodayTx(tx);
    }
    load();
  }, [merchant?.id]);

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
