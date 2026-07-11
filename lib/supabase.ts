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

export interface Reward {
  id: string;
  merchant_id: string;
  label: string;
  description: string | null;
  cost: number;
  active: boolean;
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
  let query = supabase.from('rewards').select('*').eq('merchant_id', merchantId).order('cost');
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
): Promise<Reward | null> {
  const { data, error } = await supabase
    .from('rewards')
    .insert({ merchant_id: merchantId, label, cost, description: description ?? null })
    .select()
    .single();

  if (error) return null;
  return data as Reward;
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

export async function getRewardsForMerchants(merchantIds: string[]): Promise<Record<string, Reward[]>> {
  if (merchantIds.length === 0) return {};

  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .in('merchant_id', merchantIds)
    .eq('active', true)
    .order('cost');

  if (error) return {};

  const grouped: Record<string, Reward[]> = {};
  for (const r of (data ?? []) as Reward[]) {
    (grouped[r.merchant_id] ??= []).push(r);
  }
  return grouped;
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
  stampTarget: number = 9,
  rewardLabel: string = 'Free coffee',
): Promise<CreateMerchantResult> {
  const { data: merchant, error } = await supabase
    .from('merchants')
    .insert({ name, slug: slugify(name), stamp_target: stampTarget, reward_label: rewardLabel })
    .select()
    .single();

  if (error?.code === '23505') {
    // Slug collision — retry once with a new random suffix.
    const { data: retryMerchant, error: retryError } = await supabase
      .from('merchants')
      .insert({ name, slug: slugify(name), stamp_target: stampTarget, reward_label: rewardLabel })
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

  // Best-effort starter reward tier — merchant creation still succeeds if this fails.
  await createReward(merchant.id, merchant.reward_label, Math.max(merchant.stamp_target, 1));

  return { merchant, error: null };
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
