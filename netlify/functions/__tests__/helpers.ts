import type { Context } from '@netlify/functions'

/**
 * Create a mock HTTP Request for testing Netlify Functions
 * Supports both object syntax and positional arguments for convenience
 */
export function createMockRequest(
  methodOrOptions: string | {
    method?: string
    url?: string
    headers?: Record<string, string>
    body?: unknown
  },
  urlArg?: string,
  optionsArg?: {
    headers?: Record<string, string>
    body?: unknown
  }
): Request {
  let method: string
  let url: string
  let headers: Record<string, string>
  let body: unknown

  if (typeof methodOrOptions === 'string') {
    // Positional arguments: createMockRequest('GET', '/api/test', { headers, body })
    method = methodOrOptions
    url = urlArg || 'http://localhost/api/test'
    headers = optionsArg?.headers || {}
    body = optionsArg?.body
  } else {
    // Object syntax: createMockRequest({ method, url, headers, body })
    method = methodOrOptions.method || 'GET'
    url = methodOrOptions.url || 'http://localhost/api/test'
    headers = methodOrOptions.headers || {}
    body = methodOrOptions.body
  }

  // Ensure URL is absolute
  if (!url.startsWith('http')) {
    url = `http://localhost${url}`
  }

  const requestInit: RequestInit = {
    method,
    headers: new Headers(headers),
  }

  if (body !== undefined) {
    requestInit.body = JSON.stringify(body)
  }

  return new Request(url, requestInit)
}

/**
 * Create a mock Netlify Context for testing
 */
export function createMockContext(overrides: Partial<Context> = {}): Context {
  return {
    geo: {
      city: 'Bangkok',
      country: { code: 'TH', name: 'Thailand' },
      latitude: 13.7563,
      longitude: 100.5018,
      region: 'BKK',
      timezone: 'Asia/Bangkok',
    },
    ip: '127.0.0.1',
    requestId: `test-request-${Date.now()}`,
    account: { id: 'test-account' },
    site: {
      id: 'test-site',
      name: 'test-site',
      url: 'https://test.netlify.app',
    },
    server: { region: 'us-east-1' },
    params: {},
    next: () => Promise.resolve(new Response()),
    cookies: {
      get: () => undefined,
      set: () => {},
      delete: () => {},
    },
    json: <T>(data: T, init?: ResponseInit) =>
      new Response(JSON.stringify(data), {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init?.headers,
        },
      }),
    ...overrides,
  } as unknown as Context
}

/**
 * Parse a Response object and return the JSON data
 * Returns empty object if response has no body
 */
export async function parseResponse<T = unknown>(
  response: Response
): Promise<T> {
  try {
    const text = await response.text()
    if (!text) return {} as T
    return JSON.parse(text) as T
  } catch {
    return {} as T
  }
}

/**
 * Create request with authenticated user header
 */
export function createAuthenticatedRequest(
  userId: string,
  options: Omit<Parameters<typeof createMockRequest>[0], 'headers'> & {
    headers?: Record<string, string>
  } = {}
): Request {
  return createMockRequest({
    ...options,
    headers: {
      ...options.headers,
      'x-user-id': userId,
    },
  })
}

/**
 * Create request with user preferences header
 */
export function createRequestWithPrefs(
  prefs: Record<string, unknown>,
  options: Omit<Parameters<typeof createMockRequest>[0], 'headers'> & {
    headers?: Record<string, string>
  } = {}
): Request {
  return createMockRequest({
    ...options,
    headers: {
      ...options.headers,
      'x-user-prefs': JSON.stringify(prefs),
    },
  })
}

/**
 * Test data fixtures for backend tests
 */
export const fixtures = {
  users: {
    basic: {
      user_id: 'user-basic-123',
      prefs: {},
      is_pro: false,
      stripe_customer_id: null,
      stripe_subscription_id: null,
    },
    pro: {
      user_id: 'user-pro-456',
      prefs: { interests: ['temples', 'food'], budget: 'mid' },
      is_pro: true,
      stripe_customer_id: 'cus_pro123',
      stripe_subscription_id: 'sub_pro123',
    },
  },

  attractions: {
    temple: {
      id: 'attr-1',
      slug: 'wat-phra-kaew',
      name: 'Wat Phra Kaew',
      description: 'Temple of the Emerald Buddha',
      category: 'temple',
      province: 'Bangkok',
      location: 'Grand Palace',
      categories: { culture: 0.95, history: 0.8, photography: 0.7 },
      is_hidden_gem: false,
      is_pro_only: false,
    },
    beach: {
      id: 'attr-2',
      slug: 'phuket',
      name: 'Phuket',
      description: 'Beautiful island',
      category: 'beach',
      province: 'Phuket',
      location: 'Andaman Sea',
      categories: { beach: 0.95, nightlife: 0.8, luxury: 0.7 },
      is_hidden_gem: false,
      is_pro_only: false,
    },
    hiddenGem: {
      id: 'attr-3',
      slug: 'secret-waterfall',
      name: 'Secret Waterfall',
      description: 'Hidden gem',
      category: 'nature',
      province: 'Chiang Mai',
      location: 'Hidden Valley',
      categories: { nature: 0.9, adventure: 0.85 },
      is_hidden_gem: true,
      is_pro_only: true,
    },
  },

  userPrefs: {
    backpacker: {
      travelStyle: ['adventure', 'authentic'],
      interests: ['temples', 'food', 'nature'],
      budget: 'budget',
      groupType: 'solo',
    },
    luxuryCouple: {
      travelStyle: ['relaxation', 'luxury'],
      interests: ['beach', 'wellness', 'food'],
      budget: 'luxury',
      groupType: 'couple',
    },
  },
}

/**
 * Create a user fixture with overrides
 */
export function createUser(
  overrides: Partial<typeof fixtures.users.basic> = {}
) {
  return {
    ...fixtures.users.basic,
    user_id: `user-${Date.now()}`,
    ...overrides,
  }
}

/**
 * Create an attraction fixture with overrides
 */
export function createAttraction(
  overrides: Partial<typeof fixtures.attractions.temple> = {}
) {
  return {
    ...fixtures.attractions.temple,
    id: `attr-${Date.now()}`,
    slug: `test-attraction-${Date.now()}`,
    ...overrides,
  }
}
