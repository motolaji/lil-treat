'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase, createMerchantAccount } from '../../../../lib/supabase';
import { inputStyle } from '../../authStyles';

export default function AddLocationPage() {
  const [businessName, setBusinessName] = useState('');
  const [stampTarget, setStampTarget] = useState('9');
  const [rewardLabel, setRewardLabel] = useState('Free coffee');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setError('You need to be logged in to add a location.');
      setSubmitting(false);
      return;
    }

    const { merchant, error: createError } = await createMerchantAccount(
      businessName.trim(),
      session.user.id,
      Math.max(1, parseInt(stampTarget, 10) || 9),
      rewardLabel.trim() || 'Free coffee',
    );

    if (!merchant) {
      setError(createError ?? 'Could not create this location. Try again.');
      setSubmitting(false);
      return;
    }

    // Full reload so MerchantProvider remounts and refetches the now-larger list.
    window.location.href = '/merchant';
  }

  return (
    <div>
      <Link href="/merchant" style={{ color: '#AEADA7', fontSize: 13, textDecoration: 'none' }}>‹ Back</Link>

      <h1 style={{ fontSize: 20, fontWeight: 700, margin: '12px 0 4px', color: '#1C1C1A', fontFamily: "'Syne', sans-serif", letterSpacing: '-0.02em' }}>
        Add another location
      </h1>
      <p style={{ color: '#AEADA7', fontSize: 13, margin: '0 0 20px' }}>
        Creates a new business under your existing login
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="Business name"
          required
          style={inputStyle}
        />
        <input
          type="number"
          value={stampTarget}
          onChange={(e) => setStampTarget(e.target.value)}
          placeholder="Stamps needed for a reward"
          min={1}
          required
          style={inputStyle}
        />
        <input
          type="text"
          value={rewardLabel}
          onChange={(e) => setRewardLabel(e.target.value)}
          placeholder="Reward (e.g. Free coffee)"
          required
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
          {submitting ? 'Creating…' : 'Add location'}
        </button>
      </form>
    </div>
  );
}
