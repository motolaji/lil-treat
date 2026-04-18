'use client';

import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import QRScanner from '../components/QRScanner';
import QRDisplay from '../components/QRDisplay';
import {
  supabase,
  getMerchantBySlug,
  getOrCreateCard,
  issueStamp,
  getTodayStamps,
  getTodayTransactions,
  Merchant,
} from '../../lib/supabase';

// ── Types ──────────────────────────────────────────────────────────────────

type Tab = 'qr' | 'scan' | 'today';

interface ConsumerPayload {
  type: 'consumer';
  user_handle: string;
  user_id: string;
}

// ── Main component ─────────────────────────────────────────────────────────

export default function MerchantPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={centeredPage}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Loading…</p>
      </div>
    );
  }

  if (!session) return <LoginScreen />;
  return <MerchantApp session={session} />;
}

// ── Login screen ───────────────────────────────────────────────────────────

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setSubmitting(false);
  }

  return (
    <div style={centeredPage}>
      <div style={{ width: '100%', maxWidth: 360, padding: '0 24px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#6ee7b7', margin: '0 0 6px' }}>Stackpot</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: '0 0 32px' }}>Merchant login</p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            style={inputStyle}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            style={inputStyle}
          />

          {error && (
            <p style={{ color: '#f87171', fontSize: 14, margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '16px', background: '#6ee7b7', color: '#0a0a0f',
              border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700,
              cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.6 : 1,
              fontFamily: 'inherit',
            }}
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Merchant app (post-login) ──────────────────────────────────────────────

function MerchantApp({ session }: { session: Session }) {
  const [tab, setTab] = useState<Tab>('qr');
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [todayCount, setTodayCount] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [todayTx, setTodayTx] = useState<any[]>([]);
  const [scanConfirm, setScanConfirm] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      // Demo: merchant slug is hardcoded for seeded merchant
      const m = await getMerchantBySlug('verde-coffee');
      if (!m) return;
      setMerchant(m);
      const count = await getTodayStamps(m.id);
      setTodayCount(count);
      const tx = await getTodayTransactions(m.id);
      setTodayTx(tx);
    }
    load();
  }, [session]);

  async function handleScanResult(text: string) {
    if (!merchant) return;
    setScanError(null);
    setScanConfirm(null);

    let payload: ConsumerPayload;
    try {
      payload = JSON.parse(text);
    } catch {
      setScanError('Invalid QR code. Ask customer to show their My QR tab.');
      return;
    }

    if (payload.type !== 'consumer' || !payload.user_id) {
      setScanError('Not a consumer QR.');
      return;
    }

    const card = await getOrCreateCard(payload.user_id, merchant.id);
    if (!card) {
      setScanError('Could not load customer card. Check connection.');
      return;
    }

    const newCount = await issueStamp(card.id, card.stamps_current);
    if (newCount === null) {
      setScanError('Failed to issue stamp. Try again.');
      return;
    }

    const name = payload.user_handle ?? 'Customer';
    setScanConfirm(`Stamp issued to ${name} — now ${newCount} of ${merchant.stamp_target}`);
    setTodayCount((c) => c + 1);

    // Refresh today list
    const tx = await getTodayTransactions(merchant.id);
    setTodayTx(tx);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  const merchantQR = merchant
    ? JSON.stringify({ type: 'merchant', merchant_id: merchant.id })
    : '';

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#0a0a0f' }}>
      <main style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 88px' }}>
        {/* Header */}
        <div style={{ paddingTop: 'env(safe-area-inset-top)', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0, color: '#f0ede8' }}>
              {merchant?.name ?? 'Stackpot Merchant'}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: '2px 0 0' }}>Merchant portal</p>
          </div>
          <button onClick={handleSignOut} style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.4)', borderRadius: 9999, padding: '6px 14px',
            fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Sign out
          </button>
        </div>

        {/* QR tab */}
        {tab === 'qr' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0, textAlign: 'center' }}>
              Place this on the counter — customers scan it to earn stamps
            </p>
            {merchantQR ? (
              <QRDisplay value={merchantQR} size={Math.min(window.innerWidth - 80, 300)} />
            ) : (
              <div style={{ width: 280, height: 280, background: '#14141c', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'rgba(255,255,255,0.3)' }}>Loading…</p>
              </div>
            )}
            <div style={{
              background: '#14141c', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16, padding: '14px 20px', width: '100%', maxWidth: 360,
            }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '0 0 4px' }}>Target</p>
              <p style={{ color: '#f0ede8', fontSize: 16, fontWeight: 600, margin: 0 }}>
                {merchant?.stamp_target ?? '—'} stamps → {merchant?.reward_label ?? '…'}
              </p>
            </div>
          </div>
        )}

        {/* Scan tab */}
        {tab === 'scan' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0, textAlign: 'center' }}>
              Scan the customer&apos;s QR code to issue a stamp
            </p>
            <QRScanner
              active={tab === 'scan'}
              onResult={handleScanResult}
              onError={(e) => setScanError(e.message)}
            />
            {scanConfirm && (
              <div style={{ background: 'rgba(110,231,183,0.1)', border: '1px solid rgba(110,231,183,0.3)', borderRadius: 14, padding: '16px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                <p style={{ color: '#6ee7b7', fontWeight: 600, fontSize: 16, margin: 0 }}>{scanConfirm}</p>
              </div>
            )}
            {scanError && (
              <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 12, padding: '12px 16px' }}>
                <p style={{ color: '#f87171', fontSize: 14, margin: 0 }}>{scanError}</p>
              </div>
            )}
          </div>
        )}

        {/* Today tab */}
        {tab === 'today' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              background: '#14141c', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20, padding: '24px', textAlign: 'center',
            }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '0 0 4px' }}>Stamps issued today</p>
              <p style={{ color: '#6ee7b7', fontSize: 52, fontWeight: 700, margin: 0, lineHeight: 1 }}>{todayCount}</p>
            </div>

            {todayTx.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recent activity</p>
                {todayTx.map((tx, i) => {
                  const handle = tx.loyalty_cards?.users?.handle ?? 'unknown';
                  const time = new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={i} style={{
                      background: '#14141c', border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 12, padding: '12px 16px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <p style={{ color: '#f0ede8', fontSize: 14, margin: 0, fontFamily: "'DM Mono', monospace" }}>{handle}</p>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0 }}>{time}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {todayTx.length === 0 && (
              <div style={{ textAlign: 'center', paddingTop: 40 }}>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>No stamps issued yet today</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom nav */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', paddingBottom: 'env(safe-area-inset-bottom)', zIndex: 40,
      }}>
        {([
          { id: 'qr', label: 'My QR', icon: '🔲' },
          { id: 'scan', label: 'Scan customer', icon: '📷' },
          { id: 'today', label: 'Today', icon: '📊' },
        ] as { id: Tab; label: string; icon: string }[]).map((item) => (
          <button
            key={item.id}
            onClick={() => { setScanError(null); setScanConfirm(null); setTab(item.id); }}
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
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const centeredPage: React.CSSProperties = {
  minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: '#0a0a0f',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '14px 16px', borderRadius: 14,
  background: '#14141c', border: '1px solid rgba(255,255,255,0.1)',
  color: '#f0ede8', fontSize: 16, outline: 'none', fontFamily: 'inherit',
};
