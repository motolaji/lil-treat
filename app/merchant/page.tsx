'use client';

import { supabase } from '../../lib/supabase';
import QRDisplay from '../components/QRDisplay';
import { useMerchant } from './MerchantContext';

export default function MerchantQRPage() {
  const { merchant } = useMerchant();

  const merchantQR = merchant
    ? JSON.stringify({ type: 'merchant', merchant_id: merchant.id })
    : '';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, paddingTop: 'env(safe-area-inset-top)' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#1C1C1A', fontFamily: "'Syne', sans-serif", letterSpacing: '-0.02em' }}>
            {merchant?.name ?? 'Stackpot Merchant'}
          </h1>
          <p style={{ color: '#AEADA7', fontSize: 12, margin: '2px 0 0' }}>Merchant portal</p>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          style={{
            background: '#FFFFFF', border: '1px solid #EBEBE8',
            color: '#AEADA7', borderRadius: 9999, padding: '6px 14px',
            fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', touchAction: 'manipulation',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          }}
        >
          Sign out
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <p style={{ color: '#AEADA7', fontSize: 14, margin: 0, textAlign: 'center' }}>
          Place this on the counter — customers scan it to earn stamps
        </p>
        {merchantQR ? (
          <QRDisplay value={merchantQR} size={Math.min(typeof window !== 'undefined' ? window.innerWidth - 80 : 280, 300)} />
        ) : (
          <div style={{ width: 300, height: 300, background: '#FFFFFF', borderRadius: 20, border: '1px solid #EBEBE8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#AEADA7' }}>Loading…</p>
          </div>
        )}
        <div style={{
          background: '#FFFFFF', border: '1px solid #EBEBE8',
          borderRadius: 16, padding: '14px 20px', width: '100%', maxWidth: 360,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <p style={{ color: '#AEADA7', fontSize: 12, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>Reward</p>
          <p style={{ color: '#1C1C1A', fontSize: 15, fontWeight: 600, margin: 0 }}>
            {merchant?.stamp_target ?? '—'} stamps → {merchant?.reward_label ?? '…'}
          </p>
        </div>
      </div>
    </div>
  );
}
