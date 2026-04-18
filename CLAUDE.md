# CLAUDE.md

This file is read automatically by Claude Code and other CLI LLM coding tools.
It contains project context, rules, and instructions for all code generation in this repo.

---

## Project

**Loyalr** — a PWA loyalty stamp app for small merchants and consumers.
See `BRIEF.md` for full product context, flows, and design decisions.

Two interfaces, one Next.js app:
- `/` → Consumer (anonymous, zero sign-up)
- `/merchant` → Merchant (email login)

---

## Stack

- Next.js 14, App Router, TypeScript, Tailwind CSS
- Supabase (PostgreSQL + anonymous auth + RLS)
- `@zxing/browser` for QR/barcode scanning via web camera
- `qrcode.react` for QR display
- Vercel for deployment

---

## Absolute rules — never break these

1. **All pages are `'use client'`** — no server components, no API routes in the demo
2. **Camera tracks must be stopped on cleanup** — always call `track.stop()` on every MediaStream track when leaving the scan tab or unmounting. This is a memory leak and microphone/camera indicator bug if missed.
3. **Check session before creating anon user** — call `supabase.auth.getSession()` first. Only call `signInAnonymously()` if there is no existing session.
4. **JSON.parse all QR results in try/catch** — QR content is untrusted input. Never let a bad scan crash the app.
5. **No hardcoded merchant IDs** — always read from the QR payload or DB.
6. **Dark theme only** — `#0a0a0f` background, `#6ee7b7` teal accent. No light mode.
7. **No page navigation between tabs** — use local state (`tab` variable). Do not use Next.js router for tab switching.
8. **savedCards in localStorage only** — key `loyalr_saved_cards`, value `JSON.stringify(SavedCard[])`. No DB table.

---

## File responsibilities

```
lib/supabase.ts          — Supabase client + all DB helper functions
app/page.tsx             — Consumer app, all three tabs (wallet/scan/myqr)
app/merchant/page.tsx    — Merchant app, all three tabs (qr/scan/today)
app/components/
  QRScanner.tsx          — Shared camera + zxing component
  StampCard.tsx          — Stamp grid display
  QRDisplay.tsx          — QR code display wrapper
app/layout.tsx           — Root layout, PWA meta, font imports
public/manifest.json     — PWA manifest
```

---

## Database schema (read-only reference)

```sql
merchants   (id, name, slug, stamp_target, reward_label)
users       (id, handle)          -- id = auth.users.id
loyalty_cards (id, user_id, merchant_id, stamps_current)
transactions  (id, loyalty_card_id, type, created_at)
```

---

## QR payload format

```json
// Merchant QR (merchant shows → consumer scans)
{ "type": "merchant", "merchant_id": "uuid" }

// Consumer QR (consumer shows → merchant scans)
{ "type": "consumer", "user_handle": "teal-fox-429", "user_id": "uuid" }
```

---

## Key functions in lib/supabase.ts

```typescript
getOrCreateUser()          // anon sign-in + upsert users row
getOrCreateCard(uid, mid)  // upsert loyalty_cards
issueStamp(cardId, current) // increment + log transaction
getMerchantBySlug(slug)    // fetch merchant row
getTodayStamps(merchantId) // count today's transactions
```

---

## Stamp animation sequence

1. White flash overlay 150ms
2. New stamp scales 2× → 1× ease-out 300ms
3. Success card slides up — shows merchant name + new count
4. Auto-dismiss after 2500ms → return to wallet tab
5. If reward unlocked (stamps >= target): no auto-dismiss, full-screen reward state

---

## Design tokens

```
bg:          #0a0a0f
surface:     #14141c
border:      rgba(255,255,255,0.08)
text:        #f0ede8
text-muted:  rgba(255,255,255,0.4)
accent:      #6ee7b7   (teal — stamps, success)
accent-warm: #f59e0b   (amber — rewards)
font:        DM Sans (body), DM Mono (handles/codes)
radius-lg:   20px
radius-md:   12px
```

---

## Build order

Implement in this exact order to avoid import errors:

1. `lib/supabase.ts`
2. `app/components/QRScanner.tsx`
3. `app/components/StampCard.tsx`
4. `app/components/QRDisplay.tsx`
5. `app/layout.tsx`
6. `app/page.tsx` (consumer)
7. `app/merchant/page.tsx`
8. `public/manifest.json`

---

## What is out of scope for this build

Do not implement:
- API routes or server actions
- JWT signing on QR codes
- Offline IndexedDB queue
- Push notifications / service worker
- Merchant sign-up UI (merchants are seeded directly in Supabase)
- Redemption flow (stamp collection only for demo)
- Multiple merchant support beyond the seeded row
- Light mode
- Any external UI component library
