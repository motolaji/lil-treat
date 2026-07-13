// Replaces mocks/receipts.ts's MockReceipt now that ReceiptsListScreen reads
// real receipts. Money/dates are pre-formatted display strings here (matching
// the existing component contract) — the real numeric/ISO values live on
// lib/supabase.ts's Receipt type and are formatted once, at the screen level.
export type ReceiptItemView = {
  id: string
  name: string
  cost: string
  treatCount: number
}

export type ReceiptView = {
  id: string
  vendorId: string
  vendorName: string
  vendorDisplayName: string
  logoSrc: string
  logoAlt: string
  purchaseDate: string
  purchaseDateLong: string
  purchaseTime: string
  collectedCount: number
  amountSpent: string
  actionLabel: string
  items: ReceiptItemView[]
}
