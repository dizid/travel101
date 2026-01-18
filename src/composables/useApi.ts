import { ref } from 'vue'
import { useUserStore } from '@/stores/userStore'

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

      if (requiresAuth && userStore.authUserId) {
        headers['x-user-id'] = userStore.authUserId
      }

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      })

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
