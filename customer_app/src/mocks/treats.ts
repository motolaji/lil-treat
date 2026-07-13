export type TreatCardBackground = 'black' | 'white'
export type TreatCardLogoKey = 'cupAndBean' | 'onTheWay'

export type MockTreatCard = {
  id: string
  vendorId: string
  vendorName: string
  logoKey: TreatCardLogoKey
  collectedCount: number
  requiredCount: number
  expiryText?: string
  actionLabel: string
  background: TreatCardBackground
  locationText?: string
}

export const mockTreatCards: MockTreatCard[] = [
  {
    id: 'cup-and-bean-home-1',
    vendorId: 'cup-and-bean',
    vendorName: 'CUP & BEAN',
    logoKey: 'cupAndBean',
    collectedCount: 20,
    requiredCount: 100,
    expiryText: 'Treats expire in 90 days',
    actionLabel: 'VIEW BIG TREATS',
    background: 'black',
  },
  {
    id: 'on-the-way-home-1',
    vendorId: 'on-the-way',
    vendorName: 'ON THE WAY',
    logoKey: 'onTheWay',
    collectedCount: 20,
    requiredCount: 100,
    expiryText: 'Treats expire in 90 days',
    actionLabel: 'VIEW BIG TREATS',
    background: 'black',
  },
  {
    id: 'cup-and-bean-home-2',
    vendorId: 'cup-and-bean',
    vendorName: 'CUP & BEAN',
    logoKey: 'cupAndBean',
    collectedCount: 20,
    requiredCount: 100,
    expiryText: 'Treats expire in 90 days',
    actionLabel: 'VIEW BIG TREATS',
    background: 'black',
  },
  {
    id: 'on-the-way-home-2',
    vendorId: 'on-the-way',
    vendorName: 'ON THE WAY',
    logoKey: 'onTheWay',
    collectedCount: 60,
    requiredCount: 100,
    expiryText: 'Treats expire in 90 days',
    actionLabel: 'VIEW BIG TREATS',
    background: 'black',
  },
  {
    id: 'cup-and-bean-home-3',
    vendorId: 'cup-and-bean',
    vendorName: 'CUP & BEAN',
    logoKey: 'cupAndBean',
    collectedCount: 80,
    requiredCount: 100,
    expiryText: 'Treats expire in 90 days',
    actionLabel: 'VIEW BIG TREATS',
    background: 'black',
  },
  {
    id: 'on-the-way-home-3',
    vendorId: 'on-the-way',
    vendorName: 'ON THE WAY',
    logoKey: 'onTheWay',
    collectedCount: 100,
    requiredCount: 100,
    expiryText: 'Treats expire in 90 days',
    actionLabel: 'REDEEM BIG TREAT',
    background: 'black',
  },
]

export const mockTreatJarCards: MockTreatCard[] = [
  {
    id: 'cup-and-bean-jar-1',
    vendorId: 'cup-and-bean',
    vendorName: 'CUP & BEAN',
    logoKey: 'cupAndBean',
    collectedCount: 20,
    requiredCount: 100,
    actionLabel: 'VIEW BIG TREATS',
    background: 'white',
    locationText: '0.3 km',
  },
  {
    id: 'on-the-way-jar-1',
    vendorId: 'on-the-way',
    vendorName: 'ON THE WAY',
    logoKey: 'onTheWay',
    collectedCount: 20,
    requiredCount: 100,
    actionLabel: 'VIEW BIG TREATS',
    background: 'white',
    locationText: '0.3 km',
  },
  {
    id: 'cup-and-bean-jar-2',
    vendorId: 'cup-and-bean',
    vendorName: 'CUP & BEAN',
    logoKey: 'cupAndBean',
    collectedCount: 20,
    requiredCount: 100,
    actionLabel: 'VIEW BIG TREATS',
    background: 'white',
    locationText: '0.3 km',
  },
  {
    id: 'on-the-way-jar-2',
    vendorId: 'on-the-way',
    vendorName: 'ON THE WAY',
    logoKey: 'onTheWay',
    collectedCount: 20,
    requiredCount: 100,
    actionLabel: 'VIEW BIG TREATS',
    background: 'white',
    locationText: '0.3 km',
  },
  {
    id: 'cup-and-bean-jar-3',
    vendorId: 'cup-and-bean',
    vendorName: 'CUP & BEAN',
    logoKey: 'cupAndBean',
    collectedCount: 45,
    requiredCount: 100,
    actionLabel: 'VIEW BIG TREATS',
    background: 'white',
    locationText: '0.3 km',
  },
  {
    id: 'on-the-way-jar-3',
    vendorId: 'on-the-way',
    vendorName: 'ON THE WAY',
    logoKey: 'onTheWay',
    collectedCount: 35,
    requiredCount: 100,
    actionLabel: 'VIEW BIG TREATS',
    background: 'white',
    locationText: '0.3 km',
  },
  {
    id: 'cup-and-bean-jar-4',
    vendorId: 'cup-and-bean',
    vendorName: 'CUP & BEAN',
    logoKey: 'cupAndBean',
    collectedCount: 80,
    requiredCount: 100,
    actionLabel: 'VIEW BIG TREATS',
    background: 'white',
    locationText: '0.3 km',
  },
  {
    id: 'on-the-way-jar-4',
    vendorId: 'on-the-way',
    vendorName: 'ON THE WAY',
    logoKey: 'onTheWay',
    collectedCount: 55,
    requiredCount: 100,
    actionLabel: 'VIEW BIG TREATS',
    background: 'white',
    locationText: '0.3 km',
  },
]
