'use client';

import { Merchant } from '../../lib/supabase';

interface VendorListItemProps {
  merchant: Merchant;
  distanceKm: number | null;
  onTap: () => void;
  disabled?: boolean;
}

export default function VendorListItem({ merchant, distanceKm, onTap, disabled }: VendorListItemProps) {
  return (
    <button
      onClick={onTap}
      disabled={disabled}
      style={{
        width: '100%', textAlign: 'left', background: '#FFFFFF', border: '1px solid #EBEBE8',
        borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 12, cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.6 : 1, fontFamily: 'inherit',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <p style={{ color: '#1C1C1A', fontWeight: 600, margin: 0, fontSize: 15, fontFamily: "'Syne', sans-serif" }}>{merchant.name}</p>
        <p style={{ color: '#AEADA7', fontSize: 12, margin: '2px 0 0' }}>{merchant.reward_label}</p>
      </div>
      {distanceKm !== null && (
        <span style={{ color: '#13B96D', fontSize: 12, fontWeight: 600, flexShrink: 0, fontFamily: "'DM Mono', monospace" }}>
          {distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`} away
        </span>
      )}
    </button>
  );
}
