import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Types ──────────────────────────────────────────────────────────────────

export interface Merchant {
  id: string;
  name: string;
  slug: string;
  stamp_target: number;
  reward_label: string;
}

export interface UserRow {
  id: string;
  handle: string;
}

export interface LoyaltyCard {
  id: string;
  user_id: string;
  merchant_id: string;
  stamps_current: number;
  merchants?: Merchant;
}

// ── Handle generation ──────────────────────────────────────────────────────

const ADJECTIVES = [
  'teal', 'amber', 'crisp', 'swift', 'bold', 'calm', 'dark', 'sage',
  'cool', 'warm', 'bright', 'quiet', 'keen', 'kind', 'lean', 'neat',
];
const NOUNS = [
  'fox', 'owl', 'hawk', 'bear', 'wolf', 'deer', 'lynx', 'crow',
  'hare', 'wren', 'kite', 'dove', 'finch', 'lark', 'rook', 'swan',
];

function generateHandle(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 900) + 100;
  return `${adj}-${noun}-${num}`;
}

// ── Auth helpers ───────────────────────────────────────────────────────────

export async function getOrCreateUser(): Promise<UserRow | null> {
  // Check for an existing session first
  const { data: { session } } = await supabase.auth.getSession();

  let userId: string;

  if (session?.user) {
    userId = session.user.id;
  } else {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data.user) return null;
    userId = data.user.id;
  }

  // Check if user row already exists
  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (existing) return existing as UserRow;

  // Create user row with a generated handle
  const handle = generateHandle();
  const { data: newUser, error: upsertError } = await supabase
    .from('users')
    .upsert({ id: userId, handle })
    .select()
    .single();

  if (upsertError) return null;
  return newUser as UserRow;
}

// ── Loyalty card helpers ───────────────────────────────────────────────────

export async function getOrCreateCard(
  userId: string,
  merchantId: string,
): Promise<LoyaltyCard | null> {
  const { data: existing } = await supabase
    .from('loyalty_cards')
    .select('*, merchants(*)')
    .eq('user_id', userId)
    .eq('merchant_id', merchantId)
    .single();

  if (existing) return existing as LoyaltyCard;

  const { data: created, error } = await supabase
    .from('loyalty_cards')
    .insert({ user_id: userId, merchant_id: merchantId, stamps_current: 0 })
    .select('*, merchants(*)')
    .single();

  if (error) return null;
  return created as LoyaltyCard;
}

export async function getUserCards(userId: string): Promise<LoyaltyCard[]> {
  const { data, error } = await supabase
    .from('loyalty_cards')
    .select('*, merchants(*)')
    .eq('user_id', userId);

  if (error) return [];
  return (data ?? []) as LoyaltyCard[];
}

export async function issueStamp(
  cardId: string,
  currentStamps: number,
): Promise<number | null> {
  const newCount = currentStamps + 1;

  const { error: updateError } = await supabase
    .from('loyalty_cards')
    .update({ stamps_current: newCount })
    .eq('id', cardId);

  if (updateError) return null;

  const { error: txError } = await supabase
    .from('transactions')
    .insert({ loyalty_card_id: cardId, type: 'earn' });

  if (txError) return null;
  return newCount;
}

// ── Merchant helpers ───────────────────────────────────────────────────────

export async function getMerchantBySlug(slug: string): Promise<Merchant | null> {
  const { data, error } = await supabase
    .from('merchants')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) return null;
  return data as Merchant;
}

export async function getTodayStamps(merchantId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('transactions')
    .select('id, loyalty_cards!inner(merchant_id)', { count: 'exact', head: true })
    .eq('loyalty_cards.merchant_id', merchantId)
    .gte('created_at', today.toISOString());

  if (error) return 0;
  return count ?? 0;
}

export async function getTodayTransactions(merchantId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('transactions')
    .select('id, created_at, loyalty_cards!inner(merchant_id, users(handle))')
    .eq('loyalty_cards.merchant_id', merchantId)
    .gte('created_at', today.toISOString())
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return [];
  return data ?? [];
}
