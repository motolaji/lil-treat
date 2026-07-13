import { useEffect, useState } from 'react';
import { getTodayStamps, getTodayTransactions, getMerchantClaims, resolveClaim, PointClaim } from '../../lib/supabase';
import { useMerchant } from '../../context/MerchantContext';
import Card from '../../components/ui/Card';
import StatTile from '../../components/ui/StatTile';
import SectionLabel from '../../components/ui/SectionLabel';
import PillButton from '../../components/ui/PillButton';
import EmptyState from '../../components/ui/EmptyState';
import Skeleton from '../../components/ui/Skeleton';
import { color, font } from '../../styles/tokens';
import './TodayScreen.css';

export default function TodayScreen() {
  const { merchant, loading: merchantLoading } = useMerchant();
  const [todayCount, setTodayCount] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [todayTx, setTodayTx] = useState<any[]>([]);
  const [claims, setClaims] = useState<PointClaim[]>([]);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!merchant) return;
    setDataLoading(true);
    async function load() {
      const [count, tx, allClaims] = await Promise.all([
        getTodayStamps(merchant!.id),
        getTodayTransactions(merchant!.id),
        getMerchantClaims(merchant!.id),
      ]);
      setTodayCount(count);
      setTodayTx(tx);
      setClaims(allClaims.filter((c) => c.status === 'pending'));
      setDataLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchant?.id]);

  async function handleResolve(claim: PointClaim, approve: boolean) {
    setResolvingId(claim.id);
    const ok = await resolveClaim(
      claim.id,
      approve,
      approve ? claim.loyalty_card_id : undefined,
      approve ? claim.merchant_id : undefined,
      approve ? claim.user_id : undefined,
    );
    setResolvingId(null);
    if (ok) setClaims((prev) => prev.filter((c) => c.id !== claim.id));
  }

  const loading = merchantLoading || dataLoading;

  return (
    <div style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 20px', color: color.text, fontFamily: font.heading, letterSpacing: '-0.02em' }}>Today</h1>

      {loading ? (
        <Skeleton height={120} style={{ marginBottom: 16 }} />
      ) : (
        <StatTile label="Treats issued today" value={todayCount} style={{ marginBottom: 16 }} />
      )}

      {loading ? (
        <Skeleton height={80} />
      ) : (
        <div className="today__columns">
          <div className="today__column">
            {claims.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <SectionLabel>Pending claims</SectionLabel>
                {claims.map((claim) => (
                  <Card key={claim.id} padding="14px 16px" style={{ background: color.warningBg, border: `1px solid ${color.warningBorder}` }}>
                    <p style={{ color: color.text, fontSize: 14, margin: '0 0 2px', fontFamily: font.mono }}>
                      {claim.users?.handle ?? 'unknown'}
                    </p>
                    <p style={{ color: color.text, fontSize: 13, margin: '0 0 10px' }}>{claim.note}</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <PillButton
                        intent="danger"
                        fullWidth
                        onClick={() => handleResolve(claim, false)}
                        disabled={resolvingId === claim.id}
                      >
                        Reject
                      </PillButton>
                      <PillButton
                        intent="accent"
                        fullWidth
                        onClick={() => handleResolve(claim, true)}
                        disabled={resolvingId === claim.id}
                      >
                        Approve
                      </PillButton>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="today__column">
            {todayTx.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <SectionLabel>Recent activity</SectionLabel>
                {todayTx.map((tx, i) => {
                  const handle = tx.loyalty_cards?.users?.handle ?? 'unknown';
                  const time = new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <Card key={i} padding="12px 16px" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                      <p style={{ color: color.text, fontSize: 14, margin: 0, fontFamily: font.mono }}>{handle}</p>
                      <p style={{ color: color.muted, fontSize: 12, margin: 0 }}>{time}</p>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <EmptyState message="No treats issued yet today" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
