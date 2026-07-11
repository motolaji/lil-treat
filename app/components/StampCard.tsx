'use client';

import { Reward } from '../../lib/supabase';
import { cheapestActiveCost } from '../../lib/rewards';

interface StampCardProps {
  merchantId: string;
  merchantName: string;
  stampsEarned: number;
  rewards: Reward[];
  index?: number;
  expiryKind: 'redeems' | 'resets';
  expiryDaysRemaining: number;
  expiryAtRisk: boolean;
  onOpenVendor?: (merchantId: string) => void;
}

function initial(name: string): string {
  return name.trim().slice(0, 1).toUpperCase() || '?';
}

function hueFromName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  return Math.abs(hash) % 360;
}

export default function StampCard({
  merchantId,
  merchantName,
  stampsEarned,
  rewards,
  index = 0,
  expiryKind,
  expiryDaysRemaining,
  expiryAtRisk,
  onOpenVendor,
}: StampCardProps) {
  const stampTarget = cheapestActiveCost(rewards);
  const isComplete = stampsEarned >= stampTarget;
  const progress = Math.min(stampsEarned / stampTarget, 1);
  const hue = hueFromName(merchantName);

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 18,
        padding: '16px 18px',
        animation: `treatCardIn 420ms ${index * 70}ms cubic-bezier(0.2,0.8,0.2,1) both`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
          background: `hsl(${hue}, 65%, 45%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#FFFFFF', fontWeight: 700, fontSize: 15, fontFamily: "'Syne', sans-serif",
        }}>
          {initial(merchantName)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 15, margin: 0, fontFamily: "'Syne', sans-serif" }}>
            {merchantName}
          </p>
          <p style={{ color: isComplete ? '#FCD34D' : 'rgba(255,255,255,0.45)', fontSize: 12, margin: '2px 0 0' }}>
            {stampsEarned}/{stampTarget} Small Treats Collected
          </p>
        </div>
      </div>

      <div style={{ height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 9999, marginBottom: 12, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${progress * 100}%`,
          borderRadius: 9999,
          background: isComplete ? 'linear-gradient(90deg,#F59E0B,#FCD34D)' : '#13B96D',
          transition: 'width 0.5s ease',
        }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <p style={{
          margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
          color: expiryKind === 'redeems' ? '#FCD34D' : (expiryAtRisk ? '#F87171' : 'rgba(255,255,255,0.35)'),
        }}>
          {expiryKind === 'redeems'
            ? `REDEEMS IN ${expiryDaysRemaining}D`
            : `RESETS IN ${expiryDaysRemaining}D`}
        </p>

        <button
          onClick={() => onOpenVendor?.(merchantId)}
          style={{
            padding: '8px 16px', borderRadius: 9999, border: 'none', fontSize: 11,
            fontWeight: 700, letterSpacing: '0.02em', cursor: 'pointer', fontFamily: 'inherit',
            flexShrink: 0, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            background: isComplete ? '#13B96D' : 'rgba(245,158,11,0.18)',
            color: isComplete ? '#FFFFFF' : '#FCD34D',
          }}
        >
          {isComplete ? 'REDEEM BIG TREAT' : 'VIEW BIG TREATS'}
        </button>
      </div>

      <style>{`
        @keyframes treatCardIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
