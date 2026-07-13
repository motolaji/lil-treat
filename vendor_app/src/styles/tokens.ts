export const color = {
  bg: '#F7F7F5',
  card: '#FFFFFF',
  border: '#EBEBE8',
  text: '#1C1C1A',
  muted: '#AEADA7',
  accent: '#13B96D',
  accentBg: '#DCFCE7',
  accentBorder: '#BBF7D0',
  accentText: '#15803D',
  warning: '#D97706',
  warningBg: '#FFFBEB',
  warningBorder: '#FCD34D',
  error: '#DC2626',
  errorBg: '#FEF2F2',
  errorBorder: '#FECACA',
} as const;

export const font = {
  heading: "'Syne', sans-serif",
  mono: "'DM Mono', monospace",
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

// Keep in sync with the hardcoded @media literals in each *.css file —
// no PostCSS/Sass in this project, so CSS can't reference these directly.
export const BREAKPOINTS = {
  tablet: 768,
  desktop: 1024,
} as const;

export type StatusVariant = 'success' | 'warning' | 'error' | 'neutral';

export const statusTextColor: Record<StatusVariant, string> = {
  success: color.accentText,
  warning: color.warning,
  error: color.error,
  neutral: color.text,
};
