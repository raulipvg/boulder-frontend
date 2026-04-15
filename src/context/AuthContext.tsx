import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { authService } from '../services/auth/authService'
import type { AuthResponse, AuthUser } from '../types/models'
import { clearAuth, getStoredAuth, saveAuth } from '../utils/storage'

interface AuthContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  user: AuthUser | null
  auth: AuthResponse | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  hasRole: (...roles: string[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [auth, setAuth] = useState<AuthResponse | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const stored = getStoredAuth()
      if (!stored) {
        setIsLoading(false)
        return
      }

      try {
        saveAuth(stored)
        const me = await authService.me()
        setAuth(stored)
        setUser(me)
      } catch {
        if (stored.RefreshToken) {
          try {
            const refreshed = await authService.refresh(stored.RefreshToken)
            saveAuth(refreshed)
            setAuth(refreshed)
            setUser(refreshed.User)
          } catch {
            clearAuth()
          }
        } else {
          clearAuth()
        }
      } finally {
        setIsLoading(false)
      }
    }

    void init()
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    isAuthenticated: !!auth?.AccessToken && !!user,
    isLoading,
    user,
    auth,
    login: async (email: string, password: string) => {
      const response = await authService.login(email, password)
      saveAuth(response)
      setAuth(response)
      setUser(response.User)
    },
    logout: () => {
      if (user?.UserId) {
        localStorage.removeItem(`erp-boulder:empresaObjetivoId:${user.UserId}`)
      }
      clearAuth()
      setAuth(null)
      setUser(null)
    },
    hasRole: (...roles: string[]) => roles.some((role) => user?.RoleCodes?.includes(role)),
  }), [auth, isLoading, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
