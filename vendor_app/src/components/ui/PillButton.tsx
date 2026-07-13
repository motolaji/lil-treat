import type { ButtonHTMLAttributes } from 'react';
import { color } from '../../styles/tokens';

type PillIntent = 'accent' | 'danger' | 'neutral';

interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  intent?: PillIntent;
  fullWidth?: boolean;
}

const intentColor: Record<PillIntent, string> = {
  accent: color.accent,
  danger: color.error,
  neutral: color.text,
};

export default function PillButton({
  intent = 'neutral',
  fullWidth = false,
  disabled,
  style,
  children,
  ...rest
}: PillButtonProps) {
  return (
    <button
      disabled={disabled}
      style={{
        flex: fullWidth ? 1 : undefined,
        minHeight: 44,
        padding: '0 18px',
        background: color.card,
        color: intentColor[intent],
        border: `1px solid ${intent === 'danger' ? color.errorBorder : color.border}`,
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 600,
        fontFamily: 'inherit',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
