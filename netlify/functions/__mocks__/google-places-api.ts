import { vi } from 'vitest'

/**
 * Mock Google Place result
 */
export interface MockGooglePlaceResult {
  id: string
  displayName: {
    text: string
    languageCode: string
  }
  formattedAddress?: string
  shortFormattedAddress?: string
  location?: {
    latitude: number
    longitude: number
  }
  rating?: number
  userRatingCount?: number
  priceLevel?: string
  types?: string[]
  primaryType?: string
  primaryTypeDisplayName?: {
    text: string
    languageCode: string
  }
  editorialSummary?: {
    text: string
    languageCode: string
  }
  websiteUri?: string
  googleMapsUri?: string
  regularOpeningHours?: {
    openNow?: boolean
    weekdayDescriptions?: string[]
  }
  internationalPhoneNumber?: string
  businessStatus?: string
}

/**
 * Mock search response
 */
export interface MockGooglePlacesSearchResponse {
  places?: MockGooglePlaceResult[]
  nextPageToken?: string
}

// Default mock place
export const mockGooglePlaceResult: MockGooglePlaceResult = {
  id: 'ChIJ_test_place_id',
  displayName: { text: 'Grand Palace', languageCode: 'en' },
  formattedAddress: '1 Phra Borom Maha Ratchawang, Bangkok 10200, Thailand',
  shortFormattedAddress: 'Grand Palace, Bangkok',
  location: { latitude: 13.7500, longitude: 100.4913 },
  rating: 4.7,
  userRatingCount: 50000,
  types: ['tourist_attraction', 'museum', 'historical_landmark'],
  primaryType: 'tourist_attraction',
  primaryTypeDisplayName: { text: 'Tourist Attraction', languageCode: 'en' },
  editorialSummary: {
    text: 'Former residence of Thai kings and home to the Temple of the Emerald Buddha.',
    languageCode: 'en'
  },
  websiteUri: 'https://www.royalgrandpalace.th',
  googleMapsUri: 'https://maps.google.com/?cid=123456789',
  businessStatus: 'OPERATIONAL',
}

// Store for mock responses
let mockSearchResponse: MockGooglePlacesSearchResponse = { places: [mockGooglePlaceResult] }
let mockDetailsResponse: MockGooglePlaceResult = mockGooglePlaceResult
let mockError: Error | null = null

// Track fetch calls
const fetchCalls: Array<{ url: string; options: RequestInit }> = []

/**
 * Set mock search response
 */
export function setMockSearchResponse(response: MockGooglePlacesSearchResponse): void {
  mockSearchResponse = response
}

/**
 * Set mock details response
 */
export function setMockDetailsResponse(response: MockGooglePlaceResult): void {
  mockDetailsResponse = response
}

/**
 * Set error to be thrown
 */
export function setMockGoogleApiError(error: Error | null): void {
  mockError = error
}

/**
 * Get all fetch calls made
 */
export function getMockFetchCalls(): Array<{ url: string; options: RequestInit }> {
  return [...fetchCalls]
}

/**
 * Clear all mocks
 */
export function clearGooglePlacesMocks(): void {
  mockSearchResponse = { places: [mockGooglePlaceResult] }
  mockDetailsResponse = mockGooglePlaceResult
  mockError = null
  fetchCalls.length = 0
}

/**
 * Create mock places for testing
 */
export function createMockPlace(overrides: Partial<MockGooglePlaceResult> = {}): MockGooglePlaceResult {
  return {
    ...mockGooglePlaceResult,
    id: `ChIJ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...overrides,
  }
}

/**
 * Create a batch of mock places
 */
export function createMockPlaces(count: number, template?: Partial<MockGooglePlaceResult>): MockGooglePlaceResult[] {
  return Array.from({ length: count }, (_, i) => createMockPlace({
    ...template,
    id: `ChIJ_test_${i}`,
    displayName: { text: `Test Place ${i}`, languageCode: 'en' },
    ...template,
  }))
}

/**
 * Setup global fetch mock for Google Places API
 */
export function setupGooglePlacesFetchMock(): void {
  const originalFetch = globalThis.fetch

  globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input.toString()

    // Record the call
    fetchCalls.push({ url, options: init || {} })

    // Check for error
    if (mockError) {
      return Promise.resolve(new Response(mockError.message, { status: 500 }))
    }

    // Handle Google Places search endpoint
    if (url.includes('places.googleapis.com/v1/places:searchText')) {
      return Promise.resolve(new Response(JSON.stringify(mockSearchResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))
    }

    // Handle Google Places details endpoint
    if (url.includes('places.googleapis.com/v1/places/')) {
      return Promise.resolve(new Response(JSON.stringify(mockDetailsResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))
    }

    // Fall through to original fetch for other requests
    return originalFetch(input, init)
  }) as typeof fetch
}

/**
 * Restore original fetch
 */
export function restoreGooglePlacesFetch(): void {
  vi.restoreAllMocks()
}

export default {
  mockGooglePlaceResult,
  setMockSearchResponse,
  setMockDetailsResponse,
  setMockGoogleApiError,
  getMockFetchCalls,
  clearGooglePlacesMocks,
  createMockPlace,
  createMockPlaces,
  setupGooglePlacesFetchMock,
  restoreGooglePlacesFetch,
}
