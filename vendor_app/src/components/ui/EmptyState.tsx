import { color } from '../../styles/tokens';

interface EmptyStateProps {
  message: string;
  paddingTop?: number;
}

export default function EmptyState({ message, paddingTop = 40 }: EmptyStateProps) {
  return (
    <div style={{ textAlign: 'center', paddingTop }}>
      <p style={{ color: color.muted, fontSize: 14 }}>{message}</p>
    </div>
  );
}
