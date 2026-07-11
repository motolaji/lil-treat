'use client';

import { useEffect, useState } from 'react';
import { getOrCreateCard, issueStamp, redeemReward, getMerchantRewards, LoyaltyCard, Reward } from '../../../lib/supabase';
import { getInventoryItems, sellQty, InventoryItem } from '../../../lib/inventory';
import { isExpired } from '../../../lib/qrExpiry';
import { cheapestActiveCost } from '../../../lib/rewards';
import QRScanner from '../../components/QRScanner';
import { useMerchant } from '../MerchantContext';

interface ConsumerPayload {
  type: 'consumer';
  user_handle: string;
  user_id: string;
  exp?: number;
}

interface RedeemPayload {
  type: 'redeem';
  loyalty_card_id: string;
  user_id: string;
  merchant_id: string;
  reward_id: string;
  exp?: number;
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
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [rewards, setRewards] = useState<Reward[]>([]);

  useEffect(() => {
    if (!merchant) return;
    getMerchantRewards(merchant.id, true).then(setRewards);
  }, [merchant?.id]);

  useEffect(() => {
    if (!pendingEarn || !merchant) return;
    setQuantities({});
    getInventoryItems(merchant.id).then(setItems);
  }, [pendingEarn, merchant?.id]);

  const treatsFromItems = items.reduce(
    (sum, item) => sum + (quantities[item.id] ?? 0) * item.treats_value,
    0,
  );

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

    if (isExpired(payload)) {
      setScanError('This QR has expired — ask the customer to reopen their screen.');
      setScanActive(true);
      return;
    }

    if (payload.type === 'redeem') {
      setProcessing(true);
      const result = await redeemReward(payload.loyalty_card_id, merchant.id, payload.reward_id);
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

    const chosenItems = items
      .map((item) => ({ item, qty: quantities[item.id] ?? 0 }))
      .filter(({ qty }) => qty > 0);

    const result = (skip || chosenItems.length === 0)
      ? await issueStamp(
          pendingEarn.card.id,
          pendingEarn.card.stamps_current,
          merchant.id,
          pendingEarn.card.user_id,
          { flatAmount: skip ? undefined : (parseFloat(amountInput) || undefined) },
        )
      : await issueStamp(
          pendingEarn.card.id,
          pendingEarn.card.stamps_current,
          merchant.id,
          pendingEarn.card.user_id,
          {
            lineItems: chosenItems.map(({ item, qty }) => ({
              inventory_item_id: item.id,
              name: item.name,
              qty,
              unit_price: item.price,
              treats_value: item.treats_value,
            })),
          },
        );

    if (result === null) {
      setProcessing(false);
      setScanError('Failed to issue treat. Try again.');
      setPendingEarn(null);
      setAmountInput('');
      setScanActive(true);
      return;
    }

    // Decrement stock for whatever was actually sold (best-effort, mirrors the
    // manual "Sell 1" button — a failure here doesn't undo the already-issued treats).
    await Promise.all(
      chosenItems.map(({ item, qty }) => sellQty(item.id, merchant.id, item.stock_qty, qty)),
    );
    setProcessing(false);

    const target = cheapestActiveCost(rewards, merchant.stamp_target);
    setScanConfirm(`Treat issued to ${pendingEarn.userHandle} — now ${result.newCount} of ${target}`);
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
          {items.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ color: '#1C1C1A', fontWeight: 600, fontSize: 15, margin: '0 0 12px', fontFamily: "'Syne', sans-serif" }}>
                What did they buy?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map((item) => {
                  const qty = quantities[item.id] ?? 0;
                  return (
                    <div key={item.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: '#F7F7F5', border: '1px solid #EBEBE8', borderRadius: 12, padding: '10px 14px',
                    }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ color: '#1C1C1A', fontSize: 14, fontWeight: 600, margin: 0 }}>{item.name}</p>
                        <p style={{ color: '#AEADA7', fontSize: 12, margin: '2px 0 0' }}>
                          £{item.price.toFixed(2)} · {item.treats_value} treats each
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => setQuantities((q) => ({ ...q, [item.id]: Math.max(0, (q[item.id] ?? 0) - 1) }))}
                          style={stepperBtnStyle}
                        >
                          −
                        </button>
                        <span style={{ color: '#1C1C1A', fontSize: 14, fontWeight: 600, minWidth: 16, textAlign: 'center' }}>{qty}</span>
                        <button
                          type="button"
                          onClick={() => setQuantities((q) => ({ ...q, [item.id]: (q[item.id] ?? 0) + 1 }))}
                          style={stepperBtnStyle}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p style={{ color: '#13B96D', fontSize: 13, fontWeight: 600, margin: '12px 0 0' }}>
                Treats to award: {treatsFromItems}
              </p>
            </div>
          )}

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

const stepperBtnStyle: React.CSSProperties = {
  width: 28, height: 28, borderRadius: '50%', background: '#FFFFFF', border: '1px solid #EBEBE8',
  color: '#1C1C1A', fontSize: 16, lineHeight: 1, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', padding: 0,
};
