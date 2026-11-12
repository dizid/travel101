import { ref } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { getAuthToken, clearAuthToken } from '@/lib/authToken'

const API_BASE = '/api'

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  requiresAuth?: boolean
  headers?: Record<string, string>
}

export function useApi() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function request<T>(endpoint: string, options: ApiOptions = {}): Promise<T | null> {
    const { method = 'GET', body, requiresAuth = true, headers: customHeaders = {} } = options
    const userStore = useUserStore()

    loading.value = true
    error.value = null

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...customHeaders,
      }

      // Signed in: send the Neon Auth JWT; the server decides who is calling from it
      // alone (T-0555). x-user-id is still sent but the server ignores it.
      const sendAuth = requiresAuth && !!userStore.authUserId
      if (sendAuth && userStore.authUserId) {
        headers['x-user-id'] = userStore.authUserId
        const token = await getAuthToken()
        if (token) headers['Authorization'] = `Bearer ${token}`
      }

      // Speed-bump shared secret expected by the AI endpoints' validateAppSecret()
      // check (see netlify/functions/lib/security.mts). Harmless to send on every
      // request — the server only checks it on the AI-calling functions.
      const appSecret = import.meta.env.VITE_APP_SHARED_SECRET
      if (appSecret) {
        headers['x-app-secret'] = appSecret
      }

      const send = () =>
        fetch(`${API_BASE}${endpoint}`, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        })

      let response = await send()

      // A token can expire or be revoked between minting and use: mint a fresh one
      // and try once more before reporting the 401.
      if (response.status === 401 && sendAuth) {
        clearAuthToken()
        const freshToken = await getAuthToken()
        if (freshToken) {
          headers['Authorization'] = `Bearer ${freshToken}`
          response = await send()
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      if (response.status === 204) {
        return null
      }

      return await response.json()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      console.error('API error:', e)
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    request,
    get: <T>(endpoint: string, options?: Omit<ApiOptions, 'method'>) =>
      request<T>(endpoint, { ...options, method: 'GET' }),
    post: <T>(endpoint: string, body: unknown, options?: Omit<ApiOptions, 'method' | 'body'>) =>
      request<T>(endpoint, { ...options, method: 'POST', body }),
    put: <T>(endpoint: string, body: unknown, options?: Omit<ApiOptions, 'method' | 'body'>) =>
      request<T>(endpoint, { ...options, method: 'PUT', body }),
    del: <T>(endpoint: string, body?: unknown, options?: Omit<ApiOptions, 'method' | 'body'>) =>
      request<T>(endpoint, { ...options, method: 'DELETE', body }),
  }
}
