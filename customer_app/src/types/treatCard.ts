// Replaces mocks/treats.ts's MockTreatCard now that Home/TreatJar read real
// merchant/loyalty-card data — logoSrc/logoAlt carry the real merchant logo
// (or a generic fallback) directly instead of a closed-union logoKey lookup.
export type HomeTreatCard = {
  id: string
  vendorId: string
  vendorName: string
  logoSrc: string
  logoAlt: string
  collectedCount: number
  requiredCount: number
  expiryText?: string
  actionLabel: string
  background: 'black' | 'white'
  locationText?: string
}
