import type { CSSProperties } from 'react';
import './Skeleton.css';
import { color, radius } from '../../styles/tokens';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  style?: CSSProperties;
}

export default function Skeleton({ width = '100%', height = 20, style }: SkeletonProps) {
  return (
    <div
      className="skeleton"
      style={{
        width,
        height,
        background: color.border,
        borderRadius: radius.sm,
        ...style,
      }}
    />
  );
}
