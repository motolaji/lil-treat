export type MockSidebarUser = {
  nickname: string
  email: string
  collectedTreatCount: number
  visitedVendorCount: number
}

export type MockUserAuthProvider = 'email' | 'google'

type MockUserSession = {
  isLoggedIn: boolean
  hasInstalledApp: boolean
  authProvider: MockUserAuthProvider | null
  isEmailVerified: boolean
}

const mockUserSession: MockUserSession = {
  isLoggedIn: false,
  hasInstalledApp: false,
  authProvider: null,
  isEmailVerified: false,
}

export const mockSidebarUser: MockSidebarUser = {
  nickname: 'User Nickname',
  email: 'user.j@example.com',
  collectedTreatCount: 320,
  visitedVendorCount: 12,
}

let mockUserPassword = 'password123'

export const isMockUserLoggedIn = () => mockUserSession.isLoggedIn

export const getMockUserAuthProvider = () => mockUserSession.authProvider

export const isMockUserEmailVerified = () => mockUserSession.isEmailVerified

export const isMockUserAppInstalled = () => mockUserSession.hasInstalledApp

export const setMockUserNickname = (nickname: string) => {
  mockSidebarUser.nickname = nickname
}

export const setMockUserEmail = (email: string) => {
  mockSidebarUser.email = email
}

export const doesMockUserPasswordMatch = (password: string) => password === mockUserPassword

export const setMockUserPassword = (password: string) => {
  mockUserPassword = password
}

export const setMockUserAppInstalled = (isInstalled: boolean) => {
  mockUserSession.hasInstalledApp = isInstalled
}

export const logInMockUser = (authProvider: MockUserAuthProvider = 'email') => {
  mockUserSession.isLoggedIn = true
  mockUserSession.authProvider = authProvider
  mockUserSession.isEmailVerified = authProvider === 'google'
}

export const logOutMockUser = () => {
  mockUserSession.isLoggedIn = false
  mockUserSession.authProvider = null
  mockUserSession.isEmailVerified = false
}
