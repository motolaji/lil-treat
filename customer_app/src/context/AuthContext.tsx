import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase, getOrCreateUser, type UserRow } from '../lib/supabase'

interface AuthContextValue {
  user: UserRow | null
  email: string | null
  isAnonymous: boolean
  loading: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  email: null,
  isAnonymous: true,
  loading: true,
  refreshUser: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserRow | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [loading, setLoading] = useState(true)

  async function refreshUser() {
    const { data: { session } } = await supabase.auth.getSession()
    setIsAnonymous(session?.user?.is_anonymous ?? true)
    setEmail(session?.user?.email ?? null)
    const u = await getOrCreateUser()
    setUser(u)
  }

  useEffect(() => {
    refreshUser().finally(() => setLoading(false))

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      refreshUser()
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, email, isAnonymous, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}
