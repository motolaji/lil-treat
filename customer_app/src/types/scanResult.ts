// Carries a real earn result through router location state between the new
// scan screen and the login/install follow-up prompts — replaces the old
// mock-lookup-by-id flow (mocks/qrCodeScans.ts) with the actual outcome.
export type ScanResultLocationState = {
  merchantId: string
  vendorName: string
  collectedCount: number
}
