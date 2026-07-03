'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, getOrCreateUser, getMerchantsForUser, updateHandle, upgradeAccount, UserRow } from '../../lib/supabase';

type Mode = 'loading' | 'anonymous' | 'login' | 'upgraded';

export default function AccountPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('loading');
  const [user, setUser] = useState<UserRow | null>(null);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const u = await getOrCreateUser();
      if (!u) { setMode('anonymous'); return; }
      setUser(u);
      setUsername(u.handle);

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser?.is_anonymous === false) {
        setCurrentEmail(authUser.email ?? null);
        setMode('upgraded');
      } else {
        setMode('anonymous');
      }
    }
    load();
  }, []);

  async function handleUpgrade(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (user && username.trim() && username.trim() !== user.handle) {
      const ok = await updateHandle(user.id, username.trim());
      if (!ok) {
        setError('That username is taken. Try another.');
        setSubmitting(false);
        return;
      }
    }

    const { error: upgradeError } = await upgradeAccount(email, password);
    setSubmitting(false);
    if (upgradeError) {
      setError(upgradeError);
      return;
    }

    setCurrentEmail(email);
    setMode('upgraded');
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError || !data.user) {
      setSubmitting(false);
      setError(loginError?.message ?? 'Could not log in. Try again.');
      return;
    }

    // A merchant's email/password is a valid credential in this same Supabase
    // project — block it here rather than silently logging a business account
    // into an empty consumer wallet.
    const ownedMerchants = await getMerchantsForUser(data.user.id);
    if (ownedMerchants.length > 0) {
      await supabase.auth.signOut();
      setSubmitting(false);
      setError('That looks like a business account — log in at /merchant instead.');
      return;
    }

    setSubmitting(false);
    router.push('/');
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#F7F7F5', padding: '16px' }}>
      <div style={{ paddingTop: 'env(safe-area-inset-top)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.push('/')} style={backBtnStyle}>‹</button>
        <h1 style={titleStyle}>Account</h1>
      </div>

      {mode === 'loading' && (
        <p style={{ color: '#AEADA7', fontSize: 14, textAlign: 'center', paddingTop: 40 }}>Loading…</p>
      )}

      {mode === 'upgraded' && (
        <div style={{ background: '#FFFFFF', border: '1px solid #EBEBE8', borderRadius: 20, padding: 24 }}>
          <p style={{ color: '#1C1C1A', fontWeight: 600, fontSize: 16, margin: '0 0 4px', fontFamily: "'Syne', sans-serif" }}>
            Signed in as {currentEmail}
          </p>
          {user && (
            <p style={{ color: '#AEADA7', fontSize: 13, margin: '0 0 20px', fontFamily: "'DM Mono', monospace" }}>
              {user.handle}
            </p>
          )}
          <button onClick={handleSignOut} style={dangerBtnStyle}>Sign out</button>
        </div>
      )}

      {mode === 'anonymous' && (
        <>
          <div style={{ background: '#FFFFFF', border: '1px solid #EBEBE8', borderRadius: 20, padding: 24, marginBottom: 16 }}>
            <p style={{ color: '#1C1C1A', fontWeight: 600, fontSize: 16, margin: '0 0 4px', fontFamily: "'Syne', sans-serif" }}>
              Secure your treats
            </p>
            <p style={{ color: '#AEADA7', fontSize: 13, margin: '0 0 18px' }}>
              Add an email so your wallet survives a lost phone or a new device.
            </p>

            <form onSubmit={handleUpgrade} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                style={fieldStyle}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                style={fieldStyle}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                minLength={6}
                style={fieldStyle}
              />

              {error && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px' }}>
                  <p style={{ color: '#DC2626', fontSize: 13, margin: 0 }}>{error}</p>
                </div>
              )}

              <button type="submit" disabled={submitting} style={{ ...primaryBtnStyle, opacity: submitting ? 0.6 : 1 }}>
                {submitting ? 'Saving…' : 'Secure my account'}
              </button>
            </form>
          </div>

          <button onClick={() => { setMode('login'); setError(null); }} style={linkBtnStyle}>
            Already have an account? Log in instead
          </button>
        </>
      )}

      {mode === 'login' && (
        <div style={{ background: '#FFFFFF', border: '1px solid #EBEBE8', borderRadius: 20, padding: 24 }}>
          <p style={{ color: '#1C1C1A', fontWeight: 600, fontSize: 16, margin: '0 0 4px', fontFamily: "'Syne', sans-serif" }}>
            Log in
          </p>
          <p style={{ color: '#AEADA7', fontSize: 13, margin: '0 0 18px' }}>
            This replaces your current wallet with the one tied to this account.
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              style={fieldStyle}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              style={fieldStyle}
            />

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px' }}>
                <p style={{ color: '#DC2626', fontSize: 13, margin: 0 }}>{error}</p>
              </div>
            )}

            <button type="submit" disabled={submitting} style={{ ...primaryBtnStyle, opacity: submitting ? 0.6 : 1 }}>
              {submitting ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          <button onClick={() => { setMode('anonymous'); setError(null); }} style={{ ...linkBtnStyle, marginTop: 16 }}>
            Back to secure my account
          </button>
        </div>
      )}
    </div>
  );
}

const titleStyle: React.CSSProperties = {
  fontSize: 22, fontWeight: 700, margin: 0, color: '#1C1C1A',
  fontFamily: "'Syne', sans-serif", letterSpacing: '-0.02em',
};

const backBtnStyle: React.CSSProperties = {
  width: 32, height: 32, borderRadius: '50%', background: '#FFFFFF', border: '1px solid #EBEBE8',
  color: '#1C1C1A', fontSize: 20, lineHeight: 1, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
};

const fieldStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 12, boxSizing: 'border-box',
  background: '#F7F7F5', border: '1px solid #EBEBE8',
  color: '#1C1C1A', fontSize: 15, outline: 'none', fontFamily: 'inherit',
};

const primaryBtnStyle: React.CSSProperties = {
  padding: '14px', background: '#13B96D', color: '#FFFFFF', border: 'none', borderRadius: 14,
  fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
};

const dangerBtnStyle: React.CSSProperties = {
  padding: '12px 20px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA',
  borderRadius: 9999, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
};

const linkBtnStyle: React.CSSProperties = {
  width: '100%', background: 'transparent', border: 'none', color: '#13B96D',
  fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', padding: '8px 0',
};
