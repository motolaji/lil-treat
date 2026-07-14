import type { CSSProperties } from 'react';
import { color, font, radius } from '../../styles/tokens';

interface StatTileProps {
  label: string;
  value: string | number;
  /** Smaller type/padding, for placing several tiles in a row. */
  compact?: boolean;
  /** Small colored line under the value, e.g. "+18% vs previous period". */
  delta?: { text: string; direction: 'up' | 'down' | 'flat' };
  style?: CSSProperties;
}

const deltaColor: Record<'up' | 'down' | 'flat', string> = {
  up: color.accentText,
  down: color.error,
  flat: color.muted,
};

export default function StatTile({ label, value, compact = false, delta, style }: StatTileProps) {
  return (
    <div
      style={{
        background: color.card,
        border: `1px solid ${color.border}`,
        borderRadius: radius.xl,
        padding: compact ? 16 : 24,
        textAlign: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        ...style,
      }}
    >
      <p style={{ color: color.muted, fontSize: compact ? 11 : 12, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
        {label}
      </p>
      <p style={{ color: color.accent, fontSize: compact ? 32 : 56, fontWeight: 700, margin: 0, lineHeight: 1, fontFamily: font.heading }}>
        {value}
      </p>
      {delta && (
        <p style={{ color: deltaColor[delta.direction], fontSize: 11, fontWeight: 600, margin: '6px 0 0' }}>
          {delta.text}
        </p>
      )}
    </div>
  );
}
