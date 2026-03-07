import { vi, beforeEach, afterEach } from 'vitest'

// ============================================
// Netlify Global Mock
// ============================================

const mockEnvStore: Record<string, string> = {}

declare global {
  // eslint-disable-next-line no-var
  var Netlify: {
    env: {
      get: (key: string) => string | undefined
    }
  }
}

globalThis.Netlify = {
  env: {
    get: (key: string) => mockEnvStore[key] ?? process.env[key],
    set: (key: string, value: string) => { mockEnvStore[key] = value },
    delete: (key: string) => { delete mockEnvStore[key] },
    toObject: () => ({ ...process.env, ...mockEnvStore }),
    has: (key: string) => key in mockEnvStore || key in process.env,
  },
}

/**
 * Set a mock environment variable for testing
 */
export function setMockEnv(key: string, value: string): void {
  mockEnvStore[key] = value
}

/**
 * Clear all mock environment variables
 */
export function clearMockEnv(): void {
  Object.keys(mockEnvStore).forEach((key) => delete mockEnvStore[key])
}

/**
 * Set multiple mock environment variables at once
 */
export function setMockEnvs(envs: Record<string, string>): void {
  Object.entries(envs).forEach(([key, value]) => {
    mockEnvStore[key] = value
  })
}

// ============================================
// Mock fetch for external API calls
// ============================================

export const mockFetch = vi.fn()
globalThis.fetch = mockFetch

// ============================================
// Test Lifecycle Hooks
// ============================================

beforeEach(() => {
  clearMockEnv()
  mockFetch.mockReset()
  vi.clearAllMocks()

  // Set default env vars that most tests need
  setMockEnv('DATABASE_URL', 'postgresql://test:test@localhost/test')
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ============================================
// Helper Functions
// ============================================

/**
 * Create a mock Response object
 */
export function createMockResponse<T>(data: T, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers({ 'Content-Type': 'application/json' }),
    clone: () => createMockResponse(data, status),
  } as Response
}

/**
 * Create a mock error Response
 */
export function createErrorResponse(error: string, status = 400): Response {
  return createMockResponse({ error }, status)
}

/**
 * Wait for promises to resolve
 */
export function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}
