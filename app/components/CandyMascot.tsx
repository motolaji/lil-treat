'use client';

interface CandyMascotProps {
  excited?: boolean;
  size?: number;
}

// A wrapped-toffee mascot — twist ends on either side of a rounded body,
// a simple friendly face, and a shine highlight. Turns gold when a reward
// is ready to claim, matching the amber reward palette used elsewhere.
export default function CandyMascot({ excited = false, size = 120 }: CandyMascotProps) {
  const bodyColor = excited ? '#F59E0B' : '#13B96D';
  const wrapColor = excited ? '#D97706' : '#0F9C5C';

  return (
    <div
      style={{
        width: size,
        height: size * 0.72,
        animation: `mascotSway ${excited ? '1.6s' : '2.6s'} ease-in-out infinite`,
        transformOrigin: '50% 85%',
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 120 86" fill="none">
        <path d="M6 43 L27 30 L27 56 Z" fill={wrapColor} />
        <path d="M0 43 L16 34 L16 52 Z" fill={wrapColor} opacity="0.6" />
        <path d="M114 43 L93 30 L93 56 Z" fill={wrapColor} />
        <path d="M120 43 L104 34 L104 52 Z" fill={wrapColor} opacity="0.6" />

        <ellipse cx="60" cy="43" rx="35" ry="30" fill={bodyColor} />
        <ellipse cx="47" cy="28" rx="9" ry="5.5" fill="#FFFFFF" opacity="0.3" transform="rotate(-25 47 28)" />

        <circle cx="49" cy="40" r="3.4" fill="#1C1C1A" />
        <circle cx="71" cy="40" r="3.4" fill="#1C1C1A" />
        <path d="M47 52 Q60 61 73 52" stroke="#1C1C1A" strokeWidth="3" strokeLinecap="round" fill="none" />
      </svg>

      <style>{`
        @keyframes mascotSway {
          0%, 100% { transform: rotate(-4deg) scale(1); }
          50%      { transform: rotate(4deg) scale(1.03); }
        }
      `}</style>
    </div>
  );
}
