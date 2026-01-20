import { vi } from 'vitest'

// Storage for mock query results
const mockResults: Map<string, unknown[]> = new Map()
const mockQueryLog: Array<{ query: string; values: unknown[] }> = []

/**
 * Mock tagged template function that mimics Neon's SQL function
 */
export const mockSql = vi.fn(
  (strings: TemplateStringsArray, ...values: unknown[]) => {
    // Build the query string
    const query = strings.reduce((acc, str, i) => {
      return acc + str + (i < values.length ? `$${i + 1}` : '')
    }, '')

    // Log the query for assertions
    mockQueryLog.push({ query, values })

    // Look for matching mock result
    for (const [pattern, result] of mockResults) {
      if (query.includes(pattern)) {
        return Promise.resolve(result)
      }
    }

    // Default empty result
    return Promise.resolve([])
  }
)

/**
 * Set a mock result for queries matching a pattern
 */
export function setMockQueryResult(pattern: string, result: unknown[]): void {
  mockResults.set(pattern, result)
}

/**
 * Clear all mock results
 */
export function clearMockResults(): void {
  mockResults.clear()
  mockQueryLog.length = 0
}

/**
 * Get logged queries for assertions
 */
export function getMockQueryLog(): Array<{ query: string; values: unknown[] }> {
  return [...mockQueryLog]
}

/**
 * Check if a query was made matching a pattern
 */
export function wasQueryMade(pattern: string): boolean {
  return mockQueryLog.some((log) => log.query.includes(pattern))
}

/**
 * Get queries matching a pattern
 */
export function getQueriesMatching(
  pattern: string
): Array<{ query: string; values: unknown[] }> {
  return mockQueryLog.filter((log) => log.query.includes(pattern))
}

/**
 * Mock getDb function
 */
export const mockGetDb = vi.fn(() => mockSql)

/**
 * Mock the db module
 */
vi.mock('../lib/db.mts', () => ({
  getDb: mockGetDb,
}))

/**
 * Reset all db mocks
 */
export function resetDbMocks(): void {
  clearMockResults()
  mockSql.mockClear()
  mockGetDb.mockClear()
}

export default {
  mockSql,
  mockGetDb,
  setMockQueryResult,
  clearMockResults,
  getMockQueryLog,
  wasQueryMade,
  getQueriesMatching,
  resetDbMocks,
}
