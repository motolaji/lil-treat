export type SidebarIconKey = 'treatJar' | 'myQr' | 'receipts' | 'install' | 'helpSupport'

export type MockSidebarItem = {
  id: string
  label: string
  iconKey: SidebarIconKey
}

export const mockSidebarItems: MockSidebarItem[] = [
  {
    id: 'treat-jar',
    label: 'Treat Jar',
    iconKey: 'treatJar',
  },
  {
    id: 'my-qr',
    label: 'My QR Code',
    iconKey: 'myQr',
  },
  {
    id: 'receipts',
    label: 'Receipts',
    iconKey: 'receipts',
  },
  {
    id: 'install',
    label: 'Install',
    iconKey: 'install',
  },
  {
    id: 'help-support',
    label: 'Help & Support',
    iconKey: 'helpSupport',
  },
]
