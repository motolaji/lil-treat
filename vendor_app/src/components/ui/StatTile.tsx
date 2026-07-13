import type { CSSProperties } from 'react';
import { color, font, radius } from '../../styles/tokens';

interface StatTileProps {
  label: string;
  value: string | number;
  style?: CSSProperties;
}

export default function StatTile({ label, value, style }: StatTileProps) {
  return (
    <div
      style={{
        background: color.card,
        border: `1px solid ${color.border}`,
        borderRadius: radius.xl,
        padding: 24,
        textAlign: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        ...style,
      }}
    >
      <p style={{ color: color.muted, fontSize: 12, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
        {label}
      </p>
      <p style={{ color: color.accent, fontSize: 56, fontWeight: 700, margin: 0, lineHeight: 1, fontFamily: font.heading }}>
        {value}
      </p>
    </div>
  );
}
