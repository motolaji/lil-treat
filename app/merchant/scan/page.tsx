'use client';

import { useState } from 'react';
import { getOrCreateCard, issueStamp, redeemReward, LoyaltyCard } from '../../../lib/supabase';
import QRScanner from '../../components/QRScanner';
import { useMerchant } from '../MerchantContext';

interface ConsumerPayload {
  type: 'consumer';
  user_handle: string;
  user_id: string;
}

interface RedeemPayload {
  type: 'redeem';
  loyalty_card_id: string;
  user_id: string;
  merchant_id: string;
}

type ScanPayload = ConsumerPayload | RedeemPayload;

interface PendingEarn {
  card: LoyaltyCard;
  userHandle: string;
}

interface RedeemConfirm {
  rewardLabel: string;
  userHandle: string | null;
}

export default function MerchantScanPage() {
  const { merchant } = useMerchant();
  const [cameraStarted, setCameraStarted] = useState(false);
  const [scanActive, setScanActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [pendingEarn, setPendingEarn] = useState<PendingEarn | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [scanConfirm, setScanConfirm] = useState<string | null>(null);
  const [redeemConfirm, setRedeemConfirm] = useState<RedeemConfirm | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  async function handleScanResult(text: string) {
    if (!merchant || processing) return;
    setScanError(null);
    setScanConfirm(null);
    setRedeemConfirm(null);
    setScanActive(false);

    let payload: ScanPayload;
    try {
      payload = JSON.parse(text);
    } catch {
      setScanError('Invalid QR code. Ask customer to show their My QR tab.');
      setScanActive(true);
      return;
    }

    if (payload.type === 'redeem') {
      setProcessing(true);
      const result = await redeemReward(payload.loyalty_card_id, merchant.id);
      setProcessing(false);

      if (!result) {
        setScanError("This reward has already been redeemed or isn't ready yet.");
        setScanActive(true);
        return;
      }
      setRedeemConfirm(result);
      return;
    }

    if (payload.type !== 'consumer' || !payload.user_id) {
      setScanError('Unrecognised QR. Ask the customer to show their reward or My QR screen.');
      setScanActive(true);
      return;
    }

    setProcessing(true);
    const card = await getOrCreateCard(payload.user_id, merchant.id);
    setProcessing(false);

    if (!card) {
      setScanError('Could not load customer card. Check connection.');
      setScanActive(true);
      return;
    }

    setPendingEarn({ card, userHandle: payload.user_handle ?? 'Customer' });
  }

  async function confirmAmount(skip: boolean) {
    if (!pendingEarn || !merchant) return;
    setProcessing(true);
    const amount = skip ? undefined : (parseFloat(amountInput) || undefined);
    const newCount = await issueStamp(pendingEarn.card.id, pendingEarn.card.stamps_current, amount);
    setProcessing(false);

    if (newCount === null) {
      setScanError('Failed to issue treat. Try again.');
      setPendingEarn(null);
      setAmountInput('');
      setScanActive(true);
      return;
    }

    setScanConfirm(`Treat issued to ${pendingEarn.userHandle} — now ${newCount} of ${merchant.stamp_target}`);
    setPendingEarn(null);
    setAmountInput('');
  }

  function startCamera() {
    setCameraStarted(true);
    setScanActive(true);
  }

  function scanNext() {
    setScanConfirm(null);
    setRedeemConfirm(null);
    setScanError(null);
    setPendingEarn(null);
    setAmountInput('');
    setScanActive(true);
  }

  return (
    <div style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', color: '#1C1C1A', fontFamily: "'Syne', sans-serif", letterSpacing: '-0.02em' }}>Scan customer</h1>
      <p style={{ color: '#AEADA7', fontSize: 13, margin: '0 0 20px' }}>
        Scan the customer&apos;s QR code to issue or redeem a treat
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
          <p style={{ color: '#AEADA7', fontSize: 14, margin: 0 }}>Working…</p>
        </div>
      )}

      {pendingEarn && !processing && (
        <div style={{ background: '#FFFFFF', border: '1px solid #EBEBE8', borderRadius: 14, padding: '20px', marginTop: 16 }}>
          <p style={{ color: '#1C1C1A', fontWeight: 600, fontSize: 15, margin: '0 0 12px', fontFamily: "'Syne', sans-serif" }}>
            Purchase amount (optional)
          </p>
          <input
            type="text"
            inputMode="decimal"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            placeholder="£0.00"
            autoFocus
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 12, boxSizing: 'border-box',
              background: '#F7F7F5', border: '1px solid #EBEBE8',
              color: '#1C1C1A', fontSize: 15, outline: 'none', marginBottom: 16,
            }}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => confirmAmount(true)}
              style={{ flex: 1, padding: '12px', background: '#F7F7F5', color: '#1C1C1A', border: '1px solid #EBEBE8', borderRadius: 9999, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >
              Skip
            </button>
            <button
              onClick={() => confirmAmount(false)}
              style={{ flex: 2, padding: '12px', background: '#13B96D', color: '#FFFFFF', border: 'none', borderRadius: 9999, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >
              Confirm
            </button>
          </div>
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

      {redeemConfirm && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 14, padding: '20px', marginTop: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
          <p style={{ color: '#D97706', fontWeight: 600, fontSize: 16, margin: '0 0 16px' }}>
            Redeemed: {redeemConfirm.rewardLabel}{redeemConfirm.userHandle ? ` for ${redeemConfirm.userHandle}` : ''}
          </p>
          <button
            onClick={scanNext}
            style={{
              padding: '12px 28px', background: '#D97706', color: '#FFFFFF',
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
