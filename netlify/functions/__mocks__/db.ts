import { vi } from 'vitest'

// Storage for mock query results
const mockResults: Map<string, unknown[]> = new Map()
const mockQueryLog: Array<{ query: string; values: unknown[] }> = []
let mockError: Error | null = null

/**
 * Create a NeonQueryResult-like object that works both as an array
 * and has .rows property (for compatibility with both usage patterns)
 */
function createQueryResult<T>(rows: T[]): T[] & { rows: T[]; rowCount: number } {
  const result = [...rows] as T[] & { rows: T[]; rowCount: number }
  result.rows = rows
  result.rowCount = rows.length
  return result
}

/**
 * Mock tagged template function that mimics Neon's SQL function
 */
export const mockSql = vi.fn(
  (strings: TemplateStringsArray, ...values: unknown[]) => {
    // If an error is set, throw it
    if (mockError) {
      return Promise.reject(mockError)
    }

    // Build the query string
    const query = strings.reduce((acc, str, i) => {
      return acc + str + (i < values.length ? `$${i + 1}` : '')
    }, '')

    // Log the query for assertions
    mockQueryLog.push({ query, values })

    // Look for matching mock result
    for (const [pattern, result] of mockResults) {
      if (query.includes(pattern)) {
        // Wrap raw arrays in NeonQueryResult format
        if (Array.isArray(result) && !('rows' in result)) {
          return Promise.resolve(createQueryResult(result))
        }
        return Promise.resolve(result)
      }
    }

    // Default empty result
    return Promise.resolve(createQueryResult([]))
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
  mockError = null
}

/**
 * Set an error to be thrown by all queries
 */
export function setMockQueryError(error: Error | null): void {
  mockError = error
}

/**
 * Get logged queries for assertions
 */
export function getMockQueryLog(): Array<{ query: string; values: unknown[] }> {
  return [...mockQueryLog]
}

/**
 * Check if a query was made matching a pattern (searches both query and values)
 */
export function wasQueryMade(pattern: string): boolean {
  return mockQueryLog.some((log) => {
    // Check if pattern is in the query string
    if (log.query.includes(pattern)) return true
    // Check if pattern is in any of the values
    return log.values.some(val =>
      val !== null && val !== undefined && String(val).includes(pattern)
    )
  })
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
 * Create the mock db object with both direct call and .sql property support
 * This supports both:
 * - db`query` (subscription.mts pattern)
 * - db.sql`query` (ai.mts pattern)
 */
const mockDb = Object.assign(mockSql, { sql: mockSql })

/**
 * Mock getDb function
 */
export const mockGetDb = vi.fn(() => mockDb)

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
  setMockQueryError,
  clearMockResults,
  getMockQueryLog,
  wasQueryMade,
  getQueriesMatching,
  resetDbMocks,
}
