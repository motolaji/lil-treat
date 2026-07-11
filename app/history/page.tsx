'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TransactionRow from '../components/TransactionRow';
import {
  getOrCreateUser, getUserTransactions, getOrCreateCard, createPointClaim, getUserClaims,
  TransactionRow as TransactionRowData, PointClaim, UserRow,
} from '../../lib/supabase';

export default function HistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserRow | null>(null);
  const [transactions, setTransactions] = useState<TransactionRowData[]>([]);
  const [claims, setClaims] = useState<PointClaim[]>([]);
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimNote, setClaimNote] = useState('');
  const [claimDate, setClaimDate] = useState('');
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get('merchant');
    setMerchantId(m);

    async function load() {
      const u = await getOrCreateUser();
      if (!u) { setLoading(false); return; }
      setUser(u);
      const [tx, userClaims] = await Promise.all([
        getUserTransactions(u.id, m ?? undefined),
        getUserClaims(u.id),
      ]);
      setTransactions(tx);
      setClaims(m ? userClaims.filter((c) => c.merchant_id === m) : userClaims);
      setLoading(false);
    }
    load();
  }, []);

  async function handleSubmitClaim(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !merchantId || !claimNote.trim()) return;

    setClaimSubmitting(true);
    setClaimError(null);

    const card = await getOrCreateCard(user.id, merchantId);
    if (!card) {
      setClaimError('Could not find your card for this vendor.');
      setClaimSubmitting(false);
      return;
    }

    const ok = await createPointClaim(card.id, user.id, merchantId, claimNote.trim(), claimDate || undefined);
    setClaimSubmitting(false);

    if (!ok) {
      setClaimError('Could not submit your claim. Try again.');
      return;
    }

    setClaimNote('');
    setClaimDate('');
    setShowClaimForm(false);
    const fresh = await getUserClaims(user.id);
    setClaims(fresh.filter((c) => c.merchant_id === merchantId));
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#F7F7F5', padding: '16px' }}>
      <div style={{ paddingTop: 'env(safe-area-inset-top)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.push('/')} style={backBtnStyle}>‹</button>
        <h1 style={titleStyle}>{merchantId ? 'Visit history' : 'All visits'}</h1>
      </div>

      {loading ? (
        <p style={{ color: '#AEADA7', fontSize: 14, textAlign: 'center', paddingTop: 40 }}>Loading…</p>
      ) : (
        <>
          {transactions.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: 20, marginBottom: 20 }}>
              <p style={{ color: '#AEADA7', fontSize: 14 }}>No visits yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {transactions.map((tx) => (
                <TransactionRow key={tx.id} transaction={tx} showMerchant={!merchantId} />
              ))}
            </div>
          )}

          {merchantId && (
            <>
              {!showClaimForm ? (
                <button onClick={() => setShowClaimForm(true)} style={claimLinkStyle}>
                  Missing a visit? Report it
                </button>
              ) : (
                <form onSubmit={handleSubmitClaim} style={{
                  background: '#FFFFFF', border: '1px solid #EBEBE8', borderRadius: 16,
                  padding: 16, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10,
                }}>
                  <textarea
                    value={claimNote}
                    onChange={(e) => setClaimNote(e.target.value)}
                    placeholder="What happened? (e.g. visited Tuesday, forgot to scan)"
                    required
                    rows={3}
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 12, boxSizing: 'border-box',
                      background: '#F7F7F5', border: '1px solid #EBEBE8',
                      color: '#1C1C1A', fontSize: 14, outline: 'none', fontFamily: 'inherit', resize: 'vertical',
                    }}
                  />
                  <input
                    type="date"
                    value={claimDate}
                    onChange={(e) => setClaimDate(e.target.value)}
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 12, boxSizing: 'border-box',
                      background: '#F7F7F5', border: '1px solid #EBEBE8',
                      color: '#1C1C1A', fontSize: 14, outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                  {claimError && (
                    <p style={{ color: '#DC2626', fontSize: 13, margin: 0 }}>{claimError}</p>
                  )}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setShowClaimForm(false)}
                      style={{ flex: 1, padding: '12px', background: '#F7F7F5', color: '#1C1C1A', border: '1px solid #EBEBE8', borderRadius: 9999, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={claimSubmitting}
                      style={{ flex: 2, padding: '12px', background: '#13B96D', color: '#FFFFFF', border: 'none', borderRadius: 9999, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: claimSubmitting ? 0.6 : 1 }}
                    >
                      {claimSubmitting ? 'Submitting…' : 'Submit claim'}
                    </button>
                  </div>
                </form>
              )}

              {claims.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p style={{ color: '#AEADA7', fontSize: 11, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
                    Your claims
                  </p>
                  {claims.map((claim) => (
                    <div key={claim.id} style={{
                      background: '#FFFFFF', border: '1px solid #EBEBE8', borderRadius: 12,
                      padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
                    }}>
                      <p style={{ color: '#1C1C1A', fontSize: 13, margin: 0, flex: 1 }}>{claim.note}</p>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 9999, flexShrink: 0,
                        background: claim.status === 'approved' ? '#DCFCE7' : claim.status === 'rejected' ? '#FEF2F2' : '#F7F7F5',
                        color: claim.status === 'approved' ? '#13B96D' : claim.status === 'rejected' ? '#DC2626' : '#AEADA7',
                      }}>
                        {claim.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

const claimLinkStyle: React.CSSProperties = {
  width: '100%', background: 'transparent', border: 'none', color: '#13B96D',
  fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', padding: '10px 0', marginBottom: 16,
};

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
