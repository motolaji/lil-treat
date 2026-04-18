# Stackpot — Project Brief

> Centralised loyalty tracking PWA for small merchants and their customers.
> Build target: working demo in 3 hours.

---

## What we're building

A Progressive Web App (PWA) that lets small independent merchants run a digital stamp card loyalty programme — and lets consumers collect stamps across multiple merchants in one place.

There are **two interfaces in one Next.js app**:

- `/` — Consumer app (anonymous, zero sign-up, scan to earn stamps)
- `/merchant` — Merchant app (email login, display QR, scan consumer QR to stamp)

Both use the camera via `getUserMedia()` (Web Camera API). No native app. No App Store. Deployed to Vercel.

---

## The problem

Small merchants (cafés, bakeries, salons) have no affordable loyalty solution. Big platforms require POS hardware or enterprise contracts. Paper stamp cards get lost. Existing apps like Stocard are passive card holders with no real points engine — and Stocard just destroyed user trust by being acquired by Klarna and wiping stored cards.

**Our edge:** offline-first, zero sign-up for consumers, works in a browser on any phone, merchant live in under 10 minutes.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database + Auth | Supabase (PostgreSQL + anonymous auth) |
| QR scanning | `@zxing/browser` |
| QR generation | `qrcode.react` |
| Deployment | Vercel |

### Install

```bash
npx create-next-app@latest stackpot --typescript --tailwind --app --no-src-dir
cd stackpot
npm install @supabase/supabase-js @zxing/browser qrcode.react
```

### Environment variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Database

**4 tables only.** Run this SQL in the Supabase SQL editor.

```sql
-- Tables
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

-- Row Level Security
alter table merchants enable row level security;
alter table users enable row level security;
alter table loyalty_cards enable row level security;
alter table transactions enable row level security;

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

-- Seed one merchant for demo
insert into merchants (name, slug, stamp_target, reward_label)
values ('Verde Coffee', 'verde-coffee', 9, 'Free coffee of any size');
```

**Also enable Anonymous Auth in Supabase:**
Dashboard → Authentication → Providers → Anonymous → Enable

---

## Project structure

```
stackpot/
├── app/
│   ├── layout.tsx              # Root layout, PWA meta tags
│   ├── page.tsx                # Consumer app (/)
│   ├── merchant/
│   │   └── page.tsx            # Merchant app (/merchant)
│   └── components/
│       ├── QRScanner.tsx       # Shared camera + zxing scanner
│       ├── StampCard.tsx       # Stamp grid UI component
│       └── QRDisplay.tsx       # QR code display component
├── lib/
│   └── supabase.ts             # Supabase client + helper functions
├── public/
│   ├── manifest.json           # PWA manifest
│   └── icons/                  # PWA icons (192, 512)
├── .env.local
└── next.config.js
```

---

## QR payload format

The QR codes encode JSON strings. Two types, two directions:

**Merchant QR** (merchant displays → consumer scans to earn):
```json
{
  "type": "merchant",
  "merchant_id": "uuid-of-merchant"
}
```

**Consumer QR** (consumer displays → merchant scans to issue stamp):
```json
{
  "type": "consumer",
  "user_handle": "teal-fox-429",
  "user_id": "uuid-of-user"
}
```

> No signing or JWT in the demo. Add HMAC signing in week 1 post-demo.

---

## Core flows

### Flow 1 — Consumer earns a stamp (consumer scans)

```
Consumer opens /
→ signInAnonymously() → unique handle generated
→ taps "Scan" tab
→ camera opens via getUserMedia()
→ points at merchant's QR on their screen
→ zxing decodes JSON → extracts merchant_id
→ upsert loyalty_cards row (user_id + merchant_id)
→ increment stamps_current
→ insert transaction row
→ show stamp animation + updated count
```

### Flow 2 — Merchant issues a stamp (merchant scans)

```
Merchant opens /merchant
→ email login via Supabase signInWithPassword()
→ taps "Scan customer"
→ camera opens
→ points at consumer's QR on their phone
→ zxing decodes JSON → extracts user_id
→ looks up or creates loyalty_cards row
→ increments stamps_current on behalf of user
→ shows confirmation
```

### Flow 3 — Consumer adds existing loyalty card (barcode)

```
Consumer taps "Add card" in wallet
→ camera opens in barcode mode
→ scans physical Tesco/Boots/Nectar card
→ prompts for store name
→ saves { name, barcode } to localStorage
→ displays in wallet with show-barcode button
```

---

## Pages to build

### `/` — Consumer app

**State:**
- `user` — Supabase anon user + handle
- `cards` — array of loyalty_cards with merchant join
- `savedCards` — localStorage array of scanned barcodes
- `tab` — `'wallet' | 'scan' | 'myqr'`
- `stampState` — `'idle' | 'scanning' | 'success' | 'reward'`

**Screens within the page (tab-switched, no routing):**

1. **Wallet tab** — list of stamp cards (stamp grid per merchant) + saved barcode cards
2. **Scan tab** — camera viewfinder, scans merchant QR or loyalty card barcode
3. **My QR tab** — displays consumer's QR code for merchant to scan

**Key UX rules:**
- First open: no splash, no onboarding, no form. Just the wallet (empty state with "tap scan to start")
- Anonymous session created silently on mount
- Stamp success: full-screen animation before returning to wallet
- Reward state (stamps_current >= stamp_target): banner + different animation

### `/merchant` — Merchant app

**State:**
- `session` — Supabase email session
- `merchant` — merchant row from DB
- `tab` — `'qr' | 'scan' | 'today'`
- `todayCount` — stamps issued today

**Screens:**

1. **Login screen** — shown if no session. Email + password. No sign-up (merchants created manually in DB for demo)
2. **My QR tab** — large QR display encoding merchant JSON. This sits on the counter.
3. **Scan tab** — camera to scan consumer QR. On success: increment stamp, show confirmation.
4. **Today tab** — count of stamps issued today, list of recent activity

**Key UX rules:**
- Large tap targets (used at counter, often with wet/greasy hands)
- QR as large as possible — fills the screen
- Confirmation is loud and obvious — merchant needs to see it at a glance

---

## Shared component: QRScanner

```typescript
// app/components/QRScanner.tsx
// Props:
// - onResult: (text: string) => void
// - onError?: (error: Error) => void
// - active: boolean  ← start/stop scanning

// Behaviour:
// - Calls getUserMedia({ video: { facingMode: 'environment' } })
// - Uses BrowserMultiFormatReader from @zxing/browser
// - Polls decodeFromVideoElement() via requestAnimationFrame
// - Stops all tracks when active becomes false or component unmounts
// - HTTPS required — will throw on http:// (localhost OK for desktop)
```

---

## Shared component: StampCard

```typescript
// app/components/StampCard.tsx
// Props:
// - merchantName: string
// - stampsEarned: number
// - stampTarget: number
// - rewardLabel: string

// Renders:
// - Merchant name + progress label ("6 of 9 · 3 to go")
// - Grid of stamp circles: filled (earned) vs empty (remaining)
// - Reward badge when stampsEarned >= stampTarget
// - CSS animation on the most-recently-earned stamp
```

---

## lib/supabase.ts — helper functions to implement

```typescript
// Initialize Supabase client with env vars

getOrCreateUser()
// → check existing session
// → if none: signInAnonymously()
// → generate handle (adjective-noun-number, e.g. "teal-fox-429")
// → upsert into users table
// → return user row

getOrCreateCard(userId: string, merchantId: string)
// → select from loyalty_cards where user_id + merchant_id
// → if not found: insert with stamps_current = 0
// → return card row

issueStamp(cardId: string, currentStamps: number)
// → update loyalty_cards set stamps_current = currentStamps + 1
// → insert into transactions
// → return new stamp count

getMerchantBySlug(slug: string)
// → select from merchants where slug = slug
// → return merchant row

getTodayStamps(merchantId: string)
// → select count from transactions
//   joined to loyalty_cards where merchant_id = merchantId
//   and created_at >= today midnight
// → return count
```

---

## PWA setup

### `public/manifest.json`

```json
{
  "name": "Stackpot",
  "short_name": "Stackpot",
  "description": "Loyalty stamps for local shops",
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

### `app/layout.tsx` — add to `<head>`

```tsx
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#6ee7b7" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

---

## Design tokens

```css
/* Palette */
--bg:          #0a0a0f;   /* near-black background */
--surface:     #14141c;   /* card / panel surface */
--border:      rgba(255,255,255,0.08);
--text:        #f0ede8;   /* primary text */
--text-muted:  rgba(255,255,255,0.4);
--accent:      #6ee7b7;   /* teal — stamps, success, brand */
--accent-warm: #f59e0b;   /* amber — rewards */
--danger:      #f87171;   /* errors */

/* Typography */
--font-display: 'DM Sans', system-ui;
--font-mono:    'DM Mono', monospace;   /* handles, codes */

/* Radii */
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 20px;
--radius-full: 9999px;
```

Load fonts via Google Fonts in layout:
```
https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap
```

---

## Stamp animation spec

When a stamp is earned, play this sequence:

1. **Flash** — white overlay fades in and out (150ms)
2. **Stamp drop** — the new stamp circle scales from 2× → 1× with ease-out (300ms)
3. **Success card** — slides up from bottom with merchant name, new count, progress to reward
4. **Auto-dismiss** — after 2.5 seconds, return to wallet tab

If `stampsEarned >= stampTarget` (reward unlocked):
- Skip auto-dismiss
- Show full-screen reward state with reward label
- "Show to merchant" button displays a redemption note
- Manual dismiss only

---

## Camera permission handling

```
getUserMedia() throws NotAllowedError
→ Show permission denied screen
→ "Camera access is needed to scan stamps"
→ Button: "Open settings" (links to browser settings instructions)
→ Do not retry automatically

getUserMedia() throws NotFoundError  
→ "No camera found on this device"

getUserMedia() on http:// (non-localhost)
→ Will silently fail on iOS Safari
→ Must be served over HTTPS
→ Vercel handles this automatically
```

---

## What the demo proves

By the end of the 3-hour build:

1. Merchant opens `/merchant` on a tablet → logs in → QR is on screen
2. Consumer opens `/` on their phone → no sign-up → taps Scan → points at merchant's screen
3. Stamp appears on consumer's wallet with animation
4. After 9 stamps: reward banner fires
5. Consumer scans a physical Tesco card → it appears in their wallet

That is a complete, demonstrable loyalty loop on two real devices.

---

## What this demo deliberately skips (build week 1)

| Skipped | Why | Fix |
|---|---|---|
| QR signing / JWT | Demo trust is fine | Add HMAC with merchant secret |
| Offline queue | Needs internet | IndexedDB + sync-on-connect |
| Merchant sign-up UI | Seed manually in Supabase | Build onboarding flow |
| Redemption flow | Stamp collection is the demo | Fixed QR → options → confirm |
| Push notifications | No service worker yet | Add next-pwa |
| Multiple merchants | One seeded merchant | Merchant slug routing |

---

## Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set env vars in Vercel dashboard or:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Consumer URL: `https://stackpot.vercel.app`
Merchant URL: `https://stackpot.vercel.app/merchant`

> HTTPS is required for `getUserMedia()` on real devices. Vercel provides this automatically.

---

## Coding instructions for the LLM

When implementing this project, follow these rules:

1. **Build in this order:** `lib/supabase.ts` → `QRScanner.tsx` → `StampCard.tsx` → `page.tsx` (consumer) → `merchant/page.tsx`
2. **All Supabase calls are client-side** — no API routes needed for the demo. Use `'use client'` on all pages and components.
3. **Camera must stop** when the scan tab is left. Always call `track.stop()` on all MediaStream tracks in cleanup. Memory leak otherwise.
4. **Handle camera permission denial gracefully** — show a clear message, never crash.
5. **`getUserMedia` requires HTTPS** on real devices — localhost is fine for development, Vercel handles production.
6. **Anonymous auth:** call `supabase.auth.signInAnonymously()` on first mount of consumer page. Check for existing session first with `supabase.auth.getSession()` — do not create a new anonymous user on every reload.
7. **Stamp grid:** use CSS Grid with `repeat(auto-fill, ...)` — do not hardcode 9 columns. `stamp_target` is configurable per merchant.
8. **No page routing between tabs** — use local state (`tab` variable) to switch between views. Keeps the app snappy and avoids camera teardown on navigation.
9. **QR payload is JSON** — always `JSON.parse()` scan results inside try/catch. Invalid QRs should show a user-friendly error, not crash.
10. **Merchant page is email-only** — use `supabase.auth.signInWithPassword()`. No anonymous auth on `/merchant`. If no session, show login form.
11. **savedCards (barcode scan) lives in localStorage only** — no DB table needed. Key: `stackpot_saved_cards`, value: `JSON.stringify(SavedCard[])`.
12. **Dark theme only** — background `#0a0a0f`, accent `#6ee7b7`. Keep it consistent.
13. **No external UI libraries** — inline styles or Tailwind only. Keeps bundle small and avoids PWA caching issues.
14. **Test on a real device** — camera APIs behave differently in desktop browser dev tools vs a real phone. Deploy to Vercel early and test on the actual target device.
