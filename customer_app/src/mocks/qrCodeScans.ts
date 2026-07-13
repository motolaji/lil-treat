export type MockQrCodeScanResult = {
  id: string
  vendorId: string
  collectedCount: number
}

export type QrCodeScanPromptLocationState = {
  scanResultId?: string
}

const claimTreatScanResult: MockQrCodeScanResult = {
  id: 'claim-a-treat',
  vendorId: 'cup-and-bean',
  collectedCount: 20,
}

export const mockQrCodeScanResults: MockQrCodeScanResult[] = [claimTreatScanResult]

export const mockClaimTreatScanResult = claimTreatScanResult

export const findMockQrCodeScanResultById = (scanResultId: string) =>
  mockQrCodeScanResults.find((scanResult) => scanResult.id === scanResultId)
