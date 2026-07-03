'use client';

import { useState } from 'react';
import { CURATED_BRANDS, brandColor, brandTileColor } from '../../lib/brands';

interface BrandPickerProps {
  onSelect: (brand: string) => void;
}

export default function BrandPicker({ onSelect }: BrandPickerProps) {
  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState('');

  if (customMode) {
    return (
      <div>
        <p style={{ color: '#1C1C1A', fontWeight: 600, fontSize: 15, margin: '0 0 12px', fontFamily: "'Syne', sans-serif" }}>
          What's this card called?
        </p>
        <input
          type="text"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          placeholder="e.g. Local cafe card"
          autoFocus
          style={{
            width: '100%', padding: '12px 14px', borderRadius: 12, boxSizing: 'border-box',
            background: '#F7F7F5', border: '1px solid #EBEBE8',
            color: '#1C1C1A', fontSize: 15, outline: 'none', marginBottom: 16,
          }}
        />
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setCustomMode(false)}
            style={{ flex: 1, padding: '12px', background: '#F7F7F5', color: '#1C1C1A', border: '1px solid #EBEBE8', borderRadius: 9999, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          >
            Back
          </button>
          <button
            onClick={() => customName.trim() && onSelect(customName.trim())}
            disabled={!customName.trim()}
            style={{ flex: 2, padding: '12px', background: '#13B96D', color: '#FFFFFF', border: 'none', borderRadius: 9999, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: customName.trim() ? 1 : 0.4, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p style={{ color: '#1C1C1A', fontWeight: 600, fontSize: 15, margin: '0 0 12px', fontFamily: "'Syne', sans-serif" }}>
        Which card is this?
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {CURATED_BRANDS.map((brand) => (
          <button
            key={brand}
            onClick={() => onSelect(brand)}
            style={{
              background: brandTileColor(brand), border: 'none', borderRadius: 16,
              padding: '16px 14px', textAlign: 'left', cursor: 'pointer',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit',
            }}
          >
            <div style={{ width: 28, height: 28, borderRadius: 8, background: brandColor(brand), marginBottom: 10 }} />
            <p style={{ margin: 0, color: '#1C1C1A', fontWeight: 600, fontSize: 13, fontFamily: "'Syne', sans-serif", lineHeight: 1.3 }}>
              {brand}
            </p>
          </button>
        ))}
        <button
          onClick={() => setCustomMode(true)}
          style={{
            background: 'transparent', border: '1.5px dashed #EBEBE8', borderRadius: 16,
            padding: '16px 14px', textAlign: 'center', color: '#AEADA7', fontSize: 13,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'inherit', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          + Custom card
        </button>
      </div>
    </div>
  );
}
