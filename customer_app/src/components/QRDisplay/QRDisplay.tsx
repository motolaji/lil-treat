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
      background: '#FFFFFF',
      borderRadius: 20,
      border: '1px solid #EBEBE8',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    }}>
      <QRCodeSVG
        value={value}
        size={size}
        bgColor="#FFFFFF"
        fgColor="#1C1C1A"
        level="M"
      />
    </div>
  );
}
