// Replaces mocks/vendors.ts's MockVendorReward/MockVendorCollectItem now that
// VendorScreen reads real rewards/inventory data.
export type VendorRewardView = {
  id: string
  title: string
  description: string
  collectedCount: number
  requiredCount: number
  actionLabel?: string
}

export type VendorCollectItemView = {
  id: string
  name: string
  treatCount: number
  imageUrl: string | null
  categoryIds: string[]
  showInAll?: boolean
}
