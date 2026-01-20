import { describe, it, expect, beforeEach, vi } from 'vitest'
import './__mocks__/db'
import { setMockQueryResult, clearMockResults, wasQueryMade } from './__mocks__/db'
import { setMockEnv, clearMockEnv } from './__tests__/setup'
import { createMockRequest, parseResponse } from './__tests__/helpers'

import matchesHandler from './matches.mts'

const mockContext = {
  geo: { city: 'Bangkok' },
  ip: '127.0.0.1',
}

describe('matches function', () => {
  beforeEach(() => {
    clearMockResults()
    clearMockEnv()
    vi.clearAllMocks()
    setMockEnv('DATABASE_URL', 'postgresql://test:test@localhost/test')
  })

  describe('authentication', () => {
    it('should return 401 without x-user-id', async () => {
      const req = createMockRequest('GET', '/api/matches', {
        headers: {},
      })

      const response = await matchesHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 403 for non-Pro users', async () => {
      setMockQueryResult('SELECT is_pro', [{ is_pro: false }])

      const req = createMockRequest('GET', '/api/matches', {
        headers: { 'x-user-id': 'user-123' },
      })

      const response = await matchesHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(403)
      expect(data.error).toBe('Pro subscription required')
    })

    it('should return 403 when user not found', async () => {
      setMockQueryResult('SELECT is_pro', [])

      const req = createMockRequest('GET', '/api/matches', {
        headers: { 'x-user-id': 'nonexistent' },
      })

      const response = await matchesHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(403)
      expect(data.error).toBe('Pro subscription required')
    })
  })

  describe('GET /api/matches', () => {
    beforeEach(() => {
      setMockQueryResult('SELECT is_pro', [{ is_pro: true }])
    })

    it('should list all saved matches with attraction info', async () => {
      const mockMatches = [
        {
          id: 'match-1',
          user_id: 'user-123',
          attraction_slug: 'wat-phra-kaew',
          match_score: 0.95,
          attraction_name: 'Wat Phra Kaew',
          province: 'Bangkok',
          category: 'temple',
          is_hidden_gem: false,
        },
        {
          id: 'match-2',
          user_id: 'user-123',
          attraction_slug: 'secret-waterfall',
          match_score: 0.87,
          attraction_name: 'Secret Waterfall',
          province: 'Chiang Mai',
          category: 'nature',
          is_hidden_gem: true,
        },
      ]
      setMockQueryResult('SELECT', mockMatches)

      const req = createMockRequest('GET', '/api/matches', {
        headers: { 'x-user-id': 'user-123' },
      })

      const response = await matchesHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.matches).toHaveLength(2)
      expect(data.slugs).toEqual(['wat-phra-kaew', 'secret-waterfall'])
      expect(data.matches[0].attraction_name).toBe('Wat Phra Kaew')
    })

    it('should return empty array when no matches exist', async () => {
      setMockQueryResult('SELECT', [])

      const req = createMockRequest('GET', '/api/matches', {
        headers: { 'x-user-id': 'user-123' },
      })

      const response = await matchesHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.matches).toEqual([])
      expect(data.slugs).toEqual([])
    })

    it('should join with attractions table', async () => {
      setMockQueryResult('SELECT', [])

      const req = createMockRequest('GET', '/api/matches', {
        headers: { 'x-user-id': 'user-123' },
      })

      await matchesHandler(req, mockContext as never)

      expect(wasQueryMade('JOIN attractions')).toBe(true)
    })
  })

  describe('POST /api/matches', () => {
    beforeEach(() => {
      setMockQueryResult('SELECT is_pro', [{ is_pro: true }])
    })

    it('should return 400 when slug is missing', async () => {
      const req = createMockRequest('POST', '/api/matches', {
        headers: { 'x-user-id': 'user-123' },
        body: {},
      })

      const response = await matchesHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.error).toBe('Attraction slug required')
    })

    it('should return 404 when attraction does not exist', async () => {
      setMockQueryResult('SELECT slug FROM attractions', [])

      const req = createMockRequest('POST', '/api/matches', {
        headers: { 'x-user-id': 'user-123' },
        body: { slug: 'nonexistent-attraction' },
      })

      const response = await matchesHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(404)
      expect(data.error).toBe('Attraction not found')
    })

    it('should prevent duplicate matches', async () => {
      setMockQueryResult('SELECT slug FROM attractions', [{ slug: 'wat-phra-kaew' }])
      setMockQueryResult('SELECT id FROM saved_matches', [{ id: 'existing-match' }])

      const req = createMockRequest('POST', '/api/matches', {
        headers: { 'x-user-id': 'user-123' },
        body: { slug: 'wat-phra-kaew' },
      })

      const response = await matchesHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.message).toBe('Already saved')
      expect(data.id).toBe('existing-match')
    })

    it('should save new match', async () => {
      const mockSavedMatch = {
        id: 'match-new',
        user_id: 'user-123',
        attraction_slug: 'phuket',
        match_score: 0.92,
        match_reason: 'Perfect for beach lovers',
      }
      setMockQueryResult('SELECT slug FROM attractions', [{ slug: 'phuket' }])
      setMockQueryResult('SELECT id FROM saved_matches', [])
      setMockQueryResult('INSERT INTO saved_matches', [mockSavedMatch])

      const req = createMockRequest('POST', '/api/matches', {
        headers: { 'x-user-id': 'user-123' },
        body: {
          slug: 'phuket',
          matchScore: 0.92,
          matchReason: 'Perfect for beach lovers',
        },
      })

      const response = await matchesHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(201)
      expect(data.match).toBeTruthy()
      expect(data.match.attraction_slug).toBe('phuket')
    })

    it('should save match with notes', async () => {
      setMockQueryResult('SELECT slug FROM attractions', [{ slug: 'phuket' }])
      setMockQueryResult('SELECT id FROM saved_matches', [])
      setMockQueryResult('INSERT INTO saved_matches', [
        { id: 'match-new', notes: 'Visit in November' },
      ])

      const req = createMockRequest('POST', '/api/matches', {
        headers: { 'x-user-id': 'user-123' },
        body: {
          slug: 'phuket',
          notes: 'Visit in November',
        },
      })

      const response = await matchesHandler(req, mockContext as never)

      expect(response.status).toBe(201)
      expect(wasQueryMade('notes')).toBe(true)
    })

    it('should accept slug from query param', async () => {
      setMockQueryResult('SELECT slug FROM attractions', [{ slug: 'phuket' }])
      setMockQueryResult('SELECT id FROM saved_matches', [])
      setMockQueryResult('INSERT INTO saved_matches', [{ id: 'match-new' }])

      const req = createMockRequest('POST', '/api/matches?slug=phuket', {
        headers: { 'x-user-id': 'user-123' },
        body: {},
      })

      const response = await matchesHandler(req, mockContext as never)

      expect(response.status).toBe(201)
    })
  })

  describe('DELETE /api/matches', () => {
    beforeEach(() => {
      setMockQueryResult('SELECT is_pro', [{ is_pro: true }])
    })

    it('should return 400 when slug is missing', async () => {
      const req = createMockRequest('DELETE', '/api/matches', {
        headers: { 'x-user-id': 'user-123' },
      })

      const response = await matchesHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.error).toBe('Attraction slug required')
    })

    it('should return 404 when match not found', async () => {
      setMockQueryResult('DELETE FROM saved_matches', [])

      const req = createMockRequest('DELETE', '/api/matches?slug=nonexistent', {
        headers: { 'x-user-id': 'user-123' },
        body: {},
      })

      const response = await matchesHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(404)
      expect(data.error).toBe('Match not found')
    })

    it('should delete match', async () => {
      setMockQueryResult('DELETE FROM saved_matches', [{ id: 'match-1' }])

      const req = createMockRequest('DELETE', '/api/matches?slug=wat-phra-kaew', {
        headers: { 'x-user-id': 'user-123' },
        body: {},
      })

      const response = await matchesHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should verify user ownership when deleting', async () => {
      setMockQueryResult('DELETE FROM saved_matches', [{ id: 'match-1' }])

      const req = createMockRequest('DELETE', '/api/matches', {
        headers: { 'x-user-id': 'user-123' },
        body: { slug: 'phuket' },
      })

      await matchesHandler(req, mockContext as never)

      expect(wasQueryMade('user_id')).toBe(true)
      expect(wasQueryMade('attraction_slug')).toBe(true)
    })
  })

  describe('unsupported methods', () => {
    it('should return 405 for PUT method', async () => {
      setMockQueryResult('SELECT is_pro', [{ is_pro: true }])

      const req = createMockRequest('PUT', '/api/matches', {
        headers: { 'x-user-id': 'user-123' },
        body: {},
      })

      const response = await matchesHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(405)
      expect(data.error).toBe('Method not allowed')
    })
  })
})
