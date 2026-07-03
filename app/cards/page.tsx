'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Barcode, { Options as BarcodeOptions } from 'react-barcode';
import QRDisplay from '../components/QRDisplay';
import ConsumerNav from '../components/ConsumerNav';
import { getSavedCards, deleteSavedCard, SavedCard } from '../../lib/savedCards';
import { toJsBarcodeFormat } from '../../lib/barcodeFormat';

export default function CardsPage() {
  const router = useRouter();
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [showBarcodeId, setShowBarcodeId] = useState<string | null>(null);

  useEffect(() => {
    setCards(getSavedCards());
  }, []);

  function handleDelete(id: string) {
    deleteSavedCard(id);
    setCards(getSavedCards());
  }

  const shownCard = cards.find((c) => c.id === showBarcodeId) ?? null;

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#F7F7F5' }}>
      {shownCard && (
        <BarcodeModal card={shownCard} onClose={() => setShowBarcodeId(null)} />
      )}

      <main style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px' }}>
        <div style={{
          paddingTop: 'env(safe-area-inset-top)', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#1C1C1A', fontFamily: "'Syne', sans-serif", letterSpacing: '-0.02em' }}>Cards</h1>
          <button
            onClick={() => router.push('/cards/add')}
            style={{
              width: 36, height: 36, borderRadius: '50%', background: '#13B96D', color: '#FFFFFF',
              border: 'none', fontSize: 20, fontWeight: 600, cursor: 'pointer', lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}
          >
            +
          </button>
        </div>

        {cards.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 80, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>💳</div>
            <p style={{ color: '#1C1C1A', fontSize: 17, fontWeight: 600, margin: '8px 0 0', fontFamily: "'Syne', sans-serif" }}>No cards saved yet</p>
            <p style={{ color: '#AEADA7', fontSize: 14, margin: 0 }}>Add your Tesco, Boots, Nectar card and more</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {cards.map((card) => (
              <div key={card.id} style={{
                background: '#FFFFFF', border: '1px solid #EBEBE8',
                borderRadius: 20, padding: '16px 20px',
                display: 'flex', alignItems: 'center', gap: 14,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: card.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#1C1C1A', fontWeight: 600, margin: 0, fontFamily: "'Syne', sans-serif" }}>{card.name}</p>
                  <p style={{
                    color: '#AEADA7', fontSize: 12, margin: '2px 0 0', fontFamily: "'DM Mono', monospace",
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {card.barcode}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => setShowBarcodeId(card.id)} style={pillBtn('#13B96D', '#FFFFFF')}>Show</button>
                  <button onClick={() => handleDelete(card.id)} style={pillBtn('#F7F7F5', '#AEADA7')}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <ConsumerNav />
    </div>
  );
}

function BarcodeModal({ card, onClose }: { card: SavedCard; onClose: () => void }) {
  const jsFormat = toJsBarcodeFormat(card.barcodeFormat) as BarcodeOptions['format'];

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(28,28,26,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={onClose}
    >
      <div style={{ background: '#FFFFFF', borderRadius: 24, padding: 28, width: '100%', maxWidth: 360, textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.12)', border: '1px solid #EBEBE8' }} onClick={(e) => e.stopPropagation()}>
        <p style={{ color: '#1C1C1A', fontWeight: 600, fontSize: 17, margin: '0 0 6px', fontFamily: "'Syne', sans-serif" }}>{card.name}</p>
        <p style={{ color: '#AEADA7', fontSize: 12, fontFamily: "'DM Mono', monospace", margin: '0 0 20px', wordBreak: 'break-all' }}>{card.barcode}</p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {jsFormat ? (
            <Barcode value={card.barcode} format={jsFormat} width={2} height={90} displayValue background="#FFFFFF" lineColor="#1C1C1A" />
          ) : (
            <QRDisplay value={card.barcode} size={200} />
          )}
        </div>
        <button onClick={onClose} style={{ ...pillBtn('#F7F7F5', '#1C1C1A'), marginTop: 20, padding: '12px 32px' }}>Close</button>
      </div>
    </div>
  );
}

function pillBtn(bg: string, color: string): React.CSSProperties {
  return {
    background: bg, color, border: 'none', borderRadius: 9999,
    padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
    fontFamily: 'inherit', touchAction: 'manipulation',
  };
}
