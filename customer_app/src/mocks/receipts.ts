import { type TreatCardLogoKey } from './treats'

export type MockReceiptItem = {
  id: string
  name: string
  cost: string
  treatCount: number
}

export type MockReceipt = {
  id: string
  vendorId: string
  vendorName: string
  vendorDisplayName: string
  logoKey: TreatCardLogoKey
  purchaseDate: string
  purchaseDateLong: string
  purchaseTime: string
  collectedCount: number
  amountSpent: string
  actionLabel: string
  items: MockReceiptItem[]
}

export const mockReceipts: MockReceipt[] = [
  {
    id: 'cup-and-bean-receipt-1',
    vendorId: 'cup-and-bean',
    vendorName: 'CUP & BEAN',
    vendorDisplayName: 'Cup & Bean',
    logoKey: 'cupAndBean',
    purchaseDate: '19-Jul-2026',
    purchaseDateLong: '19 July 2026',
    purchaseTime: '16:00 BST',
    collectedCount: 60,
    amountSpent: '£12',
    actionLabel: 'VIEW RECEIPT',
    items: [
      { id: 'cup-coffee-1', name: 'Cup of Coffee', cost: '£4', treatCount: 20 },
      { id: 'cup-coffee-2', name: 'Cup of Coffee', cost: '£4', treatCount: 20 },
      { id: 'cup-coffee-3', name: 'Cup of Coffee', cost: '£4', treatCount: 20 },
    ],
  },
  {
    id: 'on-the-way-receipt-1',
    vendorId: 'on-the-way',
    vendorName: 'ON THE WAY',
    vendorDisplayName: 'On The Way',
    logoKey: 'onTheWay',
    purchaseDate: '15-Jul-2026',
    purchaseDateLong: '15 July 2026',
    purchaseTime: '09:30 BST',
    collectedCount: 40,
    amountSpent: '£8',
    actionLabel: 'VIEW RECEIPT',
    items: [
      {
        id: 'sparkling-water',
        name: 'Sparkling Water with Extra Citrus and Botanical Infusion',
        cost: '£4',
        treatCount: 20,
      },
      { id: 'chocolate-bar', name: 'Chocolate Bar', cost: '£4', treatCount: 20 },
      { id: 'ham-cheese-toastie', name: 'Ham & Cheese Toastie', cost: '£5', treatCount: 25 },
      { id: 'flat-white', name: 'Flat White', cost: '£3', treatCount: 15 },
      { id: 'blueberry-muffin', name: 'Blueberry Muffin', cost: '£3', treatCount: 15 },
      { id: 'orange-juice', name: 'Fresh Orange Juice', cost: '£4', treatCount: 20 },
      { id: 'veggie-wrap', name: 'Roasted Veggie Wrap', cost: '£6', treatCount: 30 },
      { id: 'protein-pot', name: 'Protein Snack Pot', cost: '£5', treatCount: 25 },
      { id: 'iced-latte', name: 'Iced Vanilla Latte', cost: '£4', treatCount: 20 },
      { id: 'banana-bread', name: 'Banana Bread Slice', cost: '£3', treatCount: 15 },
      { id: 'crisps-sea-salt', name: 'Sea Salt Crisps', cost: '£2', treatCount: 10 },
      { id: 'fruit-salad', name: 'Seasonal Fruit Salad', cost: '£4', treatCount: 20 },
      { id: 'yoghurt-granola', name: 'Greek Yoghurt & Granola Pot', cost: '£4', treatCount: 20 },
      { id: 'breakfast-bagel', name: 'Breakfast Bagel', cost: '£6', treatCount: 30 },
      { id: 'mocha', name: 'Café Mocha', cost: '£4', treatCount: 20 },
      { id: 'sparkling-lemonade', name: 'Sparkling Lemonade', cost: '£3', treatCount: 15 },
      { id: 'falafel-box', name: 'Falafel Lunch Box', cost: '£7', treatCount: 35 },
    ],
  },
]
