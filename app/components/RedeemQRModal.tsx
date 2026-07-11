'use client';

import { useEffect, useState } from 'react';
import QRDisplay from './QRDisplay';
import { LoyaltyCard, UserRow, Reward } from '../../lib/supabase';
import { withExpiry } from '../../lib/qrExpiry';

interface RedeemQRModalProps {
  card: LoyaltyCard;
  user: UserRow;
  reward: Reward;
  onClose: () => void;
}

export default function RedeemQRModal({ card, user, reward, onClose }: RedeemQRModalProps) {
  const [payload, setPayload] = useState('');

  // Regenerate periodically so leaving the modal open doesn't let the QR go
  // stale — only a screenshotted/exported copy expires (see lib/qrExpiry.ts).
  useEffect(() => {
    function refresh() {
      setPayload(JSON.stringify(withExpiry({
        type: 'redeem',
        loyalty_card_id: card.id,
        user_id: user.id,
        merchant_id: card.merchant_id,
        reward_id: reward.id,
      })));
    }

    refresh();
    const interval = setInterval(refresh, 60_000);
    return () => clearInterval(interval);
  }, [card.id, user.id, card.merchant_id, reward.id]);

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(28,28,26,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={onClose}
    >
      <div style={{ background: '#FFFFFF', borderRadius: 24, padding: 28, width: '100%', maxWidth: 360, textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.12)', border: '1px solid #EBEBE8' }} onClick={(e) => e.stopPropagation()}>
        <p style={{ color: '#1C1C1A', fontWeight: 600, fontSize: 17, margin: '0 0 4px', fontFamily: "'Syne', sans-serif" }}>
          {reward.label}
        </p>
        <p style={{ color: '#AEADA7', fontSize: 13, margin: '0 0 20px' }}>
          Show this to the merchant to redeem — costs {reward.cost} small treats
        </p>
        <QRDisplay value={payload} size={220} />
        <button
          onClick={onClose}
          style={{
            marginTop: 20, padding: '12px 32px', background: '#F7F7F5', color: '#1C1C1A',
            border: 'none', borderRadius: 9999, fontSize: 13, fontWeight: 500, cursor: 'pointer',
            fontFamily: 'inherit', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
