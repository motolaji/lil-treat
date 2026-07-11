'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import MerchantNav from '../components/MerchantNav';
import { MerchantProvider, useMerchant } from './MerchantContext';
import { centeredPage, inputStyle } from './authStyles';

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  // Signup is for people who don't have a merchant account yet — it must not be
  // wrapped in the auth gate below, otherwise any existing session (even an
  // unrelated anonymous consumer one from the same browser) would pull it into
  // MerchantShell/MerchantNav instead of rendering standalone.
  if (pathname === '/merchant/signup') return <>{children}</>;

  if (loading) {
    return (
      <div style={centeredPage}>
        <p style={{ color: '#AEADA7', fontSize: 14 }}>Loading…</p>
      </div>
    );
  }

  if (!session) return <LoginScreen />;

  return (
    <MerchantProvider>
      <MerchantShell>{children}</MerchantShell>
    </MerchantProvider>
  );
}

function MerchantShell({ children }: { children: React.ReactNode }) {
  const { merchant, merchants, setMerchant } = useMerchant();

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#F7F7F5' }}>
      <div style={{
        paddingTop: 'env(safe-area-inset-top)',
        background: '#FFFFFF', borderBottom: '1px solid #EBEBE8',
        padding: `env(safe-area-inset-top) 16px 0`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0' }}>
          {merchants.length > 1 && merchant && (
            <>
              <span style={{ color: '#AEADA7', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>Location</span>
              <select
                value={merchant.id}
                onChange={(e) => {
                  const m = merchants.find((x) => x.id === e.target.value);
                  if (m) setMerchant(m);
                }}
                style={{
                  flex: 1, background: '#F7F7F5', border: '1px solid #EBEBE8',
                  borderRadius: 8, padding: '6px 10px', fontSize: 14, fontWeight: 500,
                  color: '#1C1C1A', fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
                }}
              >
                {merchants.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </>
          )}
          <div style={{ marginLeft: merchants.length > 1 ? 0 : 'auto', display: 'flex', gap: 14, flexShrink: 0 }}>
            <Link
              href="/merchant/rewards"
              style={{ color: '#1C1C1A', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
            >
              Rewards
            </Link>
            <Link
              href="/merchant/locations/add"
              style={{ color: '#13B96D', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
            >
              + Add location
            </Link>
          </div>
        </div>
      </div>
      <main style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px' }}>
        {children}
      </main>
      <MerchantNav />
    </div>
  );
}

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
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1C1C1A', margin: '0 0 6px', fontFamily: "'Syne', sans-serif", letterSpacing: '-0.03em' }}>Stackpot</h1>
          <p style={{ color: '#AEADA7', fontSize: 14, margin: 0 }}>Sign in to your merchant account</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required style={inputStyle} />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required style={inputStyle} />

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px' }}>
              <p style={{ color: '#DC2626', fontSize: 13, margin: 0 }}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '15px', background: '#13B96D', color: '#FFFFFF',
              border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 600,
              cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.6 : 1,
              fontFamily: 'inherit', touchAction: 'manipulation', marginTop: 4,
              letterSpacing: '-0.01em',
            }}
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#AEADA7' }}>
          New here?{' '}
          <Link href="/merchant/signup" style={{ color: '#13B96D', fontWeight: 600, textDecoration: 'none' }}>
            Sign up your business
          </Link>
        </p>
      </div>
    </div>
  );
}
