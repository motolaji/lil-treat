# Stackpot — Project Brief v2

> Centralised loyalty tracking PWA for small merchants and their customers.
> Build target: working demo in 3 hours.
> v2 adds: receipt OCR → AI shopping list (S3) with stubbed response for demo.

---

## What we're building

A Progressive Web App (PWA) with two interfaces in one Next.js app:

- `/` — Consumer app (anonymous, zero sign-up, scan to earn stamps, scan receipts)
- `/merchant` — Merchant app (email login, display QR, scan consumer QR to stamp)

Both use the camera via `getUserMedia()` (Web Camera API). No native app. No App Store. Deployed to Vercel.

---

## The problem

Small merchants have no affordable loyalty solution. Big platforms require POS hardware or enterprise contracts. Paper stamp cards get lost. Stocard destroyed user trust by being acquired by Klarna and wiping stored cards.

**Our edge:** offline-first, zero sign-up for consumers, works in a browser on any phone, merchant live in under 10 minutes. Receipt scanning gives consumers a reason to open the app *before* they shop — not just at the till.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database + Auth | Supabase (PostgreSQL + anonymous auth + RLS) |
| QR scanning | `@zxing/browser` |
| QR generation | `qrcode.react` |
| Receipt capture | Web Camera API (`getUserMedia`) |
| OCR — demo | Stubbed JSON response (real: Mindee API) |
| AI list gen — demo | Stubbed response (real: Anthropic Claude API) |
| Deployment | Vercel |

### Install

```bash
npx create-next-app@latest loyalr --typescript --tailwind --app --no-src-dir
cd loyalr
npm install @supabase/supabase-js @zxing/browser qrcode.react
```

> No Mindee or Anthropic SDK installed for demo — both are stubbed. Add them in week 1.

### Environment variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Week 1 — add when real APIs are ready
# MINDEE_API_KEY=your_mindee_key
# ANTHROPIC_API_KEY=your_anthropic_key
```

---

## Database

**5 tables.** Run this SQL in the Supabase SQL editor.

```sql
-- Core tables
create table merchants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  stamp_target int default 9,
  reward_label text default 'Free coffee'
);

create table users (
  id uuid primary key references auth.users,
  handle text unique not null
);

create table loyalty_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  merchant_id uuid references merchants(id),
  stamps_current int default 0,
  unique(user_id, merchant_id)
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  loyalty_card_id uuid references loyalty_cards(id),
  type text default 'earn',
  created_at timestamptz default now()
);

-- NEW in v2: shopping lists
create table shopping_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  source_label text,              -- e.g. "Tesco · 14 Apr" or "Manual"
  items jsonb not null default '[]',
  -- items shape: [{ id, name, qty, category, checked }]
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Row Level Security
alter table merchants enable row level security;
alter table users enable row level security;
alter table loyalty_cards enable row level security;
alter table transactions enable row level security;
alter table shopping_lists enable row level security;

create policy "public read merchants" on merchants
  for select using (true);

create policy "users manage own" on users
  for all using (auth.uid() = id);

create policy "users manage own cards" on loyalty_cards
  for all using (auth.uid() = user_id);

create policy "users manage own transactions" on transactions
  for all using (
    loyalty_card_id in (
      select id from loyalty_cards where user_id = auth.uid()
    )
  );

create policy "users manage own lists" on shopping_lists
  for all using (auth.uid() = user_id);

-- Seed one merchant for demo
insert into merchants (name, slug, stamp_target, reward_label)
values ('Verde Coffee', 'verde-coffee', 9, 'Free coffee of any size');

-- NEW: standalone merchant inventory simulator (CSV-driven, not linked to receipt OCR)
create table inventory_items (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid references merchants(id) not null,
  sku text not null,
  name text not null,
  stock_qty int not null default 0,
  price numeric(10,2) not null default 0,
  updated_at timestamptz default now(),
  unique(merchant_id, sku)
);

create table inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid references inventory_items(id),
  merchant_id uuid references merchants(id) not null,
  type text default 'sale',   -- 'sale' | 'restock' | 'adjustment'
  qty_change int not null default -1,
  created_at timestamptz default now()
);

alter table inventory_items enable row level security;
alter table inventory_transactions enable row level security;

create policy "public read inventory_items" on inventory_items for select using (true);
create policy "merchant manage inventory_items" on inventory_items for all using (true) with check (true);
create policy "merchant manage inventory_transactions" on inventory_transactions for all using (true) with check (true);
```

> Note: inventory RLS is intentionally permissive (`using (true)`), matching the existing posture of `merchants`/`loyalty_cards` — there's no `merchant_users` ownership table anywhere in this schema yet, so merchant identity is enforced only at the app-routing layer (email login + `MerchantContext`), not via row-level `auth.uid()` scoping. See the "deliberately skips" table below.

```sql
-- NEW: "Treats" rebrand support — redemption, expiry, transaction history, nearby discovery
alter table loyalty_cards add column updated_at timestamptz default now();
alter table transactions add column amount numeric(10,2);
alter table merchants add column lat double precision;
alter table merchants add column lng double precision;
```

> Note: `updated_at default now()` back-fills every existing `loyalty_cards` row with the migration timestamp, since no prior "last activity" timestamp ever existed on this table — a one-time data quality caveat for the 90-day expiry countdown, not an ongoing bug. `lat`/`lng` on `merchants` are populated manually per merchant via this same SQL editor (no onboarding UI exists to set them).

```sql
-- NEW: merchant ownership model — fixes "any merchant login sees every merchant"
create table merchant_users (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid references merchants(id) not null,
  user_id uuid references auth.users(id) not null,
  unique(merchant_id, user_id)
);

alter table merchant_users enable row level security;

create policy "users view own merchant links" on merchant_users
  for select using ((select auth.uid()) = user_id);

create policy "users create own merchant links" on merchant_users
  for insert with check ((select auth.uid()) = user_id);

-- merchants previously had no write policy at all; needed for self-serve signup.
-- Anonymous consumer sessions are ALSO assigned the `authenticated` role, so this
-- must check the is_anonymous JWT claim explicitly, not just auth.uid() is not null.
create policy "authenticated non-anonymous users create merchants"
on merchants
for insert
to authenticated
with check ((select auth.jwt() ->> 'is_anonymous')::boolean is false);
```

**Required one-time manual step — run before deploying the `MerchantContext.tsx` change**, otherwise the existing merchant login gets locked out (nothing currently links it to a `merchant_users` row):
```sql
do $$
declare
  v_merchant_id uuid;
  v_user_id uuid;
begin
  select id into v_merchant_id from merchants where slug = 'verde-coffee';
  select id into v_user_id from auth.users where email = 'YOUR_EXISTING_MERCHANT_LOGIN_EMAIL';

  if v_merchant_id is null then raise exception 'No merchant found with slug=verde-coffee'; end if;
  if v_user_id is null then raise exception 'No auth user found with that email'; end if;

  insert into merchant_users (merchant_id, user_id)
  values (v_merchant_id, v_user_id)
  on conflict (merchant_id, user_id) do nothing;

  raise notice 'Linked merchant % to user %', v_merchant_id, v_user_id;
end $$;
```
Verify with `select * from merchant_users;` before moving on.

**Also disable email confirmation** (Dashboard → Authentication → Providers → Email → toggle off "Confirm email") so merchant signup and the consumer account-upgrade flow both complete synchronously, without a "check your inbox" step.

```sql
-- NEW: in-app promo inbox (merchant broadcasts a short message to their own customers)
create table promotions (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid references merchants(id) not null,
  title text not null,
  body text not null,
  created_at timestamptz default now()
);

alter table promotions enable row level security;

create policy "public read promotions" on promotions
  for select using (true);

create policy "merchant owners create promotions" on promotions
for insert
to authenticated
with check (merchant_id in (select merchant_id from merchant_users where user_id = (select auth.uid())));

-- NEW: missing-points recovery (text-only claim, no photo evidence in this pass)
create table point_claims (
  id uuid primary key default gen_random_uuid(),
  loyalty_card_id uuid references loyalty_cards(id) not null,
  user_id uuid references users(id) not null,
  merchant_id uuid references merchants(id) not null,
  note text not null,
  visit_date date,
  status text not null default 'pending',
  created_at timestamptz default now()
);

alter table point_claims enable row level security;

create policy "users create own claims" on point_claims
  for insert with check ((select auth.uid()) = user_id);
create policy "users view own claims" on point_claims
  for select using ((select auth.uid()) = user_id);
create policy "merchant owners view claims" on point_claims
  for select using (merchant_id in (select merchant_id from merchant_users where user_id = (select auth.uid())));
create policy "merchant owners update claims" on point_claims
  for update using (merchant_id in (select merchant_id from merchant_users where user_id = (select auth.uid())));

-- Tighten inventory RLS now that merchant_users is populated for the seeded merchant
drop policy "merchant manage inventory_items" on inventory_items;
create policy "merchant manage inventory_items" on inventory_items
  for all using (merchant_id in (select merchant_id from merchant_users where user_id = (select auth.uid())))
  with check (merchant_id in (select merchant_id from merchant_users where user_id = (select auth.uid())));

drop policy "merchant manage inventory_transactions" on inventory_transactions;
create policy "merchant manage inventory_transactions" on inventory_transactions
  for all using (merchant_id in (select merchant_id from merchant_users where user_id = (select auth.uid())))
  with check (merchant_id in (select merchant_id from merchant_users where user_id = (select auth.uid())));
```

> Note: QR signing (HMAC) is intentionally still skipped — real signing needs a secret that can never live in client JS, which means a Supabase Edge Function (this app's first server-side code). Instead, `lib/qrExpiry.ts` adds a lightweight 5-minute expiry to the consumer's own QR and the redemption QR (not the merchant's counter QR, which is meant to stay displayed all day) — this stops stale/replayed screenshots, not forgery. See the "deliberately skips" table.

**Also enable Anonymous Auth in Supabase:**
Dashboard → Authentication → Providers → Anonymous → Enable

---

## Project structure

```
loyalr/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                      # Consumer app — 4 tabs
│   ├── merchant/
│   │   └── page.tsx                  # Merchant app — 3 tabs
│   └── components/
│       ├── QRScanner.tsx             # Shared camera + zxing QR scanner
│       ├── ReceiptScanner.tsx        # Camera capture for receipts (still image)
│       ├── StampCard.tsx             # Stamp grid UI
│       ├── QRDisplay.tsx             # QR code display
│       └── ShoppingList.tsx          # Shopping list UI with check-off
├── lib/
│   ├── supabase.ts                   # Supabase client + DB helpers
│   └── receipt.ts                    # OCR stub + AI list generation stub
├── public/
│   ├── manifest.json
│   └── icons/
├── .env.local
└── next.config.js
```

---

## Consumer app — 4 tabs

The consumer app lives entirely at `/`. Tab state is local — no routing between tabs.

### Tab 1 — Wallet

- List of native loyalty cards (stamp grids per merchant)
- List of saved barcode cards (scanned physical cards)
- Empty state: "Tap Scan to earn your first stamp"
- No account required — anonymous session created silently on mount

### Tab 2 — Scan

Two sub-modes, toggled by a segmented control at the top:

**Sub-mode A: Earn stamps**
- Camera opens via getUserMedia()
- Scans merchant QR or consumer's own loyalty card barcode
- On merchant QR: earn stamp flow
- On loyalty card barcode: save to localStorage

**Sub-mode B: Scan receipt** ← NEW in v2
- Camera opens for still image capture (not continuous decode)
- User frames receipt → taps capture button → image taken
- Processing screen shown while OCR stub runs (~1.5s simulated delay)
- Shopping list generated and saved to Supabase
- User taken to List tab to see result

### Tab 3 — My QR

- Displays consumer's QR code (encodes user_id + handle)
- For merchant to scan when issuing a stamp
- Full screen, high contrast, maximum size

### Tab 4 — List ← NEW in v2

- Shows all shopping lists for this user
- Most recent list expanded by default
- Each list shows: source label, date, item count
- Tap a list to expand: shows items grouped by category with checkboxes
- Check off items while shopping
- "New list" button → opens receipt scanner
- Manual add item button on each list

---

## Merchant app — 3 tabs

Lives at `/merchant`. Email login required.

### Tab 1 — My QR

- Large QR encoding `{ type: "merchant", merchant_id: "uuid" }`
- Fills the screen — sits on the counter
- Merchant name shown above QR

### Tab 2 — Scan customer

- Camera opens via getUserMedia()
- Scans consumer's QR
- On success: increment stamp, show loud confirmation

### Tab 3 — Today

- Stamps issued today (count)
- Recent activity feed (last 10 stamps with handle + time)

---

## QR payload format

```json
// Merchant QR — merchant displays, consumer scans to earn
{ "type": "merchant", "merchant_id": "uuid" }

// Consumer QR — consumer displays, merchant scans to issue
{ "type": "consumer", "user_id": "uuid", "user_handle": "teal-fox-429" }
```

> No signing in demo. Add HMAC in week 1.

---

## Core flows

### Flow 1 — Consumer earns a stamp (consumer scans merchant QR)

```
Consumer opens /
→ signInAnonymously() on mount (check session first)
→ taps Scan tab → sub-mode: Earn stamps
→ camera opens
→ scans merchant QR
→ zxing decodes → JSON.parse → extract merchant_id
→ getOrCreateCard(userId, merchantId)
→ issueStamp(cardId, currentStamps)
→ stamp animation → success card → auto-dismiss to wallet
```

### Flow 2 — Merchant issues stamp (merchant scans consumer QR)

```
Merchant at /merchant → logged in
→ taps Scan tab
→ camera opens
→ scans consumer QR
→ extract user_id
→ getOrCreateCard(userId, merchantId)
→ issueStamp(cardId, currentStamps)
→ loud confirmation on merchant screen
```

### Flow 3 — Consumer scans existing loyalty card

```
Consumer taps Scan tab → sub-mode: Earn stamps
→ points camera at physical Tesco/Boots card
→ zxing reads barcode
→ prompt: "What store is this card for?"
→ save { name, barcode } to localStorage key: loyalr_saved_cards
→ return to wallet — card appears in Saved Cards section
```

### Flow 4 — Receipt scan → AI shopping list ← NEW in v2

```
Consumer taps Scan tab → sub-mode: Scan receipt
→ OR taps "New list" from List tab
→ ReceiptScanner opens (still image capture mode)
→ User frames receipt → taps capture button
→ Image captured as base64
→ processReceipt(imageBase64) called from lib/receipt.ts
   [DEMO: 1.5s simulated delay → returns stubbed line items]
   [WEEK 1: POST to /api/receipt → Mindee extract → Claude cluster]
→ generateShoppingList(lineItems) called
   [DEMO: returns pre-grouped stubbed list]
   [WEEK 1: Claude API call with line items → structured JSON]
→ Save shopping list to Supabase shopping_lists table
→ Navigate to List tab → new list expanded and visible
```

---

## lib/receipt.ts — stub implementation

This file contains the OCR and AI logic. For the demo it returns hardcoded data. The function signatures are identical to what the real implementation will use — swap the body in week 1.

```typescript
// lib/receipt.ts

export interface LineItem {
  name: string
  price: number
}

export interface ShoppingItem {
  id: string
  name: string
  qty: number
  category: string
  checked: boolean
}

export interface ProcessedReceipt {
  merchant: string
  date: string
  total: number
  lineItems: LineItem[]
}

// STUB — simulates Mindee OCR response
// Week 1: replace body with POST to /api/receipt which calls Mindee
export async function processReceipt(imageBase64: string): Promise<ProcessedReceipt> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500))

  // Stubbed response — matches Mindee output shape
  return {
    merchant: 'Verde Coffee',
    date: new Date().toLocaleDateString('en-GB'),
    total: 24.60,
    lineItems: [
      { name: 'Oat milk flat white', price: 4.50 },
      { name: 'Oat milk flat white', price: 4.50 },
      { name: 'Sourdough toast', price: 6.50 },
      { name: 'Sparkling water 500ml', price: 2.80 },
      { name: 'Banana bread slice', price: 3.20 },
      { name: 'Filter coffee', price: 3.10 },
    ]
  }
}

// STUB — simulates Claude AI clustering and list generation
// Week 1: replace body with call to Anthropic API
// System prompt: "Given these receipt line items, group them into categories
// (Drinks, Food, Grocery etc), merge duplicates with quantity,
// and return JSON array of ShoppingItem. Return JSON only, no preamble."
export async function generateShoppingList(receipt: ProcessedReceipt): Promise<ShoppingItem[]> {
  await new Promise(resolve => setTimeout(resolve, 800))

  // Stubbed Claude output — pre-grouped, duplicates merged
  return [
    { id: '1', name: 'Oat milk flat white', qty: 2, category: 'Drinks', checked: false },
    { id: '2', name: 'Filter coffee',        qty: 1, category: 'Drinks', checked: false },
    { id: '3', name: 'Sparkling water',      qty: 1, category: 'Drinks', checked: false },
    { id: '4', name: 'Sourdough toast',      qty: 1, category: 'Food',   checked: false },
    { id: '5', name: 'Banana bread slice',   qty: 1, category: 'Food',   checked: false },
  ]
}
```

---

## lib/supabase.ts — helper functions

```typescript
// Supabase client initialisation
// getOrCreateUser()        — anon sign-in + upsert users row + return user
// getOrCreateCard(uid, mid) — upsert loyalty_cards row
// issueStamp(cardId, n)    — increment stamps_current + insert transaction
// getMerchantBySlug(slug)  — fetch merchant row
// getTodayStamps(mid)      — count today's transactions for merchant

// NEW in v2:
// saveShoppingList(userId, sourceLabel, items) — insert into shopping_lists
// getShoppingLists(userId)                     — fetch all lists for user, order by created_at desc
// updateListItem(listId, itemId, checked)      — update single item's checked state in jsonb
// addItemToList(listId, item)                  — append item to list's items jsonb array
```

### updateListItem implementation note

Supabase does not have a jsonb array element update operator. Use this pattern:

```typescript
// Fetch the list, update the item in JS, write back the whole array
const { data: list } = await supabase
  .from('shopping_lists')
  .select('items')
  .eq('id', listId)
  .single()

const updated = (list.items as ShoppingItem[]).map(item =>
  item.id === itemId ? { ...item, checked } : item
)

await supabase
  .from('shopping_lists')
  .update({ items: updated, updated_at: new Date().toISOString() })
  .eq('id', listId)
```

---

## Component: ReceiptScanner

```typescript
// app/components/ReceiptScanner.tsx
// Props:
//   onCapture: (imageBase64: string) => void
//   onCancel: () => void

// Behaviour:
// - Opens camera in photo mode (not continuous decode)
// - Shows live viewfinder via getUserMedia({ video: { facingMode: 'environment' } })
// - Renders a "Capture" button (large, centered at bottom)
// - On capture: draws video frame to canvas → canvas.toDataURL('image/jpeg', 0.8)
// - Passes base64 string to onCapture
// - Stops all camera tracks after capture or cancel
// - Shows framing guide overlay (receipt corner guides)

// Does NOT do any OCR — that happens in the parent after capture
```

---

## Component: ShoppingList

```typescript
// app/components/ShoppingList.tsx
// Props:
//   list: { id, source_label, created_at, items: ShoppingItem[] }
//   onToggleItem: (listId: string, itemId: string, checked: boolean) => void
//   onAddItem: (listId: string, name: string) => void

// Renders:
// - Source label + date header
// - Items grouped by category
// - Each item: checkbox + name + qty
// - Checked items: strikethrough, moved to bottom of their category group
// - "Add item" row at bottom of each category (text input, inline)
// - Progress: "3 of 5 items remaining"
```

---

## Receipt scan UX flow (detailed)

```
1. User taps "Scan receipt" in scan tab sub-mode selector
   OR taps "New list" button in List tab

2. ReceiptScanner opens:
   - Live camera viewfinder
   - Corner guide overlay showing receipt framing area
   - "Capture" button at bottom
   - "Cancel" button top left

3. User frames receipt → taps Capture
   - Camera freezes (video paused)
   - Processing overlay appears: spinner + "Reading receipt..."
   - processReceipt(base64) called — 1.5s stub delay

4. After OCR:
   - Processing overlay updates: "Building your list..."
   - generateShoppingList(receipt) called — 0.8s stub delay

5. After list generation:
   - saveShoppingList(userId, label, items) writes to Supabase
   - Camera closed
   - User navigated to List tab
   - New list expanded and visible at top
   - Brief success toast: "List saved from [merchant] receipt"

6. User can:
   - Check off items while shopping
   - Add items manually
   - View previous lists below
```

---

## Shopping list data shape

```typescript
// Stored in shopping_lists.items (jsonb column)
interface ShoppingItem {
  id: string           // uuid or nanoid — generated client-side
  name: string         // "Oat milk flat white"
  qty: number          // 2
  category: string     // "Drinks" | "Food" | "Grocery" | "Other"
  checked: boolean     // false initially
}

// Source label format: "[Merchant name] · [date]"
// e.g. "Verde Coffee · 18 Apr 2026"
// For manual lists: "Manual list · 18 Apr 2026"
```

---

## Stamp animation sequence

1. White flash overlay 150ms
2. New stamp scales 2× → 1× ease-out 300ms
3. Success card slides up — merchant name + new count + progress
4. Auto-dismiss after 2500ms → return to wallet
5. Reward state (stamps >= target): no auto-dismiss, full-screen reward, manual dismiss

---

## Design tokens

```css
--bg:          #0a0a0f;
--surface:     #14141c;
--border:      rgba(255,255,255,0.08);
--text:        #f0ede8;
--text-muted:  rgba(255,255,255,0.4);
--accent:      #6ee7b7;   /* teal — stamps, success, brand */
--accent-warm: #f59e0b;   /* amber — rewards */
--accent-list: #818cf8;   /* indigo — shopping list tab accent */
--danger:      #f87171;
--font:        'DM Sans', system-ui;
--font-mono:   'DM Mono', monospace;
--radius-lg:   20px;
--radius-md:   12px;
```

Load via Google Fonts in layout:
```
https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap
```

---

## PWA setup

### `public/manifest.json`

```json
{
  "name": "Loyalr",
  "short_name": "Loyalr",
  "description": "Loyalty stamps and smart shopping lists for local shops",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0f",
  "theme_color": "#6ee7b7",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### `app/layout.tsx` head tags

```tsx
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#6ee7b7" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

---

## Camera permission handling

```
NotAllowedError  → "Camera access needed" screen + "Open settings" button
NotFoundError    → "No camera found on this device"
http:// origin   → Will fail silently on iOS Safari — must be HTTPS
                   Vercel handles this automatically
```

Both QRScanner and ReceiptScanner must handle all three cases identically.

---

## What the demo proves

By the end of the 3-hour build, on two real phones:

1. Merchant opens `/merchant` → logs in → QR on screen
2. Consumer opens `/` → no sign-up → taps Scan → scans merchant QR → stamp appears
3. After 9 stamps → reward banner
4. Consumer switches to Scan receipt sub-mode → frames a paper receipt → taps capture
5. 2.3 seconds later → shopping list appears in List tab, grouped by category
6. Consumer checks off items while "shopping"
7. Consumer scans a physical Tesco card → appears in wallet

That is a complete, demonstrable loyalty + smart list loop.

---

## Deployment

```bash
npm i -g vercel
vercel
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Consumer: `https://loyalr.vercel.app`
Merchant: `https://loyalr.vercel.app/merchant`

HTTPS is required for `getUserMedia()` on real devices. Vercel provides this automatically.

---

## What this demo deliberately skips

| Skipped | Fix — week 1 |
|---|---|
| QR signing / HMAC (partial — see note above) | Edge Function: verify signed token before issuing stamp; `lib/qrExpiry.ts` covers replay/staleness only, not forgery |
| Real Mindee OCR | POST `/api/receipt` → Mindee → return line items |
| Real Claude list gen | Call Anthropic API server-side (API key stays secret) |
| Offline queue | IndexedDB + sync-on-connect |
| ~~Merchant sign-up UI~~ | Built — `/merchant/signup` + `merchant_users` ownership table |
| ~~Redemption flow~~ | Built — redeem QR + merchant scan confirmation |
| ~~Push notifications~~ | Built as an in-app promo inbox instead — no OS-level push, no service worker |
| ~~Multiple merchants~~ | Built — `/merchant/locations/add` lets one login own multiple businesses |
| ~~S4 missing points recovery~~ | Built — text-only claim + merchant approval in `/merchant/today` |
| ~~Inventory RLS ownership scoping~~ | Built — tightened now that `merchant_users` is backfilled |

---

## Treats redesign — multi-tier rewards, per-item earn rates, itemized receipts

Rebrands stamps/rewards as "small treats"/"big treats" and moves from one flat `stamp_target`/`reward_label` per merchant to a real rewards catalog, plus wires inventory items to actual treats-earned amounts and a new itemized Receipts feature. Run these five blocks **in order** in the Supabase SQL editor.

**1. Rewards catalog (multi-tier, replaces the single stamp_target/reward_label going forward — those columns stay in place, unused):**
```sql
create table rewards (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid references merchants(id) not null,
  label text not null,
  description text,
  cost int not null check (cost > 0),
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table rewards enable row level security;

create policy "public read rewards" on rewards for select using (true);

create policy "merchant owners create rewards" on rewards
  for insert to authenticated
  with check (merchant_id in (select merchant_id from merchant_users where user_id = (select auth.uid())));

create policy "merchant owners update rewards" on rewards
  for update using (merchant_id in (select merchant_id from merchant_users where user_id = (select auth.uid())))
  with check (merchant_id in (select merchant_id from merchant_users where user_id = (select auth.uid())));
```

**2. Seed one starter reward per existing merchant (idempotent, safe to re-run):**
```sql
insert into rewards (merchant_id, label, cost, active)
select id, reward_label, greatest(stamp_target, 1), true
from merchants
where not exists (select 1 from rewards r where r.merchant_id = merchants.id);
```

**3. Inventory items get a treats-earned value:**
```sql
alter table inventory_items add column treats_value int not null default 0;
```

**4. Itemized receipts (one table, `line_items` as a jsonb array — mirrors the existing `shopping_lists.items` pattern):**
```sql
create table receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  merchant_id uuid references merchants(id) not null,
  loyalty_card_id uuid references loyalty_cards(id),
  line_items jsonb not null default '[]',
  total_amount numeric(10,2) not null default 0,
  total_treats_earned int not null default 0,
  created_at timestamptz default now()
);

alter table receipts enable row level security;

create policy "users view own receipts" on receipts
  for select using ((select auth.uid()) = user_id);
create policy "merchant owners view receipts" on receipts
  for select using (merchant_id in (select merchant_id from merchant_users where user_id = (select auth.uid())));
create policy "merchant owners create receipts" on receipts
  for insert to authenticated
  with check (merchant_id in (select merchant_id from merchant_users where user_id = (select auth.uid())));
```
`line_items` shape: `[{ inventory_item_id, name, qty, unit_price, treats_value, line_treats }]` — snapshotted at sale time so later edits to an inventory item's name/price/treats-value don't retroactively change old receipts. Only a merchant's own session ever inserts (item selection happens at scan-confirm time; consumer self-scan never itemizes).

**5. Tier-aware redemption history:**
```sql
alter table transactions add column reward_id uuid references rewards(id);
```

Verify after running all five:
```sql
select * from rewards order by merchant_id, cost;
select column_name from information_schema.columns where table_name = 'inventory_items';
```

> Note: this round replaces `redeemReward(cardId, merchantId)` with `redeemReward(cardId, merchantId, rewardId)` — redemption now **decrements** `stamps_current` by the specific tier's cost instead of resetting to 0, since a customer's balance is shared across all of a merchant's tiers. `issueStamp` also changes shape (`issueStamp(cardId, currentStamps, merchantId, userId, options?)`) to support per-item treats awards tied to inventory instead of a flat +1 — see `TODO-inventory-deduction.md`, which this directly resolves.

---

## Vendor app — merchants gain category/address/logo

Added so a new standalone `vendor_app/` (Vite + React, sharing this same Supabase project) can capture a complete vendor profile at signup — needed for the consumer-side Treat Jar's category filter and distance/location display.

```sql
alter table merchants add column category text;
alter table merchants add column address text;
alter table merchants add column logo_url text;
```

- `category` is plain `text` (no DB enum), enforced only via an app-side dropdown: `drinks` / `food` / `retail` / `other`.
- `address` is the human-readable string (vendor-typed or resolved via Google Places/Geocoding); `lat`/`lng` (already existing columns) hold the resolved coordinates.
- `logo_url` is a plain URL text field for now — no Supabase Storage upload flow yet.
- No RLS change needed yet — these are set once at signup via the existing insert policy. A future "edit merchant settings" screen will need a new `update` policy (`merchants` currently has none):
```sql
-- Only needed once an edit-after-signup screen is built:
create policy "merchant owners update own merchants" on merchants
for update to authenticated
using (id in (select merchant_id from merchant_users where user_id = (select auth.uid())))
with check (id in (select merchant_id from merchant_users where user_id = (select auth.uid())));
```

Verify: `select id, name, category, address, logo_url from merchants limit 5;`

---

## Vendor app — real logo upload (Supabase Storage) + reward ordering

First-ever Supabase Storage usage in this project. Public bucket for merchant logos, scoped per-user by folder (the merchant row doesn't exist yet at signup time when the file is picked, so uploads are scoped to `auth.uid()`, not `merchant_id`).

```sql
insert into storage.buckets (id, name, public) values ('merchant-logos', 'merchant-logos', true);

create policy "public read merchant logos" on storage.objects
  for select using (bucket_id = 'merchant-logos');

create policy "authenticated users upload own merchant logos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'merchant-logos'
    and (select auth.jwt() ->> 'is_anonymous')::boolean is false
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

Also adding explicit vendor-controlled reward ordering — the consumer app has no cost-based sort and just displays rewards in array order, so sorting our rewards list by `cost` (as before) would silently reshuffle a vendor's intended order whenever a cost changes.

```sql
alter table rewards add column sort_order int not null default 0;

with ranked as (
  select id, row_number() over (partition by merchant_id order by cost) - 1 as rn
  from rewards
)
update rewards set sort_order = ranked.rn
from ranked where rewards.id = ranked.id;
```

No RLS change needed for `sort_order` — the existing `rewards` update policy already covers any column on that table.

Verify:
```sql
select id from storage.buckets where id = 'merchant-logos';
select id, merchant_id, sort_order from rewards order by merchant_id, sort_order;
```

---

## Vendor app — settings screen (business hours, soft-remove locations, edit-after-signup RLS)

Adds a Settings screen: editing an existing merchant's profile (name/category/address/logo/fallback stamp target), business hours, and removing a location from the multi-location picker without destroying its history.

```sql
-- The "edit merchant settings" screen this policy was reserved for (see the
-- category/address/logo section above) now exists — apply it if you haven't
-- already. Safe to skip if it errors with "already exists".
create policy "merchant owners update own merchants" on merchants
for update to authenticated
using (id in (select merchant_id from merchant_users where user_id = (select auth.uid())))
with check (id in (select merchant_id from merchant_users where user_id = (select auth.uid())));
```

```sql
-- "Remove location" is a soft-deactivate, not a hard delete — a real DELETE would
-- either cascade-destroy that location's loyalty cards/transactions/rewards history,
-- or fail outright on the foreign keys, depending on how those were originally
-- defined. Deactivated merchants are simply excluded from the picker/discovery
-- queries; nothing about their historical data changes, and re-activating is just
-- flipping this flag back (no UI for that yet — do it directly in the SQL editor
-- if a vendor asks to undo a removal).
alter table merchants add column active boolean not null default true;

alter table merchants add column business_hours jsonb;
```

No new RLS policy needed for `active`/`business_hours` — both are plain columns on `merchants`, already covered by the update policy above.

**Update `getMerchants()`/`getMerchantsForUser()` to filter `active = true`** once this is applied, otherwise deactivated locations stay visible.

Verify:
```sql
select id, name, active, business_hours from merchants limit 5;
```

---

## Vendor app — POS page (vendor builds a cart, customer scans to earn) + fractional points

Adds a second itemized-earn path alongside the existing "vendor scans customer" flow in `ScanScreen`: a vendor now builds a cart on a new POS page, generates a QR encoding that cart, and the *customer* scans it (via the existing `/scan` screen in `customer_app`) to earn itemized points and a receipt. The QR payload is self-contained (same pattern as the redeem QR) — nothing is written to the database until the customer actually scans it.

Also switches every points-like column from whole numbers to decimals, since per-item point values are now expected to be fractional (e.g. a £2.00 item worth 0.5 points):

```sql
alter table inventory_items alter column treats_value type numeric(8,2);
alter table loyalty_cards alter column stamps_current type numeric(8,2);
alter table rewards alter column cost type numeric(8,2);
alter table receipts alter column total_treats_earned type numeric(8,2);
alter table merchants alter column stamp_target type numeric(8,2);
```

Plain `int`→`numeric` widening — no `USING` clause needed, no data loss, no RLS change (these are existing columns on already-covered tables). TypeScript already types all of these as plain `number`, so no interface changes are needed on the app side — only the column types above and display-formatting call sites (see `formatTreats` in `lib/supabase.ts` in both `vendor_app` and `customer_app`, wraps a number as `"9"` when whole or `"3.5"` when fractional).

Verify:
```sql
select column_name, data_type, numeric_precision, numeric_scale
from information_schema.columns
where table_name in ('inventory_items', 'loyalty_cards', 'rewards', 'receipts', 'merchants')
  and column_name in ('treats_value', 'stamps_current', 'cost', 'total_treats_earned', 'stamp_target');
```

---

## Vendor app — POS item photos

Lets the POS "+ New item" quick-create attach a photo, shown in POS's product-tile grid. Same pattern as the merchant-logo upload (see "real logo upload" section above), but scoped by `merchant_id` folder instead of `auth.uid()` — the merchant already exists whenever POS is in use (unlike at signup, when the merchant row doesn't exist yet), so ownership can be checked directly via `merchant_users` rather than the folder-per-user workaround.

```sql
alter table inventory_items add column image_url text;

insert into storage.buckets (id, name, public) values ('inventory-item-images', 'inventory-item-images', true);

create policy "public read inventory item images" on storage.objects
  for select using (bucket_id = 'inventory-item-images');

create policy "merchant owners upload own inventory item images" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'inventory-item-images'
    and (storage.foldername(name))[1] in (select merchant_id::text from merchant_users where user_id = (select auth.uid()))
  );
```

CSV-uploaded items have no way to carry a photo (CSV can't attach binary files) — they simply show a placeholder until recreated through POS's quick-create, or a future "edit item" screen adds one after the fact. Not building item-photo editing beyond creation-time in this pass.

Verify:
```sql
select id from storage.buckets where id = 'inventory-item-images';
select id, name, image_url from inventory_items limit 5;
```

---

## Root app — landing page at the main URL

The repo root's Next.js app (`app/`) predates vendor_app/customer_app and was the original full prototype (wallet + merchant dashboard in one app). It's superseded by those two, but the root Vercel project is still what serves the bare domain, so its homepage (`app/page.tsx`) is now a static marketing/chooser landing page instead of the old wallet UI — mascot, headline, and two CTAs ("I'm a customer" / "I'm a merchant") linking out to the deployed apps. The rest of `app/`'s old routes (`/cards`, `/history`, `/merchant`, etc.) are untouched and still there, just no longer linked from the homepage.

The two CTA links read from env vars, since the actual production URLs for vendor_app/customer_app depend on how you set up their Vercel projects/domains:

```
NEXT_PUBLIC_CUSTOMER_APP_URL=https://<your-customer-app-domain>
NEXT_PUBLIC_VENDOR_APP_URL=https://<your-vendor-app-domain>
```

Add both in the root Vercel project's Environment Variables settings once the other two projects have URLs — until then the buttons link to `#`.

Also fixed while touching this: root `tsconfig.json` had `"include": ["**/*.ts", "**/*.tsx", ...]` with only `node_modules` excluded, so `next build`'s typecheck was scanning `vendor_app/`/`customer_app/` too — separate Vite projects whose image-import types collide with Next's `StaticImageData` augmentation. Now excludes both directories.

---

## Week 1 — real receipt API implementation

When ready to replace the stubs, create an API route (not a client call — API keys must stay server-side):

```typescript
// app/api/receipt/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { imageBase64 } = await req.json()

  // Step 1: Mindee OCR
  const mindeeRes = await fetch('https://api.mindee.net/v1/products/mindee/expense_receipts/v5/predict', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${process.env.MINDEE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ document: imageBase64 })
  })
  const mindeeData = await mindeeRes.json()
  const lineItems = mindeeData.document.inference.prediction.line_items

  // Step 2: Claude API — cluster into shopping list
  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: 'You are a shopping list generator. Given receipt line items, group them by category (Drinks, Food, Grocery, Other), merge duplicates with quantity counts, and return a JSON array only. No preamble. Shape: [{id, name, qty, category, checked: false}]',
      messages: [{ role: 'user', content: JSON.stringify(lineItems) }]
    })
  })
  const claudeData = await claudeRes.json()
  const items = JSON.parse(claudeData.content[0].text)

  return NextResponse.json({ items })
}
```

Then in `lib/receipt.ts`, replace `processReceipt` and `generateShoppingList` with a single function:

```typescript
export async function processReceiptReal(imageBase64: string): Promise<ShoppingItem[]> {
  const res = await fetch('/api/receipt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64 })
  })
  const { items } = await res.json()
  return items
}
```

---

## Coding instructions for the LLM

When implementing this project, follow these rules strictly:

1. **Build in this exact order:**
   `lib/supabase.ts` → `lib/receipt.ts` → `QRScanner.tsx` → `ReceiptScanner.tsx` → `StampCard.tsx` → `QRDisplay.tsx` → `ShoppingList.tsx` → `app/layout.tsx` → `app/page.tsx` → `app/merchant/page.tsx` → `public/manifest.json`

2. **All Supabase calls are client-side** — no API routes for Supabase. `'use client'` on all pages.

3. **No API routes for receipt processing in the demo** — `lib/receipt.ts` stubs return hardcoded data directly. Do not create `app/api/receipt/route.ts` until week 1.

4. **Camera tracks must stop on cleanup** — call `track.stop()` on all MediaStream tracks whenever leaving a camera screen or unmounting. Both QRScanner and ReceiptScanner must do this.

5. **ReceiptScanner captures a still image** — it does not continuously decode. Draw the video frame to a hidden `<canvas>` on capture button tap, then call `canvas.toDataURL('image/jpeg', 0.8)`.

6. **Check session before creating anon user** — `supabase.auth.getSession()` first, only `signInAnonymously()` if no session.

7. **QR results in try/catch** — `JSON.parse` can throw. Invalid QRs show a friendly error, never crash.

8. **updateListItem reads then writes** — Supabase has no jsonb array element updater. Fetch the list, update in JS, write the whole array back.

9. **Shopping list items get client-side IDs** — use `crypto.randomUUID()` to generate item IDs before saving to Supabase.

10. **No routing between tabs** — local state only. `tab` variable controls which view is shown.

11. **Merchant page uses email auth** — `supabase.auth.signInWithPassword()`. No anonymous auth at `/merchant`.

12. **savedCards in localStorage** — key `loyalr_saved_cards`, value `JSON.stringify(SavedCard[])`. No DB table.

13. **Dark theme only** — `#0a0a0f` background, `#6ee7b7` teal, `#818cf8` indigo for list tab.

14. **No external UI libraries** — inline styles or Tailwind only.

15. **Deploy to Vercel early** — `getUserMedia()` requires HTTPS on real devices. Test on a real phone, not browser devtools.

16. **Stub delays are intentional** — the 1.5s + 0.8s delays in `lib/receipt.ts` make the processing feel real. Do not remove them.