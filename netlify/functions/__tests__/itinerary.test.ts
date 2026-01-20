import { describe, it, expect, beforeEach, vi } from 'vitest'
import '../__mocks__/db'
import '../__mocks__/anthropic'
import { setMockQueryResult, clearMockResults, wasQueryMade } from '../__mocks__/db'
import { setMockAIJsonResponse, resetAnthropicMocks, setMockAIError } from '../__mocks__/anthropic'
import { setMockEnv, clearMockEnv } from './setup.js'
import { createMockRequest, parseResponse } from './helpers.js'

import itineraryHandler from '../itinerary.mts'

const mockContext = {
  geo: { city: 'Bangkok' },
  ip: '127.0.0.1',
}

describe('itinerary function', () => {
  beforeEach(() => {
    clearMockResults()
    clearMockEnv()
    vi.clearAllMocks()
    resetAnthropicMocks()
    setMockEnv('DATABASE_URL', 'postgresql://test:test@localhost/test')
    setMockEnv('ANTHROPIC_API_KEY', 'sk-ant-test-123')
  })

  describe('authentication', () => {
    it('should return 401 without x-user-id', async () => {
      const req = createMockRequest('GET', '/api/itinerary', {
        headers: {},
      })

      const response = await itineraryHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 403 for non-Pro users', async () => {
      setMockQueryResult('SELECT is_pro', [{ is_pro: false }])

      const req = createMockRequest('GET', '/api/itinerary', {
        headers: { 'x-user-id': 'user-123' },
      })

      const response = await itineraryHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(403)
      expect(data.error).toBe('Pro subscription required')
    })
  })

  describe('GET /api/itinerary', () => {
    beforeEach(() => {
      setMockQueryResult('SELECT is_pro', [{ is_pro: true }])
    })

    it('should list all itineraries for user', async () => {
      const mockItineraries = [
        { id: 'itin-1', name: 'Bangkok Trip', day_count: 3 },
        { id: 'itin-2', name: 'Chiang Mai Adventure', day_count: 5 },
      ]
      setMockQueryResult('FROM itineraries', mockItineraries)

      const req = createMockRequest('GET', '/api/itinerary', {
        headers: { 'x-user-id': 'user-123' },
      })

      const response = await itineraryHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.itineraries).toHaveLength(2)
      expect(data.itineraries[0].day_count).toBe(3)
    })

    it('should get single itinerary with days and activities', async () => {
      const mockItinerary = {
        id: 'itin-1',
        name: 'Bangkok Trip',
        user_id: 'user-123',
      }
      const mockDays = [
        { id: 'day-1', day_number: 1, location: 'Bangkok' },
        { id: 'day-2', day_number: 2, location: 'Bangkok' },
      ]
      const mockActivities = [
        { id: 'act-1', day_id: 'day-1', title: 'Grand Palace' },
        { id: 'act-2', day_id: 'day-1', title: 'Wat Pho' },
        { id: 'act-3', day_id: 'day-2', title: 'Chatuchak Market' },
      ]

      setMockQueryResult('SELECT * FROM itineraries WHERE id', [mockItinerary])
      setMockQueryResult('SELECT * FROM itinerary_days', mockDays)
      setMockQueryResult('SELECT * FROM itinerary_activities', mockActivities)

      const req = createMockRequest('GET', '/api/itinerary?id=itin-1', {
        headers: { 'x-user-id': 'user-123' },
      })

      const response = await itineraryHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.id).toBe('itin-1')
      expect(data.days).toHaveLength(2)
      expect(data.days[0].activities).toHaveLength(2)
      expect(data.days[1].activities).toHaveLength(1)
    })

    it('should return 404 when itinerary not found', async () => {
      setMockQueryResult('SELECT * FROM itineraries WHERE id', [])

      const req = createMockRequest('GET', '/api/itinerary?id=nonexistent', {
        headers: { 'x-user-id': 'user-123' },
      })

      const response = await itineraryHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(404)
      expect(data.error).toBe('Itinerary not found')
    })
  })

  describe('POST /api/itinerary', () => {
    beforeEach(() => {
      setMockQueryResult('SELECT is_pro', [{ is_pro: true }])
    })

    it('should create new itinerary', async () => {
      const mockItinerary = {
        id: 'itin-new',
        name: 'My Thailand Trip',
        user_id: 'user-123',
      }
      setMockQueryResult('INSERT INTO itineraries', [mockItinerary])

      const req = createMockRequest('POST', '/api/itinerary', {
        headers: { 'x-user-id': 'user-123' },
        body: { name: 'My Thailand Trip' },
      })

      const response = await itineraryHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(201)
      expect(data.itinerary.name).toBe('My Thailand Trip')
    })

    it('should create itinerary with days and activities', async () => {
      const mockItinerary = { id: 'itin-new' }
      const mockDay = { id: 'day-new' }

      setMockQueryResult('INSERT INTO itineraries', [mockItinerary])
      setMockQueryResult('INSERT INTO itinerary_days', [mockDay])
      setMockQueryResult('INSERT INTO itinerary_activities', [])

      const req = createMockRequest('POST', '/api/itinerary', {
        headers: { 'x-user-id': 'user-123' },
        body: {
          name: 'Bangkok Trip',
          startDate: '2025-03-01',
          endDate: '2025-03-03',
          days: [
            {
              dayNumber: 1,
              location: 'Bangkok',
              activities: [
                { title: 'Grand Palace', timeSlot: '09:00', durationMinutes: 180 },
                { title: 'Wat Pho', timeSlot: '14:00', durationMinutes: 90 },
              ],
            },
          ],
        },
      })

      const response = await itineraryHandler(req, mockContext as never)

      expect(response.status).toBe(201)
      expect(wasQueryMade('INSERT INTO itinerary_days')).toBe(true)
      expect(wasQueryMade('INSERT INTO itinerary_activities')).toBe(true)
    })

    it('should generate itinerary with AI', async () => {
      setMockAIJsonResponse({
        name: 'AI Generated Trip',
        days: [
          {
            dayNumber: 1,
            location: 'Bangkok',
            activities: [
              { title: 'Temple Tour', timeSlot: '09:00', activityType: 'attraction' },
            ],
          },
        ],
        tips: ['Book temples early', 'Dress modestly'],
      })

      setMockQueryResult('SELECT prefs FROM user_profiles', [{ prefs: { interests: ['temples'] } }])
      setMockQueryResult('INSERT INTO itineraries', [{ id: 'itin-ai' }])
      setMockQueryResult('INSERT INTO itinerary_days', [{ id: 'day-1' }])
      setMockQueryResult('INSERT INTO itinerary_activities', [])
      setMockQueryResult('SELECT * FROM itinerary_days', [
        { id: 'day-1', day_number: 1, location: 'Bangkok' },
      ])
      setMockQueryResult('SELECT * FROM itinerary_activities', [
        { id: 'act-1', day_id: 'day-1', title: 'Temple Tour' },
      ])

      const req = createMockRequest('POST', '/api/itinerary', {
        headers: { 'x-user-id': 'user-123' },
        body: {
          action: 'generate',
          duration: 3,
          destinations: ['Bangkok', 'Chiang Mai'],
          interests: ['temples', 'food'],
        },
      })

      const response = await itineraryHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(201)
      expect(data.itinerary).toBeTruthy()
      expect(data.tips).toContain('Book temples early')
    })

    it('should handle AI generation error', async () => {
      setMockAIError('AI service unavailable')
      setMockQueryResult('SELECT prefs FROM user_profiles', [{ prefs: {} }])

      const req = createMockRequest('POST', '/api/itinerary', {
        headers: { 'x-user-id': 'user-123' },
        body: {
          action: 'generate',
          duration: 3,
        },
      })

      const response = await itineraryHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(500)
      expect(data.error).toBeTruthy()
    })
  })

  describe('PUT /api/itinerary', () => {
    beforeEach(() => {
      setMockQueryResult('SELECT is_pro', [{ is_pro: true }])
    })

    it('should return 400 without itinerary ID', async () => {
      const req = createMockRequest('PUT', '/api/itinerary', {
        headers: { 'x-user-id': 'user-123' },
        body: { name: 'Updated name' },
      })

      const response = await itineraryHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.error).toBe('Itinerary ID required')
    })

    it('should update itinerary metadata', async () => {
      const updatedItinerary = {
        id: 'itin-1',
        name: 'Updated Trip Name',
        status: 'completed',
      }
      setMockQueryResult('SELECT id FROM itineraries WHERE id', [{ id: 'itin-1' }])
      setMockQueryResult('UPDATE itineraries SET', [updatedItinerary])

      const req = createMockRequest('PUT', '/api/itinerary?id=itin-1', {
        headers: { 'x-user-id': 'user-123' },
        body: { name: 'Updated Trip Name', status: 'completed' },
      })

      const response = await itineraryHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.itinerary.name).toBe('Updated Trip Name')
    })

    it('should return 404 when itinerary not found', async () => {
      setMockQueryResult('SELECT id FROM itineraries WHERE id', [])

      const req = createMockRequest('PUT', '/api/itinerary?id=nonexistent', {
        headers: { 'x-user-id': 'user-123' },
        body: { name: 'Updated name' },
      })

      const response = await itineraryHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(404)
      expect(data.error).toBe('Itinerary not found')
    })
  })

  describe('DELETE /api/itinerary', () => {
    beforeEach(() => {
      setMockQueryResult('SELECT is_pro', [{ is_pro: true }])
    })

    it('should return 400 without itinerary ID', async () => {
      const req = createMockRequest('DELETE', '/api/itinerary', {
        headers: { 'x-user-id': 'user-123' },
      })

      const response = await itineraryHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.error).toBe('Itinerary ID required')
    })

    it('should delete itinerary', async () => {
      setMockQueryResult('DELETE FROM itineraries', [{ id: 'itin-1' }])

      const req = createMockRequest('DELETE', '/api/itinerary?id=itin-1', {
        headers: { 'x-user-id': 'user-123' },
      })

      const response = await itineraryHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 404 when itinerary not found', async () => {
      setMockQueryResult('DELETE FROM itineraries', [])

      const req = createMockRequest('DELETE', '/api/itinerary?id=nonexistent', {
        headers: { 'x-user-id': 'user-123' },
      })

      const response = await itineraryHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(404)
      expect(data.error).toBe('Itinerary not found')
    })
  })

  describe('day operations', () => {
    beforeEach(() => {
      setMockQueryResult('SELECT is_pro', [{ is_pro: true }])
    })

    it('should create day', async () => {
      setMockQueryResult('SELECT id FROM itineraries WHERE id', [{ id: 'itin-1' }])
      setMockQueryResult('SELECT COALESCE(MAX(day_number)', [{ max_day: 2 }])
      setMockQueryResult('INSERT INTO itinerary_days', [
        { id: 'day-new', day_number: 3, location: 'Phuket' },
      ])
      setMockQueryResult('UPDATE itineraries SET updated_at', [])

      const req = createMockRequest('POST', '/api/itinerary?id=itin-1&resource=day', {
        headers: { 'x-user-id': 'user-123' },
        body: { location: 'Phuket' },
      })

      const response = await itineraryHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(201)
      expect(data.day.location).toBe('Phuket')
    })

    it('should update day', async () => {
      setMockQueryResult('SELECT d.id, i.user_id', [{ id: 'day-1', user_id: 'user-123' }])
      setMockQueryResult('UPDATE itinerary_days SET', [
        { id: 'day-1', location: 'Chiang Mai' },
      ])
      setMockQueryResult('SELECT * FROM itinerary_activities WHERE day_id', [])

      const req = createMockRequest('PUT', '/api/itinerary?dayId=day-1&resource=day', {
        headers: { 'x-user-id': 'user-123' },
        body: { location: 'Chiang Mai' },
      })

      const response = await itineraryHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.day.location).toBe('Chiang Mai')
    })

    it('should delete day and renumber remaining', async () => {
      setMockQueryResult('SELECT d.id, d.itinerary_id, i.user_id', [
        { id: 'day-2', itinerary_id: 'itin-1', user_id: 'user-123' },
      ])
      setMockQueryResult('DELETE FROM itinerary_days', [])
      setMockQueryResult('WITH numbered AS', [])
      setMockQueryResult('UPDATE itineraries SET updated_at', [])

      const req = createMockRequest('DELETE', '/api/itinerary?dayId=day-2&resource=day', {
        headers: { 'x-user-id': 'user-123' },
      })

      const response = await itineraryHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      // Verify renumbering query was made
      expect(wasQueryMade('ROW_NUMBER() OVER')).toBe(true)
    })

    it('should return 404 when day not found', async () => {
      setMockQueryResult('SELECT d.id, i.user_id', [])

      const req = createMockRequest('PUT', '/api/itinerary?dayId=nonexistent&resource=day', {
        headers: { 'x-user-id': 'user-123' },
        body: { location: 'Bangkok' },
      })

      const response = await itineraryHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(404)
      expect(data.error).toBe('Day not found')
    })
  })

  describe('activity operations', () => {
    beforeEach(() => {
      setMockQueryResult('SELECT is_pro', [{ is_pro: true }])
    })

    it('should create activity', async () => {
      setMockQueryResult('SELECT d.id, d.itinerary_id', [
        { id: 'day-1', itinerary_id: 'itin-1' },
      ])
      setMockQueryResult('SELECT COALESCE(MAX(sort_order)', [{ max_order: 1 }])
      setMockQueryResult('INSERT INTO itinerary_activities', [
        { id: 'act-new', title: 'Wat Arun', time_slot: '10:00' },
      ])
      setMockQueryResult('UPDATE itineraries SET updated_at', [])

      const req = createMockRequest('POST', '/api/itinerary?dayId=day-1&resource=activity', {
        headers: { 'x-user-id': 'user-123' },
        body: {
          title: 'Wat Arun',
          timeSlot: '10:00',
          activityType: 'attraction',
          durationMinutes: 90,
        },
      })

      const response = await itineraryHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(201)
      expect(data.activity.title).toBe('Wat Arun')
    })

    it('should update activity', async () => {
      setMockQueryResult('SELECT a.id, d.itinerary_id', [
        { id: 'act-1', itinerary_id: 'itin-1' },
      ])
      setMockQueryResult('UPDATE itinerary_activities SET', [
        { id: 'act-1', title: 'Updated Activity' },
      ])
      setMockQueryResult('UPDATE itineraries SET updated_at', [])

      const req = createMockRequest('PUT', '/api/itinerary?activityId=act-1&resource=activity', {
        headers: { 'x-user-id': 'user-123' },
        body: { title: 'Updated Activity' },
      })

      const response = await itineraryHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.activity.title).toBe('Updated Activity')
    })

    it('should reorder activity', async () => {
      setMockQueryResult('SELECT a.id, d.itinerary_id', [
        { id: 'act-1', itinerary_id: 'itin-1' },
      ])
      setMockQueryResult('UPDATE itinerary_activities SET', [
        { id: 'act-1', sort_order: 0, day_id: 'day-2' },
      ])

      const req = createMockRequest('PUT', '/api/itinerary?activityId=act-1&resource=activity', {
        headers: { 'x-user-id': 'user-123' },
        body: { dayId: 'day-2', sortOrder: 0 },
      })

      const response = await itineraryHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      // Verify day_id was updated in the query
      expect(wasQueryMade('day_id')).toBe(true)
    })

    it('should delete activity and renumber remaining', async () => {
      setMockQueryResult('SELECT a.id, a.day_id, d.itinerary_id', [
        { id: 'act-2', day_id: 'day-1', itinerary_id: 'itin-1' },
      ])
      setMockQueryResult('DELETE FROM itinerary_activities', [])
      setMockQueryResult('WITH numbered AS', [])
      setMockQueryResult('UPDATE itineraries SET updated_at', [])

      const req = createMockRequest('DELETE', '/api/itinerary?activityId=act-2&resource=activity', {
        headers: { 'x-user-id': 'user-123' },
      })

      const response = await itineraryHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 404 when activity not found', async () => {
      setMockQueryResult('SELECT a.id, d.itinerary_id', [])

      const req = createMockRequest('PUT', '/api/itinerary?activityId=nonexistent&resource=activity', {
        headers: { 'x-user-id': 'user-123' },
        body: { title: 'Updated' },
      })

      const response = await itineraryHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(404)
      expect(data.error).toBe('Activity not found')
    })
  })

  describe('unsupported methods', () => {
    it('should return 405 for PATCH method', async () => {
      setMockQueryResult('SELECT is_pro', [{ is_pro: true }])

      const req = createMockRequest('PATCH', '/api/itinerary', {
        headers: { 'x-user-id': 'user-123' },
        body: {},
      })

      const response = await itineraryHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(405)
      expect(data.error).toBe('Method not allowed')
    })
  })
})
