import { type TreatCardLogoKey } from './treats'

export type MockVendorReward = {
  id: string
  title: string
  description: string
  collectedCount: number
  requiredCount: number
  actionLabel?: string
}

export type MockVendorCollectCategory = {
  id: string
  label: string
}

export type MockVendorCollectItem = {
  id: string
  name: string
  treatCount: number
  categoryIds: string[]
  showInAll?: boolean
}

export type MockVendor = {
  id: string
  displayName: string
  friendlyName: string
  logoKey: TreatCardLogoKey
  distanceText: string
  collectedCount: number
  validityDays: number
  expiryDays: number
  redeemRewards: MockVendorReward[]
  collectCategories: MockVendorCollectCategory[]
  collectItems: MockVendorCollectItem[]
}

export const mockVendors: MockVendor[] = [
  {
    id: 'cup-and-bean',
    displayName: 'CUP & BEAN',
    friendlyName: 'Cup & Bean',
    logoKey: 'cupAndBean',
    distanceText: '0.3 km away',
    collectedCount: 80,
    validityDays: 21,
    expiryDays: 90,
    redeemRewards: [
      {
        id: 'cup-and-bean-free-coffee-green',
        title: 'FREE CUP OF COFFEE',
        description: 'Treat yourself to any cup of coffee with €5 on the house',
        collectedCount: 100,
        requiredCount: 100,
        actionLabel: 'REDEEM NOW',
      },
      {
        id: 'cup-and-bean-free-coffee-yellow',
        title: 'FREE CUP OF COFFEE',
        description: 'Treat yourself to any cup of coffee with €5 on the house',
        collectedCount: 80,
        requiredCount: 100,
      },
      {
        id: 'cup-and-bean-free-coffee-black',
        title: 'FREE CUP OF COFFEE',
        description: 'Treat yourself to any cup of coffee with €5 on the house',
        collectedCount: 20,
        requiredCount: 100,
      },
    ],
    collectCategories: [
      { id: 'all', label: 'ALL' },
      { id: 'drinks', label: 'DRINKS' },
      { id: 'bakery', label: 'BAKERY' },
      { id: 'add-ons', label: 'ADD-ONS' },
      { id: 'hot', label: 'HOT' },
      { id: 'iced', label: 'ICED' },
      { id: 'sweets', label: 'SWEETS' },
    ],
    collectItems: [
      {
        id: 'cup-and-bean-cup-of-coffee',
        name: 'CUP OF COFFEE',
        treatCount: 80,
        categoryIds: ['drinks', 'hot'],
        showInAll: true,
      },
      {
        id: 'cup-and-bean-iced-latte',
        name: 'ICED LATTE',
        treatCount: 80,
        categoryIds: ['drinks', 'iced'],
        showInAll: true,
      },
      {
        id: 'cup-and-bean-tea',
        name: 'TEA',
        treatCount: 80,
        categoryIds: ['drinks', 'hot'],
        showInAll: true,
      },
      {
        id: 'cup-and-bean-extra-shot',
        name: 'EXTRA SHOT',
        treatCount: 80,
        categoryIds: ['add-ons', 'hot'],
        showInAll: true,
      },
      {
        id: 'cup-and-bean-any-biscuit',
        name: 'ANY BISCUIT',
        treatCount: 80,
        categoryIds: ['bakery', 'sweets'],
        showInAll: true,
      },
      {
        id: 'cup-and-bean-chocolate-cookie',
        name: 'CHOCOLATE COOKIE',
        treatCount: 80,
        categoryIds: ['bakery', 'sweets'],
        showInAll: true,
      },
      {
        id: 'cup-and-bean-donut',
        name: 'DONUT',
        treatCount: 80,
        categoryIds: ['bakery', 'sweets'],
        showInAll: false,
      },
    ],
  },
  {
    id: 'on-the-way',
    displayName: 'ON THE WAY',
    friendlyName: 'On The Way',
    logoKey: 'onTheWay',
    distanceText: '0.3 km away',
    collectedCount: 60,
    validityDays: 18,
    expiryDays: 90,
    redeemRewards: [
      {
        id: 'on-the-way-free-sandwich-green',
        title: 'FREE SANDWICH',
        description: 'Pick any made-to-order sandwich and enjoy €5 off the total',
        collectedCount: 100,
        requiredCount: 100,
        actionLabel: 'REDEEM NOW',
      },
      {
        id: 'on-the-way-free-sandwich-yellow',
        title: 'FREE SANDWICH',
        description: 'Pick any made-to-order sandwich and enjoy €5 off the total',
        collectedCount: 80,
        requiredCount: 100,
      },
      {
        id: 'on-the-way-free-sandwich-black',
        title: 'FREE SANDWICH',
        description: 'Pick any made-to-order sandwich and enjoy €5 off the total',
        collectedCount: 20,
        requiredCount: 100,
      },
    ],
    collectCategories: [
      { id: 'all', label: 'ALL' },
      { id: 'sandwiches', label: 'SANDWICHES' },
      { id: 'drinks', label: 'DRINKS' },
      { id: 'snacks', label: 'SNACKS' },
      { id: 'breakfast', label: 'BREAKFAST' },
      { id: 'add-ons', label: 'ADD-ONS' },
      { id: 'bakery', label: 'BAKERY' },
    ],
    collectItems: [
      {
        id: 'on-the-way-sandwich',
        name: 'HOUSE SANDWICH',
        treatCount: 80,
        categoryIds: ['sandwiches', 'breakfast'],
        showInAll: true,
      },
      {
        id: 'on-the-way-coffee',
        name: 'COFFEE',
        treatCount: 20,
        categoryIds: ['drinks', 'breakfast'],
        showInAll: true,
      },
      {
        id: 'on-the-way-any-pastry',
        name: 'ANY PASTRY',
        treatCount: 10,
        categoryIds: ['bakery', 'snacks'],
        showInAll: true,
      },
      {
        id: 'on-the-way-breakfast-wrap',
        name: 'BREAKFAST WRAP',
        treatCount: 40,
        categoryIds: ['breakfast', 'sandwiches'],
      },
      {
        id: 'on-the-way-bottled-juice',
        name: 'BOTTLED JUICE',
        treatCount: 15,
        categoryIds: ['drinks'],
      },
      {
        id: 'on-the-way-extra-cheese',
        name: 'EXTRA CHEESE',
        treatCount: 5,
        categoryIds: ['add-ons'],
      },
      {
        id: 'on-the-way-chocolate-bar',
        name: 'CHOCOLATE BAR',
        treatCount: 10,
        categoryIds: ['snacks'],
      },
    ],
  },
]

export const findMockVendorById = (vendorId: string) =>
  mockVendors.find((vendor) => vendor.id === vendorId)
