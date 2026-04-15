import type { AuthResponse } from '../types/models'

const AUTH_KEY = 'erp-boulder:auth'

export function saveAuth(data: AuthResponse) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(data))
}

export function getStoredAuth(): AuthResponse | null {
  const raw = localStorage.getItem(AUTH_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as AuthResponse
  } catch {
    return null
  }
}

export function clearAuth() {
  localStorage.removeItem(AUTH_KEY)
}

export function getAdminTargetCompanyKey(userId: number) {
  return `erp-boulder:empresaObjetivoId:${userId}`
}
