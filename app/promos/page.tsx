'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getOrCreateUser, getPromotionsForUser, PromotionRow } from '../../lib/supabase';

export default function PromosPage() {
  const router = useRouter();
  const [promos, setPromos] = useState<PromotionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const u = await getOrCreateUser();
      if (!u) { setLoading(false); return; }
      const list = await getPromotionsForUser(u.id);
      setPromos(list);
      setLoading(false);
      localStorage.setItem('stackpot_promos_seen_at', new Date().toISOString());
    }
    load();
  }, []);

  return (
    <div style={{ minHeight: '100dvh', background: '#F7F7F5', padding: '16px' }}>
      <div style={{ paddingTop: 'env(safe-area-inset-top)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.push('/')} style={backBtnStyle}>‹</button>
        <h1 style={titleStyle}>Promos</h1>
      </div>

      {loading ? (
        <p style={{ color: '#AEADA7', fontSize: 14, textAlign: 'center', paddingTop: 40 }}>Loading…</p>
      ) : promos.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: 60 }}>
          <p style={{ color: '#AEADA7', fontSize: 14 }}>No promos yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {promos.map((promo) => (
            <div key={promo.id} style={{
              background: '#FFFFFF', border: '1px solid #EBEBE8', borderRadius: 14,
              padding: '14px 16px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}>
              <p style={{ color: '#AEADA7', fontSize: 11, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                {promo.merchants?.name ?? 'Vendor'}
              </p>
              <p style={{ color: '#1C1C1A', fontWeight: 600, margin: 0, fontSize: 15, fontFamily: "'Syne', sans-serif" }}>{promo.title}</p>
              <p style={{ color: '#1C1C1A', fontSize: 13, margin: '4px 0 0' }}>{promo.body}</p>
              <p style={{ color: '#AEADA7', fontSize: 11, margin: '8px 0 0', fontFamily: "'DM Mono', monospace" }}>
                {new Date(promo.created_at).toLocaleDateString('en-GB')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const titleStyle: React.CSSProperties = {
  fontSize: 22, fontWeight: 700, margin: 0, color: '#1C1C1A',
  fontFamily: "'Syne', sans-serif", letterSpacing: '-0.02em',
};

const backBtnStyle: React.CSSProperties = {
  width: 32, height: 32, borderRadius: '50%', background: '#FFFFFF', border: '1px solid #EBEBE8',
  color: '#1C1C1A', fontSize: 20, lineHeight: 1, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
};
