'use client';

import { QRCodeSVG } from 'qrcode.react';

interface QRDisplayProps {
  value: string;
  size?: number;
}

export default function QRDisplay({ value, size = 240 }: QRDisplayProps) {
  return (
    <div style={{
      display: 'inline-flex',
      padding: 20,
      background: '#f0ede8',
      borderRadius: 20,
    }}>
      <QRCodeSVG
        value={value}
        size={size}
        bgColor="#f0ede8"
        fgColor="#0a0a0f"
        level="M"
      />
    </div>
  );
}
