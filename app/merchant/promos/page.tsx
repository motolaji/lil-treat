'use client';

import { useEffect, useState } from 'react';
import { useMerchant } from '../MerchantContext';
import { createPromotion, getMerchantPromotions, PromotionRow } from '../../../lib/supabase';

export default function MerchantPromosPage() {
  const { merchant } = useMerchant();
  const [promos, setPromos] = useState<PromotionRow[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!merchant) return;
    getMerchantPromotions(merchant.id).then(setPromos);
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
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', color: '#1C1C1A', fontFamily: "'Syne', sans-serif", letterSpacing: '-0.02em' }}>Promos</h1>
      <p style={{ color: '#AEADA7', fontSize: 13, margin: '0 0 20px' }}>
        Send a message to every customer who has a treat card with you
      </p>

      <form onSubmit={handleSend} style={{
        background: '#FFFFFF', border: '1px solid #EBEBE8', borderRadius: 20,
        padding: '20px', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (e.g. Double treats today!)"
          required
          style={{
            width: '100%', padding: '12px 14px', borderRadius: 12, boxSizing: 'border-box',
            background: '#F7F7F5', border: '1px solid #EBEBE8',
            color: '#1C1C1A', fontSize: 15, outline: 'none', fontFamily: 'inherit',
          }}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Message"
          required
          rows={3}
          style={{
            width: '100%', padding: '12px 14px', borderRadius: 12, boxSizing: 'border-box',
            background: '#F7F7F5', border: '1px solid #EBEBE8',
            color: '#1C1C1A', fontSize: 15, outline: 'none', fontFamily: 'inherit', resize: 'vertical',
          }}
        />
        <button
          type="submit"
          disabled={sending}
          style={{
            padding: '13px', background: '#13B96D', color: '#FFFFFF', border: 'none', borderRadius: 14,
            fontSize: 15, fontWeight: 600, cursor: sending ? 'default' : 'pointer', opacity: sending ? 0.6 : 1,
            fontFamily: 'inherit', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          {sending ? 'Sending…' : 'Send to customers'}
        </button>
      </form>

      {promos.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ color: '#AEADA7', fontSize: 11, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
            Sent
          </p>
          {promos.map((promo) => (
            <div key={promo.id} style={{
              background: '#FFFFFF', border: '1px solid #EBEBE8', borderRadius: 14,
              padding: '14px 16px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}>
              <p style={{ color: '#1C1C1A', fontWeight: 600, margin: 0, fontSize: 14 }}>{promo.title}</p>
              <p style={{ color: '#AEADA7', fontSize: 13, margin: '4px 0 0' }}>{promo.body}</p>
              <p style={{ color: '#AEADA7', fontSize: 11, margin: '6px 0 0', fontFamily: "'DM Mono', monospace" }}>
                {new Date(promo.created_at).toLocaleString('en-GB')}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', paddingTop: 20 }}>
          <p style={{ color: '#AEADA7', fontSize: 14 }}>No promos sent yet</p>
        </div>
      )}
    </div>
  );
}
