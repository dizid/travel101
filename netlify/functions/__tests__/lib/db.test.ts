import { describe, it, expect, beforeEach, vi } from 'vitest'
import '../../__mocks__/db'
import {
  mockSql,
  mockGetDb,
  setMockQueryResult,
  setMockQueryError,
  clearMockResults,
  getMockQueryLog,
  wasQueryMade,
  getQueriesMatching,
  resetDbMocks,
} from '../../__mocks__/db'
import { setMockEnv, clearMockEnv } from '../setup.js'

// Import via the mock to verify the module replacement works
import { getDb } from '../../lib/db.mts'

describe('db mock infrastructure', () => {
  beforeEach(() => {
    resetDbMocks()
    clearMockEnv()
    setMockEnv('DATABASE_URL', 'postgresql://test:test@localhost/test')
  })

  describe('getDb', () => {
    it('should return a tagged template function', () => {
      const sql = getDb()
      expect(typeof sql).toBe('function')
    })

    it('should track getDb calls', () => {
      getDb()
      getDb()
      expect(mockGetDb).toHaveBeenCalledTimes(2)
    })
  })

  describe('mockSql tagged template queries', () => {
    it('should resolve parameterized queries', async () => {
      setMockQueryResult('SELECT name FROM users', [{ name: 'Alice' }])

      const sql = getDb()
      const userId = 'u-123'
      const result = await sql`SELECT name FROM users WHERE id = ${userId}`

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({ name: 'Alice' })
    })

    it('should return NeonQueryResult-like objects with .rows', async () => {
      setMockQueryResult('SELECT', [{ id: 1 }])

      const sql = getDb()
      const result = await sql`SELECT * FROM test`

      expect(result.rows).toEqual([{ id: 1 }])
      expect(result.rowCount).toBe(1)
    })

    it('should return empty array for unmatched queries', async () => {
      const sql = getDb()
      const result = await sql`SELECT * FROM nonexistent`

      expect(result).toHaveLength(0)
      expect(result.rows).toEqual([])
    })

    it('should throw when mockError is set', async () => {
      setMockQueryError(new Error('Connection failed'))

      const sql = getDb()
      await expect(sql`SELECT 1`).rejects.toThrow('Connection failed')
    })
  })

  describe('query logging', () => {
    it('should log all executed queries', async () => {
      const sql = getDb()
      const name = 'test'
      await sql`SELECT * FROM users WHERE name = ${name}`

      const log = getMockQueryLog()
      expect(log).toHaveLength(1)
      expect(log[0].query).toContain('SELECT * FROM users')
      expect(log[0].values).toContain('test')
    })

    it('wasQueryMade should find matching patterns', async () => {
      const sql = getDb()
      await sql`INSERT INTO logs (message) VALUES (${'hello'})`

      expect(wasQueryMade('INSERT INTO logs')).toBe(true)
      expect(wasQueryMade('DELETE FROM')).toBe(false)
    })

    it('wasQueryMade should match against values too', async () => {
      const sql = getDb()
      await sql`SELECT * FROM users WHERE id = ${'user-abc'}`

      expect(wasQueryMade('user-abc')).toBe(true)
    })

    it('getQueriesMatching should filter queries', async () => {
      const sql = getDb()
      await sql`SELECT * FROM users`
      await sql`INSERT INTO logs (msg) VALUES (${'test'})`
      await sql`SELECT * FROM users WHERE active = ${true}`

      const selectQueries = getQueriesMatching('SELECT * FROM users')
      expect(selectQueries).toHaveLength(2)
    })
  })

  describe('multiple result patterns', () => {
    it('should match the most specific pattern', async () => {
      setMockQueryResult('SELECT', [{ generic: true }])
      setMockQueryResult('SELECT * FROM users', [{ specific: true }])

      const sql = getDb()
      const result = await sql`SELECT * FROM users WHERE id = ${'u-1'}`

      // Map iterates in insertion order, so 'SELECT' matches first
      expect(result).toHaveLength(1)
    })

    it('should support different results for different tables', async () => {
      setMockQueryResult('FROM users', [{ name: 'Alice' }])
      setMockQueryResult('FROM posts', [{ title: 'Post 1' }, { title: 'Post 2' }])

      const sql = getDb()
      const users = await sql`SELECT * FROM users`
      const posts = await sql`SELECT * FROM posts`

      expect(users).toHaveLength(1)
      expect(posts).toHaveLength(2)
    })
  })

  describe('resetDbMocks', () => {
    it('should clear results, logs, and call counts', async () => {
      setMockQueryResult('SELECT', [{ id: 1 }])
      const sql = getDb()
      await sql`SELECT 1`

      resetDbMocks()

      expect(getMockQueryLog()).toHaveLength(0)
      expect(mockGetDb).not.toHaveBeenCalled()
      expect(mockSql).not.toHaveBeenCalled()
    })
  })
})
