'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TransactionRow from '../components/TransactionRow';
import { getOrCreateUser, getUserTransactions, TransactionRow as TransactionRowData } from '../../lib/supabase';

export default function HistoryPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<TransactionRowData[]>([]);
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get('merchant');
    setMerchantId(m);

    async function load() {
      const u = await getOrCreateUser();
      if (!u) { setLoading(false); return; }
      const tx = await getUserTransactions(u.id, m ?? undefined);
      setTransactions(tx);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div style={{ minHeight: '100dvh', background: '#F7F7F5', padding: '16px' }}>
      <div style={{ paddingTop: 'env(safe-area-inset-top)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.push('/')} style={backBtnStyle}>‹</button>
        <h1 style={titleStyle}>{merchantId ? 'Visit history' : 'All visits'}</h1>
      </div>

      {loading ? (
        <p style={{ color: '#AEADA7', fontSize: 14, textAlign: 'center', paddingTop: 40 }}>Loading…</p>
      ) : transactions.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: 60 }}>
          <p style={{ color: '#AEADA7', fontSize: 14 }}>No visits yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {transactions.map((tx) => (
            <TransactionRow key={tx.id} transaction={tx} showMerchant={!merchantId} />
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
