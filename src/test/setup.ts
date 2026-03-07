import { vi, beforeEach, afterEach } from 'vitest'
import { config } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// ============================================
// Global Mocks
// ============================================

// Mock Netlify global (used by serverless functions via Netlify.env.get)
;(globalThis as any).Netlify = {
  env: {
    get: (key: string) => process.env[key],
    set: (key: string, value: string) => { process.env[key] = value },
    delete: (key: string) => { delete process.env[key] },
    toObject: () => ({ ...process.env }),
    has: (key: string) => key in process.env,
  },
}

// Mock fetch API
export const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock localStorage
export const localStorageMock = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => localStorageMock.store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageMock.store[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageMock.store[key]
  }),
  clear: vi.fn(() => {
    localStorageMock.store = {}
  }),
  get length() {
    return Object.keys(localStorageMock.store).length
  },
  key: vi.fn((index: number) => Object.keys(localStorageMock.store)[index] ?? null),
}
Object.defineProperty(global, 'localStorage', { value: localStorageMock })

// Mock window.location
export const mockLocation = {
  href: '',
  origin: 'http://localhost:3000',
  pathname: '/',
  search: '',
  hash: '',
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
}
Object.defineProperty(global, 'location', {
  value: mockLocation,
  writable: true,
})

// Mock crypto.randomUUID
let uuidCounter = 0
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => `test-uuid-${++uuidCounter}`),
  },
})

// Mock console.error to keep test output clean (but still track calls)
export const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
export const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})

// ============================================
// Auth Client Mock
// ============================================

export const mockAuthClient = {
  getSession: vi.fn().mockResolvedValue({ data: null }),
  signOut: vi.fn().mockResolvedValue(undefined),
  signIn: vi.fn(),
  signUp: vi.fn(),
}

vi.mock('@/lib/auth', () => ({
  authClient: mockAuthClient,
}))

// ============================================
// Test Lifecycle Hooks
// ============================================

beforeEach(() => {
  // Reset Pinia store before each test
  setActivePinia(createPinia())

  // Clear mocks
  mockFetch.mockReset()

  // Reset localStorage
  localStorageMock.store = {}
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
  localStorageMock.clear.mockClear()

  // Reset location mock
  mockLocation.href = ''
  mockLocation.pathname = '/'
  mockLocation.search = ''
  mockLocation.hash = ''
  mockLocation.assign.mockClear()
  mockLocation.replace.mockClear()

  // Reset auth client mock
  mockAuthClient.getSession.mockReset().mockResolvedValue({ data: null })
  mockAuthClient.signOut.mockReset().mockResolvedValue(undefined)

  // Reset UUID counter
  uuidCounter = 0

  // Clear all mocks
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ============================================
// Vue Test Utils Configuration
// ============================================

config.global.stubs = {
  teleport: true,
  transition: false,
}

// ============================================
// Helper Functions
// ============================================

/**
 * Create a mock successful API response
 */
export function createMockResponse<T>(data: T, status = 200): Promise<Response> {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers({ 'Content-Type': 'application/json' }),
  } as Response)
}

/**
 * Create a mock error API response
 */
export function createErrorResponse(
  error: string,
  status = 400
): Promise<Response> {
  return Promise.resolve({
    ok: false,
    status,
    statusText: 'Error',
    json: () => Promise.resolve({ error }),
    text: () => Promise.resolve(JSON.stringify({ error })),
    headers: new Headers({ 'Content-Type': 'application/json' }),
  } as Response)
}

/**
 * Create a 204 No Content response
 */
export function createNoContentResponse(): Promise<Response> {
  return Promise.resolve({
    ok: true,
    status: 204,
    statusText: 'No Content',
    json: () => Promise.resolve(null),
    text: () => Promise.resolve(''),
    headers: new Headers(),
  } as Response)
}

/**
 * Create a network error response (fetch rejection)
 */
export function createNetworkError(message = 'Network error'): Promise<never> {
  return Promise.reject(new Error(message))
}

/**
 * Wait for next tick (useful for testing reactive updates)
 */
export function nextTick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

/**
 * Wait for specified milliseconds
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Flush all pending promises
 */
export async function flushPromises(): Promise<void> {
  await nextTick()
  await nextTick()
}
