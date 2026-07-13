import type { CSSProperties, ReactNode } from 'react';
import { color, radius } from '../../styles/tokens';

interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
  padding?: number | string;
}

export default function Card({ children, style, padding = 20 }: CardProps) {
  return (
    <div
      style={{
        background: color.card,
        border: `1px solid ${color.border}`,
        borderRadius: radius.lg,
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
