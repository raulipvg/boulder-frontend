import apiClient from '../apiClient'
import type { AuthResponse, AuthUser } from '../../types/models'

export const authService = {
  login: async (Email: string, Password: string) => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', { Email, Password })
    return data
  },
  refresh: async (RefreshToken: string) => {
    const { data } = await apiClient.post<AuthResponse>('/auth/refresh-token', { RefreshToken })
    return data
  },
  me: async () => {
    const { data } = await apiClient.get<AuthUser>('/auth/me')
    return data
  },
}
