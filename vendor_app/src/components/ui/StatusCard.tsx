import type { CSSProperties, ReactNode } from 'react';
import { color, radius, type StatusVariant } from '../../styles/tokens';

interface StatusCardProps {
  variant: StatusVariant;
  children: ReactNode;
  style?: CSSProperties;
}

const variantStyle: Record<StatusVariant, CSSProperties> = {
  success: { background: color.accentBg, border: `1px solid ${color.accentBorder}` },
  warning: { background: color.warningBg, border: `1px solid ${color.warningBorder}` },
  error: { background: color.errorBg, border: `1px solid ${color.errorBorder}` },
  neutral: { background: color.bg, border: `1px solid ${color.border}` },
};

export default function StatusCard({ variant, children, style }: StatusCardProps) {
  return (
    <div
      style={{
        borderRadius: radius.lg,
        padding: 20,
        textAlign: 'center',
        ...variantStyle[variant],
        ...style,
      }}
    >
      {children}
    </div>
  );
}
