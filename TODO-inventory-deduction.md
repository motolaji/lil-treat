# RESOLVED — inventory deduction now tied to the scan flow

Built as part of the Treats redesign (multi-tier rewards, per-item earn rates, itemized
receipts). Option 1 below was the one implemented: `app/merchant/scan/page.tsx` now shows
an item picker (qty steppers, pulled from `getInventoryItems`) when confirming a stamp;
picking items awards treats via `sum(qty * treats_value)` instead of a flat +1, creates a
`receipts` row (see `/receipts`), and decrements stock via `sellQty`. The flat +1 fallback
still applies for merchants with no inventory set up, or when no items are selected.

---

# Original note (kept for context)

## Current state (as of this note)

- **Stamp-earning flow** (`app/merchant/scan/page.tsx`): scans a customer's `/myqr` QR →
  `getOrCreateCard` → merchant optionally types a `£` purchase amount → `issueStamp`.
  No item/SKU selection anywhere in this path.
- **Inventory** (`lib/inventory.ts`, `app/merchant/inventory/page.tsx`): a standalone stock
  tracker. `stock_qty` only ever changes when the merchant manually taps "Sell 1" next to
  an item on `/merchant/inventory`, or via CSV upload/re-upload.

These two systems don't talk to each other today — a customer visit never touches
`inventory_items`/`inventory_transactions`.

## Options considered

1. **Merchant picks an item during scan** (leaning towards this one — fits the existing
   "merchant confirms the transaction at point of scan" model already used for the `£`
   amount step). When confirming a stamp in `app/merchant/scan/page.tsx`, add an optional
   item picker (pulling from `getInventoryItems(merchant.id)`) alongside/instead of the
   free-text amount field. Selecting an item calls `sellOne` right there, so one scan does
   both: issue stamp + deduct stock. Smallest change; doesn't touch the QR payload shape.

2. **Customer picks item(s) before showing their QR** — a "what did you get" screen on the
   consumer side before generating the QR/redeem payload, read at scan time. Bigger UX
   change (needs multi-item + quantity support), and would require extending the QR
   payload format (`ConsumerPayload`/`RedeemPayload` in `lib/supabase.ts` and
   `app/merchant/scan/page.tsx`) to carry item selections — not supported today.

Option 1 fits the grain of what's already built; option 2 is a much bigger scope.

## Not started yet — revisit when ready.
