'use client';

import { useState } from 'react';
import { getOrCreateCard, issueStamp } from '../../../lib/supabase';
import QRScanner from '../../components/QRScanner';
import { useMerchant } from '../MerchantContext';

interface ConsumerPayload {
  type: 'consumer';
  user_handle: string;
  user_id: string;
}

export default function MerchantScanPage() {
  const { merchant } = useMerchant();
  const [cameraStarted, setCameraStarted] = useState(false);
  const [scanActive, setScanActive] = useState(false);
  const [scanConfirm, setScanConfirm] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  async function handleScanResult(text: string) {
    if (!merchant || processing) return;
    setScanError(null);
    setScanConfirm(null);
    setScanActive(false);
    setProcessing(true);

    let payload: ConsumerPayload;
    try {
      payload = JSON.parse(text);
    } catch {
      setScanError('Invalid QR code. Ask customer to show their My QR tab.');
      setProcessing(false);
      setScanActive(true);
      return;
    }

    if (payload.type !== 'consumer' || !payload.user_id) {
      setScanError('Not a consumer QR.');
      setProcessing(false);
      setScanActive(true);
      return;
    }

    const card = await getOrCreateCard(payload.user_id, merchant.id);
    if (!card) {
      setScanError('Could not load customer card. Check connection.');
      setProcessing(false);
      setScanActive(true);
      return;
    }

    const newCount = await issueStamp(card.id, card.stamps_current);
    if (newCount === null) {
      setScanError('Failed to issue stamp. Try again.');
      setProcessing(false);
      setScanActive(true);
      return;
    }

    setProcessing(false);
    setScanConfirm(`Stamp issued to ${payload.user_handle ?? 'Customer'} — now ${newCount} of ${merchant.stamp_target}`);
  }

  function startCamera() {
    setCameraStarted(true);
    setScanActive(true);
  }

  function scanNext() {
    setScanConfirm(null);
    setScanError(null);
    setScanActive(true);
  }

  return (
    <div style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', color: '#1C1C1A', fontFamily: "'Syne', sans-serif", letterSpacing: '-0.02em' }}>Scan customer</h1>
      <p style={{ color: '#AEADA7', fontSize: 13, margin: '0 0 20px' }}>
        Scan the customer&apos;s QR code to issue a stamp
      </p>

      {!cameraStarted ? (
        <button
          onClick={startCamera}
          style={{
            width: '100%', padding: '20px', borderRadius: 16,
            background: '#13B96D', color: '#FFFFFF',
            fontSize: 16, fontWeight: 600, border: 'none', cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            fontFamily: 'inherit', letterSpacing: '-0.01em',
          }}
        >
          Start camera
        </button>
      ) : (
        <QRScanner active={scanActive} onResult={handleScanResult} onError={(e) => setScanError(e.message)} />
      )}

      {processing && (
        <div style={{ background: '#F7F7F5', border: '1px solid #EBEBE8', borderRadius: 12, padding: '14px 16px', marginTop: 16, textAlign: 'center' }}>
          <p style={{ color: '#AEADA7', fontSize: 14, margin: 0 }}>Issuing stamp…</p>
        </div>
      )}

      {scanConfirm && (
        <div style={{ background: '#DCFCE7', border: '1px solid #BBF7D0', borderRadius: 14, padding: '20px', marginTop: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
          <p style={{ color: '#15803D', fontWeight: 600, fontSize: 16, margin: '0 0 16px' }}>{scanConfirm}</p>
          <button
            onClick={scanNext}
            style={{
              padding: '12px 28px', background: '#13B96D', color: '#FFFFFF',
              border: 'none', borderRadius: 9999, fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', touchAction: 'manipulation',
            }}
          >
            Scan next customer
          </button>
        </div>
      )}

      {scanError && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '12px 16px', marginTop: 16 }}>
          <p style={{ color: '#DC2626', fontSize: 14, margin: '0 0 10px' }}>{scanError}</p>
          <button
            onClick={scanNext}
            style={{
              padding: '8px 16px', background: '#FFFFFF', color: '#1C1C1A',
              border: '1px solid #EBEBE8', borderRadius: 9999, fontSize: 13,
              cursor: 'pointer', fontFamily: 'inherit', touchAction: 'manipulation',
            }}
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
