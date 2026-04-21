'use client';

interface StampCardProps {
  merchantName: string;
  stampsEarned: number;
  stampTarget: number;
  rewardLabel: string;
  newStampIndex?: number;
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
  const progress = Math.min(stampsEarned / stampTarget, 1);

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #EBEBE8',
      borderRadius: 20,
      padding: '20px 20px 18px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.03)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <p style={{ color: '#1C1C1A', fontWeight: 600, fontSize: 16, margin: 0, fontFamily: "'Syne', sans-serif" }}>{merchantName}</p>
          <p style={{ color: '#AEADA7', fontSize: 13, margin: '3px 0 0' }}>
            {isComplete ? 'Reward unlocked!' : `${stampsEarned} of ${stampTarget} · ${toGo} to go`}
          </p>
        </div>
        {isComplete && (
          <span style={{
            background: '#FEF3C7',
            color: '#D97706',
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

      {/* Progress bar */}
      <div style={{ height: 4, background: '#F0EFE9', borderRadius: 9999, marginBottom: 14, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${progress * 100}%`,
          background: isComplete ? '#D97706' : '#13B96D',
          borderRadius: 9999,
          transition: 'width 0.4s ease',
        }} />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(34px, 1fr))',
        gap: 7,
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
                background: filled ? (isComplete ? '#FEF3C7' : '#DCFCE7') : '#F7F7F5',
                border: `1.5px solid ${filled ? (isComplete ? '#FCD34D' : '#13B96D') : '#EBEBE8'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: isNew ? 'stampDrop 300ms ease-out' : undefined,
              }}
            >
              {filled && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2.5 7l3 3L11.5 4" stroke={isComplete ? '#D97706' : '#13B96D'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          );
        })}
      </div>

      {isComplete && (
        <div style={{
          marginTop: 14,
          padding: '10px 14px',
          background: '#FFFBEB',
          borderRadius: 10,
          border: '1px solid #FCD34D',
        }}>
          <p style={{ color: '#D97706', fontSize: 13, fontWeight: 500, margin: 0 }}>{rewardLabel}</p>
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
