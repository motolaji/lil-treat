'use client';

interface StampCardProps {
  merchantName: string;
  stampsEarned: number;
  stampTarget: number;
  rewardLabel: string;
  newStampIndex?: number; // index of the stamp to animate (optional)
}

export default function StampCard({
  merchantName,
  stampsEarned,
  stampTarget,
  rewardLabel,
  newStampIndex,
}: StampCardProps) {
  const isComplete = stampsEarned >= stampTarget;
  const toGo = Math.max(0, stampTarget - stampsEarned);

  return (
    <div style={{
      background: '#14141c',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 20,
      padding: '20px 20px 16px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <p style={{ color: '#f0ede8', fontWeight: 600, fontSize: 16, margin: 0 }}>{merchantName}</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '4px 0 0' }}>
            {isComplete
              ? '🎉 Reward unlocked!'
              : `${stampsEarned} of ${stampTarget} · ${toGo} to go`}
          </p>
        </div>
        {isComplete && (
          <span style={{
            background: '#f59e0b',
            color: '#0a0a0f',
            fontSize: 11,
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: 9999,
            letterSpacing: '0.05em',
          }}>
            REWARD
          </span>
        )}
      </div>

      {/* Stamp grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(36px, 1fr))',
        gap: 8,
      }}>
        {Array.from({ length: stampTarget }).map((_, i) => {
          const filled = i < stampsEarned;
          const isNew = newStampIndex !== undefined && i === newStampIndex;
          return (
            <div
              key={i}
              style={{
                aspectRatio: '1',
                borderRadius: '50%',
                background: filled ? '#6ee7b7' : 'rgba(255,255,255,0.06)',
                border: filled ? 'none' : '1.5px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: isNew ? 'stampDrop 300ms ease-out' : undefined,
              }}
            >
              {filled && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8l3.5 3.5L13 5" stroke="#0a0a0f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          );
        })}
      </div>

      {/* Reward label */}
      {isComplete && (
        <div style={{
          marginTop: 12,
          padding: '10px 14px',
          background: 'rgba(245,158,11,0.12)',
          borderRadius: 10,
          border: '1px solid rgba(245,158,11,0.25)',
        }}>
          <p style={{ color: '#f59e0b', fontSize: 13, fontWeight: 500, margin: 0 }}>{rewardLabel}</p>
        </div>
      )}

      <style>{`
        @keyframes stampDrop {
          from { transform: scale(2); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
