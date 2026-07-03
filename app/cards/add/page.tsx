'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRScanner from '../../components/QRScanner';
import BrandPicker from '../../components/BrandPicker';
import NfcCapture from '../../components/NfcCapture';
import { addSavedCard } from '../../../lib/savedCards';
import { brandColor } from '../../../lib/brands';

type Step = 'brand' | 'capture' | 'save';

interface Captured {
  value: string;
  format?: string;
  captureMethod: 'camera' | 'nfc';
}

export default function AddCardPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('brand');
  const [brand, setBrand] = useState('');
  const [cameraStarted, setCameraStarted] = useState(false);
  const [nfcSupported, setNfcSupported] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [captured, setCaptured] = useState<Captured | null>(null);
  const [name, setName] = useState('');

  useEffect(() => {
    setNfcSupported(typeof window !== 'undefined' && 'NDEFReader' in window);
  }, []);

  function handleBrandSelect(selected: string) {
    setBrand(selected);
    setName(selected);
    setCaptureError(null);
    setCameraStarted(false);
    setStep('capture');
  }

  function handleCameraResult(text: string, format?: string) {
    setCaptured({ value: text, format, captureMethod: 'camera' });
    setStep('save');
  }

  function handleNfcResult(value: string) {
    setCaptured({ value, captureMethod: 'nfc' });
    setStep('save');
  }

  function handleSave() {
    if (!captured || !name.trim()) return;
    addSavedCard({
      name: name.trim(),
      brand,
      color: brandColor(brand),
      barcode: captured.value,
      barcodeFormat: captured.format,
      captureMethod: captured.captureMethod,
    });
    router.push('/cards');
  }

  function goBack() {
    if (step === 'brand') router.push('/cards');
    else if (step === 'capture') setStep('brand');
    else { setCaptured(null); setStep('capture'); }
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#F7F7F5' }}>
      <main style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px' }}>
        <div style={{ paddingTop: 'env(safe-area-inset-top)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={goBack} style={backBtnStyle}>‹</button>
          <h1 style={titleStyle}>Add card</h1>
        </div>

        {step === 'brand' && (
          <BrandPicker onSelect={handleBrandSelect} />
        )}

        {step === 'capture' && (
          <>
            <p style={{ color: '#AEADA7', fontSize: 14, margin: '0 0 16px' }}>
              Scan the barcode on your {brand} card{nfcSupported ? ', or tap it to your phone' : ''}
            </p>

            {!cameraStarted ? (
              <button onClick={() => setCameraStarted(true)} style={primaryBtnStyle}>
                Start camera
              </button>
            ) : (
              <QRScanner
                active={cameraStarted}
                onResult={handleCameraResult}
                onError={(e) => setCaptureError(e.message)}
              />
            )}

            {captureError && (
              <div style={errorBoxStyle}>
                <p style={{ color: '#DC2626', fontSize: 14, margin: 0 }}>{captureError}</p>
              </div>
            )}

            {nfcSupported && (
              <NfcCapture onResult={handleNfcResult} onError={(e) => setCaptureError(e.message)} />
            )}
          </>
        )}

        {step === 'save' && captured && (
          <>
            <p style={{ color: '#1C1C1A', fontWeight: 600, fontSize: 15, margin: '0 0 6px', fontFamily: "'Syne', sans-serif" }}>
              {brand}
            </p>
            <p style={{ color: '#AEADA7', fontSize: 12, margin: '0 0 20px', fontFamily: "'DM Mono', monospace", wordBreak: 'break-all' }}>
              {captured.value}
            </p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Card name"
              autoFocus
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 12, boxSizing: 'border-box',
                background: '#FFFFFF', border: '1px solid #EBEBE8',
                color: '#1C1C1A', fontSize: 15, outline: 'none', marginBottom: 16,
              }}
            />
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              style={{ ...primaryBtnStyle, opacity: name.trim() ? 1 : 0.4 }}
            >
              Save card
            </button>
          </>
        )}
      </main>
    </div>
  );
}

const titleStyle: React.CSSProperties = {
  fontSize: 22, fontWeight: 700, margin: 0, color: '#1C1C1A',
  fontFamily: "'Syne', sans-serif", letterSpacing: '-0.02em',
};

const backBtnStyle: React.CSSProperties = {
  width: 32, height: 32, borderRadius: '50%', background: '#FFFFFF', border: '1px solid #EBEBE8',
  color: '#1C1C1A', fontSize: 20, lineHeight: 1, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
};

const primaryBtnStyle: React.CSSProperties = {
  width: '100%', padding: '16px', borderRadius: 16,
  background: '#13B96D', color: '#FFFFFF',
  fontSize: 16, fontWeight: 600, border: 'none', cursor: 'pointer',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  fontFamily: 'inherit',
};

const errorBoxStyle: React.CSSProperties = {
  background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12,
  padding: '12px 16px', marginTop: 16,
};
