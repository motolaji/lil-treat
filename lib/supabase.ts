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
  lat: number | null;
  lng: number | null;
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
  updated_at: string;
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

export async function updateHandle(userId: string, handle: string): Promise<boolean> {
  const { error } = await supabase.from('users').update({ handle }).eq('id', userId);
  return !error;
}

export async function upgradeAccount(
  email: string,
  password: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.updateUser({ email, password });
  return { error: error?.message ?? null };
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
  amount?: number,
): Promise<number | null> {
  const newCount = currentStamps + 1;

  const { error: updateError } = await supabase
    .from('loyalty_cards')
    .update({ stamps_current: newCount, updated_at: new Date().toISOString() })
    .eq('id', cardId);

  if (updateError) return null;

  const { error: txError } = await supabase
    .from('transactions')
    .insert({ loyalty_card_id: cardId, type: 'earn', amount: amount ?? null });

  if (txError) return null;
  return newCount;
}

export interface RedeemResult {
  rewardLabel: string;
  userHandle: string | null;
}

export async function redeemReward(
  cardId: string,
  merchantId: string,
): Promise<RedeemResult | null> {
  const { data: card, error } = await supabase
    .from('loyalty_cards')
    .select('*, merchants(*), users(handle)')
    .eq('id', cardId)
    .eq('merchant_id', merchantId)
    .single();

  if (error || !card) return null;

  const target = card.merchants?.stamp_target ?? 9;
  if (card.stamps_current < target) return null;

  const { error: updateError } = await supabase
    .from('loyalty_cards')
    .update({ stamps_current: 0, updated_at: new Date().toISOString() })
    .eq('id', cardId);

  if (updateError) return null;

  const { error: txError } = await supabase
    .from('transactions')
    .insert({ loyalty_card_id: cardId, type: 'redeem' });

  if (txError) return null;

  return {
    rewardLabel: card.merchants?.reward_label ?? 'Reward',
    userHandle: card.users?.handle ?? null,
  };
}

export async function expireCard(cardId: string): Promise<void> {
  await supabase
    .from('loyalty_cards')
    .update({ stamps_current: 0, updated_at: new Date().toISOString() })
    .eq('id', cardId);

  await supabase
    .from('transactions')
    .insert({ loyalty_card_id: cardId, type: 'expire' });
}

// ── Merchant helpers ───────────────────────────────────────────────────────

export async function getMerchants(): Promise<Merchant[]> {
  const { data, error } = await supabase.from('merchants').select('*').order('name');
  if (error) return [];
  return (data ?? []) as Merchant[];
}

export async function getMerchantBySlug(slug: string): Promise<Merchant | null> {
  const { data, error } = await supabase
    .from('merchants')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) return null;
  return data as Merchant;
}

// Scoped to only the merchants a given login owns, via merchant_users.
// Unlike getMerchants() (unfiltered, used for consumer-side nearby discovery),
// this is what MerchantContext uses so one login can't see every business.
export async function getMerchantsForUser(userId: string): Promise<Merchant[]> {
  const { data, error } = await supabase
    .from('merchant_users')
    .select('merchants(*)')
    .eq('user_id', userId);

  if (error) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => row.merchants).filter(Boolean) as Merchant[];
}

function slugify(name: string): string {
  const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const suffix = Math.floor(Math.random() * 900) + 100;
  return `${base}-${suffix}`;
}

export interface CreateMerchantResult {
  merchant: Merchant | null;
  error: string | null;
}

export async function createMerchantAccount(
  name: string,
  userId: string,
): Promise<CreateMerchantResult> {
  const { data: merchant, error } = await supabase
    .from('merchants')
    .insert({ name, slug: slugify(name), stamp_target: 9, reward_label: 'Free coffee' })
    .select()
    .single();

  if (error?.code === '23505') {
    // Slug collision — retry once with a new random suffix.
    const { data: retryMerchant, error: retryError } = await supabase
      .from('merchants')
      .insert({ name, slug: slugify(name), stamp_target: 9, reward_label: 'Free coffee' })
      .select()
      .single();
    if (retryError || !retryMerchant) {
      return { merchant: null, error: retryError?.message ?? 'Could not create business (slug retry failed).' };
    }
    return linkMerchantUser(retryMerchant, userId);
  }

  if (error || !merchant) {
    return { merchant: null, error: error?.message ?? 'Could not create business.' };
  }
  return linkMerchantUser(merchant, userId);
}

async function linkMerchantUser(merchant: Merchant, userId: string): Promise<CreateMerchantResult> {
  const { error: linkError } = await supabase
    .from('merchant_users')
    .insert({ merchant_id: merchant.id, user_id: userId });

  if (linkError) return { merchant: null, error: linkError.message };
  return { merchant, error: null };
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

// ── Shopping list helpers ──────────────────────────────────────────────────

export interface ShoppingListRow {
  id: string;
  user_id: string;
  source_label: string;
  items: ShoppingItem[];
  created_at: string;
  updated_at: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  qty: number;
  category: string;
  checked: boolean;
}

export async function saveShoppingList(
  userId: string,
  sourceLabel: string,
  items: ShoppingItem[],
): Promise<ShoppingListRow | null> {
  const { data, error } = await supabase
    .from('shopping_lists')
    .insert({ user_id: userId, source_label: sourceLabel, items })
    .select()
    .single();
  if (error) return null;
  return data as ShoppingListRow;
}

export async function getShoppingLists(userId: string): Promise<ShoppingListRow[]> {
  const { data, error } = await supabase
    .from('shopping_lists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data ?? []) as ShoppingListRow[];
}

export async function updateListItem(
  listId: string,
  itemId: string,
  checked: boolean,
): Promise<void> {
  const { data: list } = await supabase
    .from('shopping_lists')
    .select('items')
    .eq('id', listId)
    .single();
  if (!list) return;
  const updated = (list.items as ShoppingItem[]).map((item) =>
    item.id === itemId ? { ...item, checked } : item,
  );
  await supabase
    .from('shopping_lists')
    .update({ items: updated, updated_at: new Date().toISOString() })
    .eq('id', listId);
}

export async function addItemToList(
  listId: string,
  item: ShoppingItem,
): Promise<void> {
  const { data: list } = await supabase
    .from('shopping_lists')
    .select('items')
    .eq('id', listId)
    .single();
  if (!list) return;
  const updated = [...(list.items as ShoppingItem[]), item];
  await supabase
    .from('shopping_lists')
    .update({ items: updated, updated_at: new Date().toISOString() })
    .eq('id', listId);
}

export interface TransactionRow {
  id: string;
  loyalty_card_id: string;
  type: string;
  amount: number | null;
  created_at: string;
  loyalty_cards?: { merchants?: Merchant };
}

export async function getUserTransactions(
  userId: string,
  merchantId?: string,
): Promise<TransactionRow[]> {
  let query = supabase
    .from('transactions')
    .select('id, loyalty_card_id, type, amount, created_at, loyalty_cards!inner(user_id, merchant_id, merchants(*))')
    .eq('loyalty_cards.user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (merchantId) query = query.eq('loyalty_cards.merchant_id', merchantId);

  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as unknown as TransactionRow[];
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
