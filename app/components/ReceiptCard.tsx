'use client';

import { useState } from 'react';
import { Receipt } from '../../lib/supabase';

interface ReceiptCardProps {
  receipt: Receipt;
  showMerchant: boolean;
}

export default function ReceiptCard({ receipt, showMerchant }: ReceiptCardProps) {
  const [expanded, setExpanded] = useState(false);
  const merchantName = receipt.merchants?.name ?? 'Unknown';
  const date = new Date(receipt.created_at).toLocaleDateString('en-GB');

  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #EBEBE8', borderRadius: 14,
      padding: '14px 16px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    }}>
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: '100%', background: 'transparent', border: 'none', padding: 0, textAlign: 'left',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer',
          fontFamily: 'inherit', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        <div style={{ minWidth: 0 }}>
          {showMerchant && (
            <p style={{ color: '#1C1C1A', fontWeight: 600, margin: 0, fontSize: 14, fontFamily: "'Syne', sans-serif" }}>{merchantName}</p>
          )}
          <p style={{ color: '#AEADA7', fontSize: 12, margin: showMerchant ? '2px 0 0' : 0, fontFamily: "'DM Mono', monospace" }}>
            {date} · £{receipt.total_amount.toFixed(2)}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{
            background: '#DCFCE7', color: '#13B96D', fontSize: 11, fontWeight: 700,
            padding: '4px 10px', borderRadius: 9999,
          }}>
            +{receipt.total_treats_earned} treats
          </span>
          <span style={{ color: '#AEADA7', fontSize: 12, transform: expanded ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }}>▾</span>
        </div>
      </button>

      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #F7F7F5' }}>
          {receipt.line_items.length === 0 ? (
            <p style={{ color: '#AEADA7', fontSize: 13, margin: 0 }}>No itemized items on this receipt</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {receipt.line_items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <p style={{ color: '#1C1C1A', fontSize: 13, margin: 0 }}>
                    {item.qty}× {item.name}
                  </p>
                  <p style={{ color: '#AEADA7', fontSize: 13, margin: 0, fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>
                    £{(item.qty * item.unit_price).toFixed(2)} · {item.line_treats} treats
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
