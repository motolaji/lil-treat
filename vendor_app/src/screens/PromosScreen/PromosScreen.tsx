import { useEffect, useState } from 'react';
import { useMerchant } from '../../context/MerchantContext';
import { createPromotion, getMerchantPromotions, PromotionRow } from '../../lib/supabase';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import SectionLabel from '../../components/ui/SectionLabel';
import EmptyState from '../../components/ui/EmptyState';
import { color, font } from '../../styles/tokens';
import '../../styles/split-form-layout.css';

const fieldStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 12, boxSizing: 'border-box',
  background: color.bg, border: `1px solid ${color.border}`,
  color: color.text, fontSize: 15, outline: 'none', fontFamily: 'inherit',
};

export default function PromosScreen() {
  const { merchant } = useMerchant();
  const [promos, setPromos] = useState<PromotionRow[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!merchant) return;
    getMerchantPromotions(merchant.id).then(setPromos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchant?.id]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!merchant || !title.trim() || !body.trim()) return;

    setSending(true);
    const ok = await createPromotion(merchant.id, title.trim(), body.trim());
    setSending(false);

    if (ok) {
      setTitle('');
      setBody('');
      const fresh = await getMerchantPromotions(merchant.id);
      setPromos(fresh);
    }
  }

  return (
    <div style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', color: color.text, fontFamily: font.heading, letterSpacing: '-0.02em' }}>Promos</h1>
      <p style={{ color: color.muted, fontSize: 13, margin: '0 0 20px' }}>
        Send a message to every customer who has a treat card with you
      </p>

      <div className="split-form-layout">
        <div className="split-form-layout__form">
          <Card>
            <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title (e.g. Double treats today!)"
                required
                style={fieldStyle}
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Message"
                required
                rows={3}
                style={{ ...fieldStyle, resize: 'vertical' }}
              />
              <Button type="submit" disabled={sending} fullWidth>
                {sending ? 'Sending…' : 'Send to customers'}
              </Button>
            </form>
          </Card>
        </div>

        <div className="split-form-layout__list">
          {promos.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <SectionLabel>Sent</SectionLabel>
              {promos.map((promo) => (
                <Card key={promo.id} padding="14px 16px" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                  <p style={{ color: color.text, fontWeight: 600, margin: 0, fontSize: 14 }}>{promo.title}</p>
                  <p style={{ color: color.muted, fontSize: 13, margin: '4px 0 0' }}>{promo.body}</p>
                  <p style={{ color: color.muted, fontSize: 11, margin: '6px 0 0', fontFamily: font.mono }}>
                    {new Date(promo.created_at).toLocaleString('en-GB')}
                  </p>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState message="No promos sent yet" paddingTop={20} />
          )}
        </div>
      </div>
    </div>
  );
}
