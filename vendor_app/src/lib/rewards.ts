import { Reward } from './supabase';

export function sortedActive(rewards: Reward[]): Reward[] {
  return rewards.filter((r) => r.active).sort((a, b) => a.cost - b.cost);
}

export function cheapestActiveCost(rewards: Reward[], fallback = 9): number {
  const active = sortedActive(rewards);
  return active.length > 0 ? active[0].cost : fallback;
}
