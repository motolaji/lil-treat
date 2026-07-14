export type SidebarIconKey = 'treatJar' | 'receipts' | 'install' | 'helpSupport'

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
