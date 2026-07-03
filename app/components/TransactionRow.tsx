'use client';

import { TransactionRow as TransactionRowData } from '../../lib/supabase';

interface TransactionRowProps {
  transaction: TransactionRowData;
  showMerchant: boolean;
}

const TYPE_LABEL: Record<string, { text: string; color: string; bg: string }> = {
  earn: { text: '+1 treat', color: '#13B96D', bg: '#DCFCE7' },
  redeem: { text: 'Redeemed', color: '#D97706', bg: '#FFFBEB' },
  expire: { text: 'Expired', color: '#AEADA7', bg: '#F7F7F5' },
};

export default function TransactionRow({ transaction, showMerchant }: TransactionRowProps) {
  const merchantName = transaction.loyalty_cards?.merchants?.name ?? 'Unknown';
  const date = new Date(transaction.created_at).toLocaleDateString('en-GB');
  const amount = transaction.amount != null ? `£${transaction.amount.toFixed(2)}` : '—';
  const pill = TYPE_LABEL[transaction.type] ?? { text: transaction.type, color: '#1C1C1A', bg: '#F7F7F5' };

  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #EBEBE8', borderRadius: 14,
      padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    }}>
      <div style={{ minWidth: 0 }}>
        {showMerchant && (
          <p style={{ color: '#1C1C1A', fontWeight: 600, margin: 0, fontSize: 14, fontFamily: "'Syne', sans-serif" }}>{merchantName}</p>
        )}
        <p style={{ color: '#AEADA7', fontSize: 12, margin: showMerchant ? '2px 0 0' : 0, fontFamily: "'DM Mono', monospace" }}>
          {date} · {amount}
        </p>
      </div>
      <span style={{
        background: pill.bg, color: pill.color, fontSize: 11, fontWeight: 700,
        padding: '4px 10px', borderRadius: 9999, letterSpacing: '0.02em', flexShrink: 0,
      }}>
        {pill.text}
      </span>
    </div>
  );
}
