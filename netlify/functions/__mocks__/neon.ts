import { vi } from 'vitest'

// Storage for mock query results
const mockResults: Map<string, unknown[]> = new Map()
const mockQueryLog: Array<{ query: string; values: unknown[] }> = []
let mockError: Error | null = null

/**
 * Create a NeonQueryResult-like object
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
export const mockNeonSql = vi.fn(
  (strings: TemplateStringsArray, ...values: unknown[]) => {
    if (mockError) {
      return Promise.reject(mockError)
    }

    const query = strings.reduce((acc, str, i) => {
      return acc + str + (i < values.length ? `$${i + 1}` : '')
    }, '')

    mockQueryLog.push({ query, values })

    for (const [pattern, result] of mockResults) {
      if (query.includes(pattern)) {
        if (Array.isArray(result) && !('rows' in result)) {
          return Promise.resolve(createQueryResult(result))
        }
        return Promise.resolve(result)
      }
    }

    return Promise.resolve(createQueryResult([]))
  }
)

/**
 * Mock neon function that returns the sql template function
 */
export const mockNeon = vi.fn(() => mockNeonSql)

/**
 * Set a mock result for queries matching a pattern
 */
export function setMockNeonResult(pattern: string, result: unknown[]): void {
  mockResults.set(pattern, result)
}

/**
 * Clear all mock results
 */
export function clearMockNeonResults(): void {
  mockResults.clear()
  mockQueryLog.length = 0
  mockError = null
}

/**
 * Set an error to be thrown by all queries
 */
export function setMockNeonError(error: Error | null): void {
  mockError = error
}

/**
 * Get logged queries for assertions
 */
export function getMockNeonQueryLog(): Array<{ query: string; values: unknown[] }> {
  return [...mockQueryLog]
}

/**
 * Check if a query was made matching a pattern
 */
export function wasNeonQueryMade(pattern: string): boolean {
  return mockQueryLog.some((log) => log.query.includes(pattern))
}

/**
 * Reset all neon mocks
 */
export function resetNeonMocks(): void {
  clearMockNeonResults()
  mockNeonSql.mockClear()
  mockNeon.mockClear()
}

// Auto-mock the @neondatabase/serverless module
vi.mock('@neondatabase/serverless', () => ({
  neon: mockNeon,
}))

export default {
  mockNeon,
  mockNeonSql,
  setMockNeonResult,
  setMockNeonError,
  clearMockNeonResults,
  getMockNeonQueryLog,
  wasNeonQueryMade,
  resetNeonMocks,
}
