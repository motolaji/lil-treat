'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReceiptCard from '../components/ReceiptCard';
import { getOrCreateUser, getUserReceipts, Receipt } from '../../lib/supabase';

export default function ReceiptsPage() {
  const router = useRouter();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const params = new URLSearchParams(window.location.search);
      const merchantId = params.get('merchant') ?? undefined;

      const u = await getOrCreateUser();
      if (!u) { setLoading(false); return; }

      const list = await getUserReceipts(u.id, merchantId);
      setReceipts(list);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div style={{ minHeight: '100dvh', background: '#F7F7F5', padding: '16px' }}>
      <div style={{ paddingTop: 'env(safe-area-inset-top)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.push('/')} style={backBtnStyle}>‹</button>
        <h1 style={titleStyle}>Receipts</h1>
      </div>

      {loading ? (
        <p style={{ color: '#AEADA7', fontSize: 14, textAlign: 'center', paddingTop: 40 }}>Loading…</p>
      ) : receipts.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: 60 }}>
          <p style={{ color: '#AEADA7', fontSize: 14 }}>
            No receipts yet — itemized purchases show up here once a merchant scans your treats with items selected
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {receipts.map((receipt) => (
            <ReceiptCard key={receipt.id} receipt={receipt} showMerchant />
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
