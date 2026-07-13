import type { CSSProperties, ReactNode } from 'react';
import { color } from '../../styles/tokens';

interface SectionLabelProps {
  children: ReactNode;
  style?: CSSProperties;
}

export default function SectionLabel({ children, style }: SectionLabelProps) {
  return (
    <p
      style={{
        color: color.muted,
        fontSize: 11,
        margin: '0 0 6px',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        fontWeight: 500,
        ...style,
      }}
    >
      {children}
    </p>
  );
}
