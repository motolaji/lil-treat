import type { ButtonHTMLAttributes, CSSProperties } from 'react';
import { color, radius } from '../../styles/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'pill' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

const variantStyle: Record<ButtonVariant, CSSProperties> = {
  primary: {
    background: color.accent,
    color: color.card,
    border: 'none',
  },
  secondary: {
    background: color.card,
    color: color.text,
    border: `1px solid ${color.border}`,
  },
  pill: {
    background: color.bg,
    color: color.text,
    border: `1px solid ${color.border}`,
    borderRadius: 999,
  },
  danger: {
    background: color.errorBg,
    color: color.error,
    border: `1px solid ${color.errorBorder}`,
  },
};

export default function Button({
  variant = 'primary',
  fullWidth = false,
  disabled,
  style,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      style={{
        minHeight: 44,
        padding: '0 20px',
        borderRadius: variant === 'pill' ? 999 : radius.md,
        fontSize: 15,
        fontWeight: 600,
        fontFamily: 'inherit',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        width: fullWidth ? '100%' : undefined,
        transition: 'opacity 0.15s',
        ...variantStyle[variant],
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
