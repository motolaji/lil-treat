import { LoyaltyCard, Reward } from './supabase';
import { cheapestActiveCost } from './rewards';

export const EXPIRY_DAYS = 90;
export const WARNING_THRESHOLD_DAYS = 14;

export interface ExpiryStatus {
  kind: 'redeems' | 'resets';
  daysRemaining: number;
  expired: boolean;
  atRisk: boolean;
}

// kind: 'redeems' — card is at/above target, counting down to the reward
// being forfeited. kind: 'resets' — below target, counting down to progress
// wiping to 0. `updated_at` correctly anchors both: issueStamp is the only
// thing that advances progress AND crosses the target, so once crossed it
// freezes at "time of reaching the reward" until redemption.
export function getExpiryStatus(
  card: LoyaltyCard & { updated_at: string },
  rewards: Reward[] = [],
): ExpiryStatus {
  const target = cheapestActiveCost(rewards, card.merchants?.stamp_target ?? 9);
  const isComplete = card.stamps_current >= target;
  const daysSince = (Date.now() - new Date(card.updated_at).getTime()) / 86_400_000;
  const daysRemaining = Math.max(0, Math.ceil(EXPIRY_DAYS - daysSince));

  return {
    kind: isComplete ? 'redeems' : 'resets',
    daysRemaining,
    expired: daysSince >= EXPIRY_DAYS,
    atRisk: daysRemaining <= WARNING_THRESHOLD_DAYS,
  };
}
