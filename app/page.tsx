'use client';

import { useEffect, useRef, useState } from 'react';
import QRScanner from './components/QRScanner';
import StampCard from './components/StampCard';
import QRDisplay from './components/QRDisplay';
import {
  getOrCreateUser,
  getOrCreateCard,
  getUserCards,
  issueStamp,
  LoyaltyCard,
  UserRow,
} from '../lib/supabase';

// ── Types ──────────────────────────────────────────────────────────────────

type Tab = 'wallet' | 'scan' | 'myqr';
type StampState = 'idle' | 'scanning' | 'success' | 'reward';

interface SavedCard {
  id: string;
  name: string;
  barcode: string;
}

interface QRPayload {
  type: 'merchant' | 'consumer';
  merchant_id?: string;
  user_handle?: string;
  user_id?: string;
}

// ── Main component ─────────────────────────────────────────────────────────

export default function ConsumerPage() {
  const [tab, setTab] = useState<Tab>('wallet');
  const [user, setUser] = useState<UserRow | null>(null);
  const [cards, setCards] = useState<LoyaltyCard[]>([]);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [stampState, setStampState] = useState<StampState>('idle');
  const [stampedCard, setStampedCard] = useState<LoyaltyCard | null>(null);
  const [newStampCount, setNewStampCount] = useState(0);
  const [newStampIndex, setNewStampIndex] = useState<number | undefined>();
  const [scanError, setScanError] = useState<string | null>(null);
  const [showBarcode, setShowBarcode] = useState<string | null>(null);
  const [barcodeMode, setBarcodeMode] = useState(false);
  const [pendingBarcodeValue, setPendingBarcodeValue] = useState<string | null>(null);
  const [flashVisible, setFlashVisible] = useState(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Init ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function init() {
      const u = await getOrCreateUser();
      if (!u) return;
      setUser(u);
      const c = await getUserCards(u.id);
      setCards(c);
    }
    init();

    const stored = localStorage.getItem('stackpot_saved_cards');
    if (stored) {
      try { setSavedCards(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  // ── QR scan handler ───────────────────────────────────────────────────────

  async function handleScanResult(text: string) {
    if (stampState !== 'idle') return;
    setScanError(null);

    // Physical barcode mode — save to wallet
    if (barcodeMode) {
      setPendingBarcodeValue(text);
      return;
    }

    let payload: QRPayload;
    try {
      payload = JSON.parse(text);
    } catch {
      setScanError('Unrecognised QR code. Point at a Stackpot merchant QR.');
      return;
    }

    if (payload.type !== 'merchant' || !payload.merchant_id) {
      setScanError("Not a merchant QR. Point at the QR on the merchant's screen.");
      return;
    }
    if (!user) {
      setScanError('Still loading your account. Try again in a moment.');
      return;
    }

    setStampState('scanning');

    const card = await getOrCreateCard(user.id, payload.merchant_id);
    if (!card) {
      setScanError('Could not connect to server. Check your connection.');
      setStampState('idle');
      return;
    }

    const newCount = await issueStamp(card.id, card.stamps_current);
    if (newCount === null) {
      setScanError('Failed to record stamp. Try again.');
      setStampState('idle');
      return;
    }

    const updatedCard: LoyaltyCard = { ...card, stamps_current: newCount };

    setCards((prev) => {
      const idx = prev.findIndex((c) => c.id === card.id);
      if (idx === -1) return [...prev, updatedCard];
      const next = [...prev];
      next[idx] = updatedCard;
      return next;
    });

    setStampedCard(updatedCard);
    setNewStampCount(newCount);
    setNewStampIndex(newCount - 1);

    // Flash → success/reward
    setFlashVisible(true);
    setTimeout(() => setFlashVisible(false), 150);

    setTimeout(() => {
      const isReward =
        updatedCard.merchants && newCount >= updatedCard.merchants.stamp_target;
      setStampState(isReward ? 'reward' : 'success');

      if (!isReward) {
        dismissTimer.current = setTimeout(() => {
          setStampState('idle');
          setTab('wallet');
          setNewStampIndex(undefined);
        }, 2500);
      }
    }, 150);
  }

  function dismissSuccess() {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    setStampState('idle');
    setTab('wallet');
    setNewStampIndex(undefined);
  }

  // ── Physical barcode save ─────────────────────────────────────────────────

  function savePhysicalCard(name: string) {
    if (!pendingBarcodeValue || !name.trim()) return;
    const newCard: SavedCard = {
      id: crypto.randomUUID(),
      name: name.trim(),
      barcode: pendingBarcodeValue,
    };
    const updated = [...savedCards, newCard];
    setSavedCards(updated);
    localStorage.setItem('stackpot_saved_cards', JSON.stringify(updated));
    setPendingBarcodeValue(null);
    setBarcodeMode(false);
    setTab('wallet');
  }

  function deleteSavedCard(id: string) {
    const updated = savedCards.filter((c) => c.id !== id);
    setSavedCards(updated);
    localStorage.setItem('stackpot_saved_cards', JSON.stringify(updated));
  }

  // ── Consumer QR payload ───────────────────────────────────────────────────

  const consumerQR = user
    ? JSON.stringify({ type: 'consumer', user_handle: user.handle, user_id: user.id })
    : '';

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#0a0a0f' }}>

      {/* Flash overlay */}
      {flashVisible && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.6)',
          zIndex: 100, pointerEvents: 'none',
        }} />
      )}

      {/* Success overlay */}
      {(stampState === 'success' || stampState === 'reward') && stampedCard && (
        <SuccessOverlay
          card={stampedCard}
          newCount={newStampCount}
          isReward={stampState === 'reward'}
          onDismiss={dismissSuccess}
        />
      )}

      {/* Name prompt for physical barcode */}
      {pendingBarcodeValue && (
        <NamePrompt
          onSave={savePhysicalCard}
          onCancel={() => { setPendingBarcodeValue(null); setBarcodeMode(false); }}
        />
      )}

      {/* Barcode show modal */}
      {showBarcode && (
        <BarcodeModal
          card={savedCards.find((c) => c.id === showBarcode)!}
          onClose={() => setShowBarcode(null)}
        />
      )}

      {/* Main content */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 88px' }}>
        <div style={{ paddingTop: 'env(safe-area-inset-top)', marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: '#f0ede8' }}>Stackpot</h1>
          {user && (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '2px 0 0', fontFamily: "'DM Mono', monospace" }}>
              {user.handle}
            </p>
          )}
        </div>

        {tab === 'wallet' && (
          <WalletTab
            cards={cards}
            savedCards={savedCards}
            newStampIndex={newStampIndex}
            stampedCardId={stampedCard?.id}
            onShowBarcode={setShowBarcode}
            onDeleteSaved={deleteSavedCard}
            onAddCard={() => { setBarcodeMode(true); setTab('scan'); }}
          />
        )}

        {tab === 'scan' && (
          <ScanTab
            active={tab === 'scan' && stampState === 'idle' && !pendingBarcodeValue}
            barcodeMode={barcodeMode}
            scanError={scanError}
            onResult={handleScanResult}
            onScanError={(e) => setScanError(e.message)}
            onCancelBarcode={() => { setBarcodeMode(false); setTab('wallet'); }}
          />
        )}

        {tab === 'myqr' && (
          <MyQRTab user={user} qrValue={consumerQR} />
        )}
      </main>

      <BottomNav tab={tab} onTabChange={(t) => { setScanError(null); setTab(t); }} />
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function WalletTab({
  cards, savedCards, newStampIndex, stampedCardId, onShowBarcode, onDeleteSaved, onAddCard,
}: {
  cards: LoyaltyCard[];
  savedCards: SavedCard[];
  newStampIndex?: number;
  stampedCardId?: string;
  onShowBarcode: (id: string) => void;
  onDeleteSaved: (id: string) => void;
  onAddCard: () => void;
}) {
  const isEmpty = cards.length === 0 && savedCards.length === 0;

  if (isEmpty) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 80, textAlign: 'center' }}>
        <div style={{ fontSize: 48 }}>☕</div>
        <p style={{ color: '#f0ede8', fontSize: 18, fontWeight: 500, margin: 0 }}>Your wallet is empty</p>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: 0 }}>Tap Scan to earn your first stamp</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {cards.map((card) => (
        <StampCard
          key={card.id}
          merchantName={card.merchants?.name ?? 'Unknown'}
          stampsEarned={card.stamps_current}
          stampTarget={card.merchants?.stamp_target ?? 9}
          rewardLabel={card.merchants?.reward_label ?? 'Reward'}
          newStampIndex={card.id === stampedCardId ? newStampIndex : undefined}
        />
      ))}

      {savedCards.map((sc) => (
        <div key={sc.id} style={{
          background: '#14141c', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ color: '#f0ede8', fontWeight: 500, margin: 0 }}>{sc.name}</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '2px 0 0', fontFamily: "'DM Mono', monospace" }}>
              {sc.barcode.length > 22 ? sc.barcode.slice(0, 22) + '…' : sc.barcode}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => onShowBarcode(sc.id)} style={pillBtn('#6ee7b7', '#0a0a0f')}>Show</button>
            <button onClick={() => onDeleteSaved(sc.id)} style={pillBtn('rgba(255,255,255,0.08)', '#f0ede8')}>✕</button>
          </div>
        </div>
      ))}

      <button onClick={onAddCard} style={{
        background: 'transparent', border: '1.5px dashed rgba(255,255,255,0.15)',
        borderRadius: 20, padding: '16px 20px', color: 'rgba(255,255,255,0.4)',
        fontSize: 14, cursor: 'pointer', width: '100%', textAlign: 'center', fontFamily: 'inherit',
      }}>
        + Add loyalty card (scan barcode)
      </button>
    </div>
  );
}

function ScanTab({
  active, barcodeMode, scanError, onResult, onScanError, onCancelBarcode,
}: {
  active: boolean;
  barcodeMode: boolean;
  scanError: string | null;
  onResult: (text: string) => void;
  onScanError: (e: Error) => void;
  onCancelBarcode: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0, textAlign: 'center' }}>
        {barcodeMode ? 'Scan your physical loyalty card barcode' : "Point at the merchant's QR code to earn a stamp"}
      </p>
      <QRScanner active={active} onResult={onResult} onError={onScanError} />
      {scanError && (
        <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 12, padding: '12px 16px' }}>
          <p style={{ color: '#f87171', fontSize: 14, margin: 0 }}>{scanError}</p>
        </div>
      )}
      {barcodeMode && (
        <button onClick={onCancelBarcode} style={{ ...pillBtn('rgba(255,255,255,0.08)', '#f0ede8'), width: '100%', padding: '14px', borderRadius: 12 }}>
          Cancel
        </button>
      )}
    </div>
  );
}

function MyQRTab({ user, qrValue }: { user: UserRow | null; qrValue: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, paddingTop: 20 }}>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0, textAlign: 'center' }}>
        Show this to the merchant to earn a stamp
      </p>
      {qrValue ? (
        <QRDisplay value={qrValue} size={260} />
      ) : (
        <div style={{ width: 300, height: 300, background: '#14141c', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Loading…</p>
        </div>
      )}
      {user && (
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, fontFamily: "'DM Mono', monospace", margin: 0 }}>
          {user.handle}
        </p>
      )}
    </div>
  );
}

function SuccessOverlay({
  card, newCount, isReward, onDismiss,
}: {
  card: LoyaltyCard;
  newCount: number;
  isReward: boolean;
  onDismiss: () => void;
}) {
  const target = card.merchants?.stamp_target ?? 9;
  const toGo = Math.max(0, target - newCount);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(10,10,15,0.85)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
        padding: '0 16px 40px',
      }}
      onClick={isReward ? undefined : onDismiss}
    >
      <div
        style={{
          background: '#14141c',
          border: `1px solid ${isReward ? 'rgba(245,158,11,0.3)' : 'rgba(110,231,183,0.3)'}`,
          borderRadius: 24, padding: 28, width: '100%', maxWidth: 400,
          animation: 'slideUp 300ms ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{isReward ? '🎉' : '✅'}</div>
          <p style={{ fontSize: 22, fontWeight: 700, color: isReward ? '#f59e0b' : '#6ee7b7', margin: 0 }}>
            {isReward ? 'Reward unlocked!' : 'Stamp earned!'}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, margin: '6px 0 0' }}>
            {card.merchants?.name}
          </p>
        </div>

        {isReward ? (
          <div style={{ background: 'rgba(245,158,11,0.1)', borderRadius: 14, padding: '16px 20px', marginBottom: 20, textAlign: 'center' }}>
            <p style={{ color: '#f59e0b', fontWeight: 600, margin: 0 }}>{card.merchants?.reward_label}</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '4px 0 0' }}>Show to the merchant to claim</p>
          </div>
        ) : (
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', margin: '0 0 20px' }}>
            {newCount} of {target} stamps · {toGo} to go
          </p>
        )}

        <button onClick={onDismiss} style={{
          width: '100%', padding: '14px', borderRadius: 14,
          background: isReward ? '#f59e0b' : '#6ee7b7',
          color: '#0a0a0f', fontWeight: 700, fontSize: 16,
          border: 'none', cursor: 'pointer',
        }}>
          {isReward ? 'Got it' : 'Done'}
        </button>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(60px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function NamePrompt({ onSave, onCancel }: { onSave: (name: string) => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#14141c', borderRadius: 20, padding: 24, width: '100%', maxWidth: 360 }}>
        <p style={{ color: '#f0ede8', fontWeight: 600, fontSize: 17, margin: '0 0 16px' }}>Name this card</p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Tesco Clubcard"
          autoFocus
          style={{
            width: '100%', padding: '12px 14px', borderRadius: 12,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#f0ede8', fontSize: 15, outline: 'none', marginBottom: 16,
          }}
        />
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ ...pillBtn('rgba(255,255,255,0.08)', '#f0ede8'), flex: 1, padding: '12px' }}>Cancel</button>
          <button
            onClick={() => onSave(name)}
            disabled={!name.trim()}
            style={{ ...pillBtn('#6ee7b7', '#0a0a0f'), flex: 2, padding: '12px', opacity: name.trim() ? 1 : 0.4 }}
          >
            Save card
          </button>
        </div>
      </div>
    </div>
  );
}

function BarcodeModal({ card, onClose }: { card: SavedCard; onClose: () => void }) {
  if (!card) return null;
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={onClose}
    >
      <div style={{ background: '#14141c', borderRadius: 20, padding: 28, width: '100%', maxWidth: 360, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
        <p style={{ color: '#f0ede8', fontWeight: 600, fontSize: 17, margin: '0 0 8px' }}>{card.name}</p>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: "'DM Mono', monospace", margin: '0 0 20px', wordBreak: 'break-all' }}>{card.barcode}</p>
        <QRDisplay value={card.barcode} size={200} />
        <button onClick={onClose} style={{ ...pillBtn('rgba(255,255,255,0.08)', '#f0ede8'), marginTop: 20, padding: '12px 32px' }}>Close</button>
      </div>
    </div>
  );
}

type Tab2 = Tab;
function BottomNav({ tab, onTabChange }: { tab: Tab2; onTabChange: (t: Tab2) => void }) {
  const items: { id: Tab2; label: string; icon: string }[] = [
    { id: 'wallet', label: 'Wallet', icon: '🪙' },
    { id: 'scan',   label: 'Scan',   icon: '📷' },
    { id: 'myqr',  label: 'My QR',  icon: '🔲' },
  ];
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(12px)',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', paddingBottom: 'env(safe-area-inset-bottom)', zIndex: 40,
    }}>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onTabChange(item.id)}
          style={{
            flex: 1, padding: '12px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            background: 'transparent', border: 'none', cursor: 'pointer', touchAction: 'manipulation',
            color: tab === item.id ? '#6ee7b7' : 'rgba(255,255,255,0.35)',
          }}
        >
          <span style={{ fontSize: 22 }}>{item.icon}</span>
          <span style={{ fontSize: 11, fontWeight: tab === item.id ? 600 : 400 }}>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function pillBtn(bg: string, color: string): React.CSSProperties {
  return {
    background: bg, color, border: 'none', borderRadius: 9999,
    padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
  };
}
