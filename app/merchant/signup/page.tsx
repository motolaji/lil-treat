'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, createMerchantAccount } from '../../../lib/supabase';
import { centeredPage, inputStyle } from '../authStyles';

export default function MerchantSignupPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError || !data.user) {
      setError(signUpError?.message ?? 'Could not create account. Try again.');
      setSubmitting(false);
      return;
    }

    if (!data.session) {
      setError('Account created, but email confirmation is still required — disable "Confirm email" in Supabase (Authentication → Providers → Email) and try again.');
      setSubmitting(false);
      return;
    }

    const { merchant, error: merchantError } = await createMerchantAccount(businessName.trim(), data.user.id);
    if (!merchant) {
      setError(merchantError ?? 'Could not set up your business. Try again.');
      setSubmitting(false);
      return;
    }

    router.push('/merchant');
  }

  return (
    <div style={centeredPage}>
      <div style={{ width: '100%', maxWidth: 360, padding: '0 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1C1C1A', margin: '0 0 6px', fontFamily: "'Syne', sans-serif", letterSpacing: '-0.03em' }}>Stackpot</h1>
          <p style={{ color: '#AEADA7', fontSize: 14, margin: 0 }}>Set up your business in a couple of minutes</p>
        </div>

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Business name"
            required
            style={inputStyle}
          />
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
            minLength={6}
            style={inputStyle}
          />

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
            {submitting ? 'Setting up…' : 'Create business account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#AEADA7' }}>
          Already have an account?{' '}
          <Link href="/merchant" style={{ color: '#13B96D', fontWeight: 600, textDecoration: 'none' }}>
            Log in instead
          </Link>
        </p>
      </div>
    </div>
  );
}
