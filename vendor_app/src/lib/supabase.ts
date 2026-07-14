import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Types ──────────────────────────────────────────────────────────────────

export const DAYS_OF_WEEK = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export interface DayHours {
  closed: boolean;
  open: string;
  close: string;
}

export type BusinessHours = Record<DayOfWeek, DayHours>;

export interface Merchant {
  id: string;
  name: string;
  slug: string;
  stamp_target: number;
  reward_label: string;
  lat: number | null;
  lng: number | null;
  category: string | null;
  address: string | null;
  logo_url: string | null;
  active: boolean;
  business_hours: BusinessHours | null;
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

export interface Reward {
  id: string;
  merchant_id: string;
  label: string;
  description: string | null;
  cost: number;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
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

export interface EarnLineItem {
  inventory_item_id: string;
  name: string;
  qty: number;
  unit_price: number;
  treats_value: number;
}

export interface IssueStampOptions {
  lineItems?: EarnLineItem[];
  flatAmount?: number;
}

export interface IssueStampResult {
  newCount: number;
  receiptId: string | null;
}

export async function issueStamp(
  cardId: string,
  currentStamps: number,
  merchantId: string,
  userId: string,
  options: IssueStampOptions = {},
): Promise<IssueStampResult | null> {
  const lineItems = options.lineItems ?? [];
  const hasItems = lineItems.length > 0;

  const treatsAwarded = hasItems
    ? lineItems.reduce((sum, li) => sum + li.qty * li.treats_value, 0)
    : 1;
  const newCount = currentStamps + treatsAwarded;

  const { error: updateError } = await supabase
    .from('loyalty_cards')
    .update({ stamps_current: newCount, updated_at: new Date().toISOString() })
    .eq('id', cardId);

  if (updateError) return null;

  const totalAmount = hasItems
    ? lineItems.reduce((sum, li) => sum + li.qty * li.unit_price, 0)
    : (options.flatAmount ?? null);

  const { error: txError } = await supabase
    .from('transactions')
    .insert({ loyalty_card_id: cardId, type: 'earn', amount: totalAmount });

  if (txError) return null;

  let receiptId: string | null = null;

  if (hasItems) {
    const receiptLineItems = lineItems.map((li) => ({
      inventory_item_id: li.inventory_item_id,
      name: li.name,
      qty: li.qty,
      unit_price: li.unit_price,
      treats_value: li.treats_value,
      line_treats: li.qty * li.treats_value,
    }));

    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .insert({
        user_id: userId,
        merchant_id: merchantId,
        loyalty_card_id: cardId,
        line_items: receiptLineItems,
        total_amount: totalAmount ?? 0,
        total_treats_earned: treatsAwarded,
      })
      .select('id')
      .single();

    if (!receiptError && receipt) receiptId = receipt.id;
  }

  return { newCount, receiptId };
}

export interface RedeemResult {
  rewardLabel: string;
  userHandle: string | null;
}

export async function redeemReward(
  cardId: string,
  merchantId: string,
  rewardId: string,
): Promise<RedeemResult | null> {
  const { data: reward, error: rewardError } = await supabase
    .from('rewards')
    .select('*')
    .eq('id', rewardId)
    .eq('merchant_id', merchantId)
    .single();

  if (rewardError || !reward || !reward.active) return null;

  const { data: card, error } = await supabase
    .from('loyalty_cards')
    .select('*, users(handle)')
    .eq('id', cardId)
    .eq('merchant_id', merchantId)
    .single();

  if (error || !card) return null;
  if (card.stamps_current < reward.cost) return null;

  const newCount = card.stamps_current - reward.cost;

  const { error: updateError } = await supabase
    .from('loyalty_cards')
    .update({ stamps_current: newCount, updated_at: new Date().toISOString() })
    .eq('id', cardId);

  if (updateError) return null;

  const { error: txError } = await supabase
    .from('transactions')
    .insert({ loyalty_card_id: cardId, type: 'redeem', reward_id: rewardId });

  if (txError) return null;

  return {
    rewardLabel: reward.label,
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

// ── Rewards catalog ────────────────────────────────────────────────────────

export async function getMerchantRewards(merchantId: string, activeOnly = false): Promise<Reward[]> {
  let query = supabase.from('rewards').select('*').eq('merchant_id', merchantId).order('sort_order');
  if (activeOnly) query = query.eq('active', true);

  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as Reward[];
}

export async function createReward(
  merchantId: string,
  label: string,
  cost: number,
  description?: string,
): Promise<{ reward: Reward | null; error: string | null }> {
  const { data: existing, error: existingError } = await supabase
    .from('rewards')
    .select('sort_order')
    .eq('merchant_id', merchantId)
    .order('sort_order', { ascending: false })
    .limit(1);

  if (existingError) return { reward: null, error: existingError.message };

  const nextSortOrder = ((existing?.[0]?.sort_order as number | undefined) ?? -1) + 1;

  const { data, error } = await supabase
    .from('rewards')
    .insert({ merchant_id: merchantId, label, cost, description: description ?? null, sort_order: nextSortOrder })
    .select()
    .single();

  if (error) return { reward: null, error: error.message };
  return { reward: data as Reward, error: null };
}

export async function updateReward(
  rewardId: string,
  patch: Partial<Pick<Reward, 'label' | 'description' | 'cost' | 'active'>>,
): Promise<boolean> {
  const { error } = await supabase
    .from('rewards')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', rewardId);

  return !error;
}

export async function moveReward(
  merchantId: string,
  rewardId: string,
  direction: 'up' | 'down',
): Promise<boolean> {
  const ordered = await getMerchantRewards(merchantId);
  const index = ordered.findIndex((r) => r.id === rewardId);
  if (index === -1) return false;

  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= ordered.length) return false;

  const current = ordered[index];
  const swap = ordered[swapIndex];

  const [{ error: err1 }, { error: err2 }] = await Promise.all([
    supabase.from('rewards').update({ sort_order: swap.sort_order }).eq('id', current.id),
    supabase.from('rewards').update({ sort_order: current.sort_order }).eq('id', swap.id),
  ]);

  return !err1 && !err2;
}

export async function getRewardsForMerchants(merchantIds: string[]): Promise<Record<string, Reward[]>> {
  if (merchantIds.length === 0) return {};

  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .in('merchant_id', merchantIds)
    .eq('active', true)
    .order('sort_order');

  if (error) return {};

  const grouped: Record<string, Reward[]> = {};
  for (const r of (data ?? []) as Reward[]) {
    (grouped[r.merchant_id] ??= []).push(r);
  }
  return grouped;
}

// ── Merchant helpers ───────────────────────────────────────────────────────

export async function getMerchants(): Promise<Merchant[]> {
  const { data, error } = await supabase.from('merchants').select('*').eq('active', true).order('name');
  if (error) {
    // Undefined column — the `active` migration hasn't been run yet on this
    // project. Fall back to showing everything rather than silently
    // returning an empty list (which would look like "no merchants exist").
    if (error.code === '42703') {
      console.warn('merchants.active column missing — run the Settings-screen migration in BRIEF2.md. Falling back to unfiltered merchants list.');
      const fallback = await supabase.from('merchants').select('*').order('name');
      return (fallback.data ?? []) as Merchant[];
    }
    return [];
  }
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
    .select('merchants!inner(*)')
    .eq('user_id', userId)
    .eq('merchants.active', true);

  if (error) {
    // Undefined column — the `active` migration hasn't been run yet on this
    // project. Fall back to showing everything rather than silently
    // returning an empty list (which would look like the user has no
    // locations at all, breaking the entire merchant context).
    if (error.code === '42703') {
      console.warn('merchants.active column missing — run the Settings-screen migration in BRIEF2.md. Falling back to unfiltered merchants list.');
      const fallback = await supabase
        .from('merchant_users')
        .select('merchants(*)')
        .eq('user_id', userId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (fallback.data ?? []).map((row: any) => row.merchants).filter(Boolean) as Merchant[];
    }
    return [];
  }
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

export interface MerchantProfileDetails {
  category?: string;
  address?: string;
  lat?: number;
  lng?: number;
  logo_url?: string;
}

export async function createMerchantAccount(
  name: string,
  userId: string,
  stampTarget: number = 9,
  rewardLabel: string = 'Free coffee',
  details: MerchantProfileDetails = {},
): Promise<CreateMerchantResult> {
  const payload = {
    name,
    slug: slugify(name),
    stamp_target: stampTarget,
    reward_label: rewardLabel,
    category: details.category ?? null,
    address: details.address ?? null,
    lat: details.lat ?? null,
    lng: details.lng ?? null,
    logo_url: details.logo_url ?? null,
  };

  const { data: merchant, error } = await supabase
    .from('merchants')
    .insert(payload)
    .select()
    .single();

  if (error?.code === '23505') {
    // Slug collision — retry once with a new random suffix.
    const { data: retryMerchant, error: retryError } = await supabase
      .from('merchants')
      .insert({ ...payload, slug: slugify(name) })
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

  // No auto-seeded starter reward here — vendor_app sends new merchants straight
  // to /rewards to set up their first Big Treat themselves, so a placeholder
  // "Free coffee" row would just be confusing clutter.

  return { merchant, error: null };
}

export interface UpdateMerchantDetails {
  name?: string;
  category?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  logo_url?: string | null;
  stamp_target?: number;
  active?: boolean;
  business_hours?: BusinessHours | null;
}

export async function updateMerchant(
  merchantId: string,
  updates: UpdateMerchantDetails,
): Promise<{ merchant: Merchant | null; error: string | null }> {
  const { data, error } = await supabase
    .from('merchants')
    .update(updates)
    .eq('id', merchantId)
    .select()
    .single();

  if (error || !data) {
    return { merchant: null, error: error?.message ?? 'Could not update business details.' };
  }
  return { merchant: data as Merchant, error: null };
}

// ── Promo inbox ────────────────────────────────────────────────────────────

export interface PromotionRow {
  id: string;
  merchant_id: string;
  title: string;
  body: string;
  created_at: string;
  merchants?: { name: string };
}

export async function createPromotion(
  merchantId: string,
  title: string,
  body: string,
): Promise<boolean> {
  const { error } = await supabase
    .from('promotions')
    .insert({ merchant_id: merchantId, title, body });
  return !error;
}

export async function getMerchantPromotions(merchantId: string): Promise<PromotionRow[]> {
  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .eq('merchant_id', merchantId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data ?? []) as PromotionRow[];
}

export async function getPromotionsForUser(userId: string): Promise<PromotionRow[]> {
  const { data: cards } = await supabase
    .from('loyalty_cards')
    .select('merchant_id')
    .eq('user_id', userId);

  const merchantIds = [...new Set((cards ?? []).map((c) => c.merchant_id))];
  if (merchantIds.length === 0) return [];

  const { data, error } = await supabase
    .from('promotions')
    .select('*, merchants(name)')
    .in('merchant_id', merchantIds)
    .order('created_at', { ascending: false });

  if (error) return [];
  return (data ?? []) as unknown as PromotionRow[];
}

// ── Missing-points claims ────────────────────────────────────────────────────

export interface PointClaim {
  id: string;
  loyalty_card_id: string;
  user_id: string;
  merchant_id: string;
  note: string;
  visit_date: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  merchants?: { name: string };
  users?: { handle: string };
}

export async function createPointClaim(
  cardId: string,
  userId: string,
  merchantId: string,
  note: string,
  visitDate?: string,
): Promise<boolean> {
  const { error } = await supabase
    .from('point_claims')
    .insert({
      loyalty_card_id: cardId,
      user_id: userId,
      merchant_id: merchantId,
      note,
      visit_date: visitDate ?? null,
    });
  return !error;
}

export async function getUserClaims(userId: string): Promise<PointClaim[]> {
  const { data, error } = await supabase
    .from('point_claims')
    .select('*, merchants(name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data ?? []) as unknown as PointClaim[];
}

export async function getMerchantClaims(merchantId: string): Promise<PointClaim[]> {
  const { data, error } = await supabase
    .from('point_claims')
    .select('*, users(handle)')
    .eq('merchant_id', merchantId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data ?? []) as unknown as PointClaim[];
}

export async function resolveClaim(
  claimId: string,
  approve: boolean,
  cardId?: string,
  merchantId?: string,
  userId?: string,
): Promise<boolean> {
  if (approve && cardId && merchantId && userId) {
    const { data: card } = await supabase
      .from('loyalty_cards')
      .select('stamps_current')
      .eq('id', cardId)
      .single();
    if (!card) return false;

    const result = await issueStamp(cardId, card.stamps_current, merchantId, userId);
    if (result === null) return false;
  }

  const { error } = await supabase
    .from('point_claims')
    .update({ status: approve ? 'approved' : 'rejected' })
    .eq('id', claimId);

  return !error;
}

export interface ActivityTransaction {
  id: string;
  type: 'earn' | 'redeem' | 'expire';
  created_at: string;
  reward_id: string | null;
  rewards?: { label: string };
  loyalty_cards?: { users?: { handle: string } };
}

export async function getMerchantActivity(merchantId: string, days = 30): Promise<ActivityTransaction[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('transactions')
    .select('id, type, created_at, reward_id, rewards(label), loyalty_cards!inner(merchant_id, users(handle))')
    .eq('loyalty_cards.merchant_id', merchantId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
    .limit(300);

  if (error) return [];
  return (data ?? []) as unknown as ActivityTransaction[];
}

// ── Shopping list helpers ──────────────────────────────────────────────────
// (Consumer-only concern, unused by vendor_app today — kept so this file stays
// a verbatim, diffable copy of the root lib/supabase.ts rather than a fork.)

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

export interface ReceiptLineItem {
  inventory_item_id: string | null;
  name: string;
  qty: number;
  unit_price: number;
  treats_value: number;
  line_treats: number;
}

export interface Receipt {
  id: string;
  user_id: string;
  merchant_id: string;
  loyalty_card_id: string | null;
  line_items: ReceiptLineItem[];
  total_amount: number;
  total_treats_earned: number;
  created_at: string;
  merchants?: { name: string };
}

export async function getUserReceipts(userId: string, merchantId?: string): Promise<Receipt[]> {
  let query = supabase
    .from('receipts')
    .select('*, merchants(name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (merchantId) query = query.eq('merchant_id', merchantId);

  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as unknown as Receipt[];
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

