import { color } from './tokens';

export const centeredPage: React.CSSProperties = {
  minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: color.bg,
};

export const inputStyle: React.CSSProperties = {
  width: '100%', padding: '14px 16px', borderRadius: 14, boxSizing: 'border-box',
  background: color.card, border: `1px solid ${color.border}`,
  color: color.text, fontSize: 16, outline: 'none', fontFamily: 'inherit',
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
};
