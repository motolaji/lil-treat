import { useState } from 'react';
import { redeemReward, RedeemResult } from '../../lib/supabase';
import { isExpired } from '../../lib/qrExpiry';
import QRScanner from '../../components/QRScanner/QRScanner';
import { useMerchant } from '../../context/MerchantContext';
import Button from '../../components/ui/Button';
import StatusCard from '../../components/ui/StatusCard';
import { color, font, statusTextColor } from '../../styles/tokens';
import './ScanScreen.css';

interface RedeemPayload {
  type: 'redeem';
  loyalty_card_id: string;
  user_id: string;
  merchant_id: string;
  reward_id: string;
  exp?: number;
}

export default function ScanScreen() {
  const { merchant } = useMerchant();
  const [cameraStarted, setCameraStarted] = useState(false);
  const [scanActive, setScanActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [redeemConfirm, setRedeemConfirm] = useState<RedeemResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  async function handleScanResult(text: string) {
    if (!merchant || processing) return;
    setScanError(null);
    setRedeemConfirm(null);
    setScanActive(false);

    let payload: RedeemPayload;
    try {
      payload = JSON.parse(text);
    } catch {
      setScanError('Invalid QR code. Ask the customer to show their Redeem screen.');
      setScanActive(true);
      return;
    }

    if (isExpired(payload)) {
      setScanError('This QR has expired — ask the customer to reopen their screen.');
      setScanActive(true);
      return;
    }

    if (payload.type !== 'redeem') {
      setScanError('Unrecognised QR. Ask the customer to show their Redeem screen.');
      setScanActive(true);
      return;
    }

    setProcessing(true);
    const result = await redeemReward(payload.loyalty_card_id, merchant.id, payload.reward_id);
    setProcessing(false);

    if (!result) {
      setScanError("This reward has already been redeemed or isn't ready yet.");
      setScanActive(true);
      return;
    }
    setRedeemConfirm(result);
  }

  function startCamera() {
    setCameraStarted(true);
    setScanActive(true);
  }

  function scanNext() {
    setRedeemConfirm(null);
    setScanError(null);
    setScanActive(true);
  }

  return (
    <div style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', color: color.text, fontFamily: font.heading, letterSpacing: '-0.02em' }}>Redeem</h1>
      <p style={{ color: color.muted, fontSize: 13, margin: '0 0 20px' }}>
        Scan the customer&apos;s QR code to redeem a reward
      </p>

      <div className="scan">
        <div className="scan__camera-col">
          {!cameraStarted ? (
            <Button onClick={startCamera} fullWidth style={{ minHeight: 64, fontSize: 16 }}>
              Start camera
            </Button>
          ) : (
            <QRScanner active={scanActive} onResult={handleScanResult} onError={(e) => setScanError(e.message)} />
          )}
        </div>

        <div className="scan__outcome-col">
          {processing && (
            <StatusCard variant="neutral">
              <p style={{ color: color.muted, fontSize: 14, margin: 0 }}>Working…</p>
            </StatusCard>
          )}

          {redeemConfirm && (
            <StatusCard variant="warning">
              <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
              <p style={{ color: statusTextColor.warning, fontWeight: 600, fontSize: 16, margin: '0 0 16px' }}>
                Redeemed: {redeemConfirm.rewardLabel}{redeemConfirm.userHandle ? ` for ${redeemConfirm.userHandle}` : ''}
              </p>
              <Button onClick={scanNext} style={{ background: color.warning, borderRadius: 999 }}>
                Scan next customer
              </Button>
            </StatusCard>
          )}

          {scanError && (
            <StatusCard variant="error" style={{ textAlign: 'left' }}>
              <p style={{ color: statusTextColor.error, fontSize: 14, margin: '0 0 10px' }}>{scanError}</p>
              <Button variant="secondary" onClick={scanNext} style={{ borderRadius: 999 }}>
                Try again
              </Button>
            </StatusCard>
          )}
        </div>
      </div>
    </div>
  );
}
