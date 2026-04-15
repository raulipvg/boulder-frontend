import axios from 'axios'
import { clearAuth, getStoredAuth } from '../utils/storage'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

apiClient.interceptors.request.use((config) => {
  const auth = getStoredAuth()
  if (auth?.AccessToken) {
    config.headers.Authorization = `Bearer ${auth.AccessToken}`
  }

  if (auth?.User?.RoleCodes?.includes('ADMIN_TOTAL')) {
    const targetKey = auth.User.UserId ? `erp-boulder:empresaObjetivoId:${auth.User.UserId}` : ''
    const targetCompanyId = targetKey ? localStorage.getItem(targetKey) : null
    if (targetCompanyId) {
      config.headers['X-Empresa-Id'] = targetCompanyId
    }
  }

  return config
})

let isRefreshing = false

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const auth = getStoredAuth()

    if (error.response?.status === 401 && auth?.RefreshToken && !original?._retry) {
      original._retry = true

      if (!isRefreshing) {
        isRefreshing = true
        try {
          const refreshResponse = await axios.post(`${import.meta.env.VITE_API_URL || '/api'}/auth/refresh-token`, {
            RefreshToken: auth.RefreshToken,
          })
          localStorage.setItem('erp-boulder:auth', JSON.stringify(refreshResponse.data))
          isRefreshing = false
          return apiClient(original)
        } catch {
          isRefreshing = false
          clearAuth()
          window.location.href = '/login'
        }
      }
    }

    return Promise.reject(error)
  },
)

export default apiClient
