import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMerchantRewards, Reward } from '../../lib/supabase';
import QRDisplay from '../../components/QRDisplay/QRDisplay';
import { useMerchant } from '../../context/MerchantContext';
import { useElementSize } from '../../hooks/useElementSize';
import Card from '../../components/ui/Card';
import SectionLabel from '../../components/ui/SectionLabel';
import { color, font } from '../../styles/tokens';
import { formatTreats } from '../../lib/format';
import './MyQrScreen.css';

export default function MyQrScreen() {
  const { merchant } = useMerchant();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const { ref: qrColRef, width: qrColWidth } = useElementSize<HTMLDivElement>();

  useEffect(() => {
    if (!merchant) return;
    getMerchantRewards(merchant.id, true).then(setRewards);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchant?.id]);

  const merchantQR = merchant
    ? JSON.stringify({ type: 'merchant', merchant_id: merchant.id })
    : '';

  const qrSize = qrColWidth > 0 ? Math.min(qrColWidth - 40, 480) : 260;

  return (
    <div className="myqr">
      <div className="myqr__qr-col" ref={qrColRef}>
        <p style={{ color: color.muted, fontSize: 14, margin: 0, textAlign: 'center' }}>
          Place this on the counter — customers scan it to earn treats
        </p>
        {merchantQR ? (
          <QRDisplay value={merchantQR} size={qrSize} />
        ) : (
          <div style={{ width: qrSize, height: qrSize, background: color.card, borderRadius: 20, border: `1px solid ${color.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: color.muted }}>Loading…</p>
          </div>
        )}
      </div>

      <div className="myqr__info-col">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 'env(safe-area-inset-top)' }}>
          {merchant?.logo_url && (
            <img
              src={merchant.logo_url}
              alt={`${merchant.name} logo`}
              style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover', border: `1px solid ${color.border}`, flexShrink: 0 }}
            />
          )}
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: color.text, fontFamily: font.heading, letterSpacing: '-0.02em' }}>
              {merchant?.name ?? 'LilTreat Merchant'}
            </h1>
            <p style={{ color: color.muted, fontSize: 12, margin: '2px 0 0' }}>Merchant portal</p>
          </div>
        </div>

        <Card>
          <SectionLabel style={{ marginBottom: 4 }}>Big Treats</SectionLabel>
          {rewards.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {rewards.map((r) => (
                <p key={r.id} style={{ color: color.text, fontSize: 15, fontWeight: 600, margin: 0 }}>
                  {formatTreats(r.cost)} treats → {r.label}
                </p>
              ))}
            </div>
          ) : (
            <p style={{ color: color.text, fontSize: 14, margin: 0 }}>
              No rewards set up yet —{' '}
              <Link to="/rewards" style={{ color: color.accent, fontWeight: 600, textDecoration: 'none' }}>
                add one
              </Link>
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
