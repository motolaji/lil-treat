import { brand } from '../config/brand'
import { support } from '../config/support'

export type HelpTopicStep = {
  id: string
  emphasis: string
  remainder: string
}

export type MockHelpTopic = {
  id: string
  title: string
  description: string
  actionLabel?: string
  email?: string
  steps?: HelpTopicStep[]
}

const toTitleCase = (value: string) =>
  value.replace(/\b\w/g, (character) => character.toUpperCase())

export const mockHelpTopics: MockHelpTopic[] = [
  {
    id: 'vendor-app',
    title: 'Are you a vendor?',
    description: `Manage your business and reward your customers with ${brand.treatUnitPlural}`,
    actionLabel: `Go to ${toTitleCase(support.vendorAppLabel)}`,
  },
  {
    id: 'how-it-works',
    title: `How ${brand.appName} works?`,
    description: `Collect ${brand.treatUnitPlural} every time you shop and redeem them for a Big Treat`,
    steps: [
      {
        id: 'scan',
        emphasis: 'Shop and scan',
        remainder: `the vendor's QR code to collect a ${brand.treatUnitSingular}`,
      },
      {
        id: 'collect',
        emphasis: 'Collect',
        remainder: `${brand.treatUnitPlural} every time you shop with the same vendor`,
      },
      {
        id: 'redeem',
        emphasis: 'Redeem a Big Treat',
        remainder: `once you have enough ${brand.treatUnitPlural} from a vendor`,
      },
    ],
  },
  {
    id: 'technical-issue',
    title: 'Report a technical issue',
    description: "Experiencing a problem? Let us know and we'll get back to you",
    email: support.email,
  },
]
