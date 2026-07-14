import { useEffect, useMemo, useState } from 'react';
import { getMerchantActivity, getMerchantClaims, resolveClaim, ActivityTransaction, PointClaim } from '../../lib/supabase';
import { useMerchant } from '../../context/MerchantContext';
import Card from '../../components/ui/Card';
import StatTile from '../../components/ui/StatTile';
import SectionLabel from '../../components/ui/SectionLabel';
import PillButton from '../../components/ui/PillButton';
import EmptyState from '../../components/ui/EmptyState';
import Skeleton from '../../components/ui/Skeleton';
import { color, font } from '../../styles/tokens';
import './ActivityScreen.css';

type Range = 'today' | '7d' | '30d';

const RANGE_LABELS: Record<Range, string> = { today: 'Today', '7d': '7 Days', '30d': '30 Days' };
const RANGE_DAYS: Record<Range, number> = { today: 1, '7d': 7, '30d': 30 };

const TYPE_META: Record<ActivityTransaction['type'], { label: string; color: string; bg: string }> = {
  earn: { label: 'Treat given', color: color.accentText, bg: color.accentBg },
  redeem: { label: 'Redeemed', color: color.warning, bg: color.warningBg },
  expire: { label: 'Expired', color: color.muted, bg: color.bg },
};

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function rangeStart(range: Range): Date {
  const start = startOfDay(new Date());
  start.setDate(start.getDate() - (RANGE_DAYS[range] - 1));
  return start;
}

function formatAge(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function dayLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = startOfDay(new Date());
  const day = startOfDay(date);
  const diffDays = Math.round((today.getTime() - day.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function deltaFor(current: number, previous: number): { text: string; direction: 'up' | 'down' | 'flat' } {
  if (previous === 0) {
    if (current === 0) return { text: 'No change', direction: 'flat' };
    return { text: 'New this period', direction: 'up' };
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return { text: 'No change vs previous', direction: 'flat' };
  return { text: `${pct > 0 ? '+' : ''}${pct}% vs previous`, direction: pct > 0 ? 'up' : 'down' };
}

export default function ActivityScreen() {
  const { merchant, loading: merchantLoading } = useMerchant();
  const [activity, setActivity] = useState<ActivityTransaction[]>([]);
  const [claims, setClaims] = useState<PointClaim[]>([]);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [range, setRange] = useState<Range>('today');

  useEffect(() => {
    if (!merchant) return;
    setDataLoading(true);
    Promise.all([
      getMerchantActivity(merchant.id),
      getMerchantClaims(merchant.id),
    ]).then(([loadedActivity, loadedClaims]) => {
      setActivity(loadedActivity);
      setClaims(loadedClaims);
      setDataLoading(false);
    });
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
    if (ok) {
      setClaims((prev) => prev.map((c) => (c.id === claim.id ? { ...c, status: approve ? 'approved' : 'rejected' } : c)));
    }
  }

  const loading = merchantLoading || dataLoading;
  const start = useMemo(() => rangeStart(range), [range]);
  const previousStart = useMemo(() => {
    const d = new Date(start);
    d.setDate(d.getDate() - RANGE_DAYS[range]);
    return d;
  }, [start, range]);

  const filtered = useMemo(
    () => activity.filter((t) => new Date(t.created_at) >= start),
    [activity, start],
  );
  const previousFiltered = useMemo(
    () => activity.filter((t) => {
      const created = new Date(t.created_at);
      return created >= previousStart && created < start;
    }),
    [activity, previousStart, start],
  );

  const treatsGiven = filtered.filter((t) => t.type === 'earn').length;
  const redemptions = filtered.filter((t) => t.type === 'redeem').length;
  const activeCustomers = new Set(filtered.map((t) => t.loyalty_cards?.users?.handle).filter(Boolean)).size;

  const previousTreatsGiven = previousFiltered.filter((t) => t.type === 'earn').length;
  const previousRedemptions = previousFiltered.filter((t) => t.type === 'redeem').length;
  const previousActiveCustomers = new Set(previousFiltered.map((t) => t.loyalty_cards?.users?.handle).filter(Boolean)).size;

  const trend = useMemo(() => {
    const days: { label: string; count: number; isToday: boolean }[] = [];
    for (let i = 6; i >= 0; i -= 1) {
      const day = startOfDay(new Date());
      day.setDate(day.getDate() - i);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      const count = activity.filter((t) => {
        if (t.type !== 'earn') return false;
        const created = new Date(t.created_at);
        return created >= day && created < nextDay;
      }).length;
      days.push({ label: day.toLocaleDateString([], { weekday: 'narrow' }), count, isToday: i === 0 });
    }
    return days;
  }, [activity]);
  const trendMax = Math.max(1, ...trend.map((d) => d.count));

  const repeatCustomers = useMemo(() => {
    const counts = new Map<string, number>();
    filtered.forEach((t) => {
      const handle = t.loyalty_cards?.users?.handle;
      if (!handle) return;
      counts.set(handle, (counts.get(handle) ?? 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [filtered]);

  const pendingClaims = claims.filter((c) => c.status === 'pending');
  const resolvedClaims = claims.filter((c) => c.status !== 'pending');
  const approvalRate = resolvedClaims.length > 0
    ? Math.round((resolvedClaims.filter((c) => c.status === 'approved').length / resolvedClaims.length) * 100)
    : null;

  const groupedActivity = useMemo(() => {
    const groups: { label: string; items: ActivityTransaction[] }[] = [];
    filtered.slice(0, 50).forEach((tx) => {
      const label = dayLabel(tx.created_at);
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.label === label) {
        lastGroup.items.push(tx);
      } else {
        groups.push({ label, items: [tx] });
      }
    });
    return groups;
  }, [filtered]);

  return (
    <div style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', color: color.text, fontFamily: font.heading, letterSpacing: '-0.02em' }}>Activity</h1>
      <p style={{ color: color.muted, fontSize: 13, margin: '0 0 16px' }}>
        Treats given, redemptions, and claims for this location
      </p>

      <div className="activity__range">
        {(Object.keys(RANGE_LABELS) as Range[]).map((r) => {
          const isSelected = range === r;
          return (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              style={{
                minHeight: 44, padding: '0 18px', borderRadius: 999,
                border: `1.5px solid ${isSelected ? color.accent : color.border}`,
                background: isSelected ? color.accent : color.card,
                color: isSelected ? color.card : color.text,
                fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
              }}
            >
              {RANGE_LABELS[r]}
            </button>
          );
        })}
      </div>

      {loading ? (
        <Skeleton height={120} style={{ marginBottom: 16 }} />
      ) : (
        <div className="activity__stats">
          <StatTile compact label="Treats given" value={treatsGiven} delta={deltaFor(treatsGiven, previousTreatsGiven)} />
          <StatTile compact label="Redemptions" value={redemptions} delta={deltaFor(redemptions, previousRedemptions)} />
          <StatTile compact label="Active customers" value={activeCustomers} delta={deltaFor(activeCustomers, previousActiveCustomers)} />
        </div>
      )}

      {!loading && (
        <Card style={{ marginBottom: 16 }}>
          <SectionLabel style={{ marginBottom: 4 }}>Last 7 days</SectionLabel>
          <div className="activity__chart">
            {trend.map((d, i) => (
              <div className="activity__bar-col" key={i}>
                <div
                  className="activity__bar"
                  style={{
                    height: `${Math.max(6, (d.count / trendMax) * 100)}%`,
                    background: d.isToday ? color.accent : color.border,
                  }}
                />
                <span className="activity__bar-label" style={{ color: d.isToday ? color.accent : color.muted, fontWeight: d.isToday ? 700 : 400 }}>
                  {d.label}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {loading ? (
        <Skeleton height={80} />
      ) : (
        <div className="activity__columns">
          <div className="activity__column">
            {pendingClaims.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                <SectionLabel>Pending claims</SectionLabel>
                {approvalRate !== null && (
                  <p style={{ color: color.muted, fontSize: 12, margin: '0 0 4px' }}>
                    {approvalRate}% approved historically
                  </p>
                )}
                {pendingClaims.map((claim) => (
                  <Card key={claim.id} padding="14px 16px" style={{ background: color.warningBg, border: `1px solid ${color.warningBorder}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <p style={{ color: color.text, fontSize: 14, margin: '0 0 2px', fontFamily: font.mono }}>
                        {claim.users?.handle ?? 'unknown'}
                      </p>
                      <span style={{ color: color.muted, fontSize: 11, flexShrink: 0 }}>{formatAge(claim.created_at)}</span>
                    </div>
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

            {repeatCustomers.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <SectionLabel>Repeat customers</SectionLabel>
                {repeatCustomers.map(([handle, count]) => (
                  <Card key={handle} padding="10px 14px" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ color: color.text, fontSize: 14, margin: 0, fontFamily: font.mono }}>{handle}</p>
                    <p style={{ color: color.muted, fontSize: 12, margin: 0 }}>{count} visit{count === 1 ? '' : 's'}</p>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="activity__column">
            {groupedActivity.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {groupedActivity.map((group) => (
                  <div key={group.label} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <SectionLabel>{group.label}</SectionLabel>
                    {group.items.map((tx) => {
                      const handle = tx.loyalty_cards?.users?.handle ?? 'unknown';
                      const time = new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const meta = TYPE_META[tx.type];
                      const detail = tx.type === 'redeem' && tx.rewards?.label ? tx.rewards.label : meta.label;
                      return (
                        <Card key={tx.id} padding="12px 16px" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ color: color.text, fontSize: 14, margin: 0, fontFamily: font.mono }}>{handle}</p>
                            <span style={{
                              display: 'inline-block', marginTop: 4, fontSize: 11, fontWeight: 600,
                              color: meta.color, background: meta.bg, borderRadius: 999, padding: '2px 8px',
                            }}>
                              {detail}
                            </span>
                          </div>
                          <p style={{ color: color.muted, fontSize: 12, margin: 0, flexShrink: 0 }}>{time}</p>
                        </Card>
                      );
                    })}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No activity in this range yet" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
