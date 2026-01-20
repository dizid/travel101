import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMockRequest, parseResponse } from './__tests__/helpers'
import { setMockEnv, clearMockEnv } from './__tests__/setup'

// Mock Anthropic
const mockCreate = vi.fn()
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(() => ({
    messages: { create: mockCreate },
  })),
}))

import packingHandler from './packing.mts'

const mockContext = {
  geo: { city: 'Bangkok' },
  ip: '127.0.0.1',
}

const mockPackingListResponse = {
  categories: [
    {
      name: 'Clothing',
      icon: '👕',
      items: [
        { item: 'Light t-shirts', category: 'clothing', priority: 'essential' },
        { item: 'Sarong', category: 'clothing', priority: 'essential', reason: 'For temples' },
      ],
    },
    {
      name: 'Toiletries',
      icon: '🧴',
      items: [
        { item: 'Sunscreen SPF 50+', category: 'toiletries', priority: 'essential' },
      ],
    },
  ],
  tips: ['Pack light - you can buy clothes locally', 'Roll clothes to save space'],
  warnings: ['Avoid camouflage clothing'],
}

describe('packing function', () => {
  beforeEach(() => {
    clearMockEnv()
    vi.clearAllMocks()
  })

  describe('method validation', () => {
    it('should return 405 for GET method', async () => {
      const req = createMockRequest('GET', '/api/packing', { headers: {} })
      const response = await packingHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(405)
      expect(data.error).toBe('Method not allowed')
    })

    it('should return 405 for PUT method', async () => {
      const req = createMockRequest('PUT', '/api/packing', { headers: {}, body: {} })
      const response = await packingHandler(req, mockContext as never)

      expect(response.status).toBe(405)
    })

    it('should return 405 for DELETE method', async () => {
      const req = createMockRequest('DELETE', '/api/packing', { headers: {} })
      const response = await packingHandler(req, mockContext as never)

      expect(response.status).toBe(405)
    })
  })

  describe('configuration validation', () => {
    it('should return 500 when ANTHROPIC_API_KEY is missing', async () => {
      // No API key set
      const req = createMockRequest('POST', '/api/packing', {
        headers: {},
        body: {
          destinations: ['Bangkok'],
          duration: 7,
          activities: ['temples'],
        },
      })

      const response = await packingHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(500)
      expect(data.error).toBe('AI service not configured')
    })
  })

  describe('input validation', () => {
    beforeEach(() => {
      setMockEnv('ANTHROPIC_API_KEY', 'test-key')
    })

    it('should return 400 when destinations is missing', async () => {
      const req = createMockRequest('POST', '/api/packing', {
        headers: {},
        body: {
          duration: 7,
          activities: ['beaches'],
        },
      })

      const response = await packingHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.error).toContain('Destinations')
    })

    it('should return 400 when destinations is empty array', async () => {
      const req = createMockRequest('POST', '/api/packing', {
        headers: {},
        body: {
          destinations: [],
          duration: 7,
          activities: ['beaches'],
        },
      })

      const response = await packingHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.error).toContain('Destinations')
    })

    it('should return 400 when duration is missing', async () => {
      const req = createMockRequest('POST', '/api/packing', {
        headers: {},
        body: {
          destinations: ['Bangkok', 'Phuket'],
          activities: ['beaches'],
        },
      })

      const response = await packingHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.error).toContain('duration')
    })

    it('should return 400 when duration is 0', async () => {
      const req = createMockRequest('POST', '/api/packing', {
        headers: {},
        body: {
          destinations: ['Bangkok'],
          duration: 0,
          activities: ['temples'],
        },
      })

      const response = await packingHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
    })
  })

  describe('successful packing list generation', () => {
    beforeEach(() => {
      setMockEnv('ANTHROPIC_API_KEY', 'test-key')
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(mockPackingListResponse) }],
        usage: { input_tokens: 500, output_tokens: 800 },
      })
    })

    it('should generate packing list for valid request', async () => {
      const req = createMockRequest('POST', '/api/packing', {
        headers: {},
        body: {
          destinations: ['Bangkok', 'Chiang Mai'],
          duration: 10,
          activities: ['temples', 'trekking'],
        },
      })

      const response = await packingHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.packingList).toBeDefined()
      expect(data.packingList.categories).toBeInstanceOf(Array)
      expect(data.packingList.tips).toBeInstanceOf(Array)
      expect(data.packingList.warnings).toBeInstanceOf(Array)
    })

    it('should include trip summary in response', async () => {
      const destinations = ['Phuket', 'Krabi']
      const duration = 14
      const activities = ['beaches', 'diving']

      const req = createMockRequest('POST', '/api/packing', {
        headers: {},
        body: { destinations, duration, activities },
      })

      const response = await packingHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(data.tripSummary).toBeDefined()
      expect(data.tripSummary.destinations).toEqual(destinations)
      expect(data.tripSummary.duration).toBe(duration)
      expect(data.tripSummary.activities).toEqual(activities)
    })

    it('should pass correct prompt to Claude', async () => {
      const req = createMockRequest('POST', '/api/packing', {
        headers: {},
        body: {
          destinations: ['Bangkok'],
          duration: 5,
          activities: ['shopping', 'temples'],
          travelStyle: 'luxury',
          includeTemples: true,
        },
      })

      await packingHandler(req, mockContext as never)

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2048,
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining('Bangkok'),
            }),
          ]),
        })
      )
    })

    it('should include weather info in prompt when provided', async () => {
      const req = createMockRequest('POST', '/api/packing', {
        headers: {},
        body: {
          destinations: ['Bangkok'],
          duration: 7,
          activities: ['sightseeing'],
          weather: {
            avgTemp: 32,
            rainChance: 70,
            isMonsoon: true,
          },
        },
      })

      await packingHandler(req, mockContext as never)

      const callArgs = mockCreate.mock.calls[0][0]
      expect(callArgs.messages[0].content).toContain('32')
      expect(callArgs.messages[0].content).toContain('70')
      expect(callArgs.messages[0].content).toContain('Monsoon')
    })

    it('should handle JSON wrapped in markdown code blocks', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: '```json\n' + JSON.stringify(mockPackingListResponse) + '\n```' }],
        usage: { input_tokens: 500, output_tokens: 800 },
      })

      const req = createMockRequest('POST', '/api/packing', {
        headers: {},
        body: {
          destinations: ['Bangkok'],
          duration: 5,
          activities: [],
        },
      })

      const response = await packingHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.packingList.categories).toBeDefined()
    })
  })

  describe('fallback packing list', () => {
    beforeEach(() => {
      setMockEnv('ANTHROPIC_API_KEY', 'test-key')
    })

    it('should return fallback list when AI returns invalid JSON', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Sorry, I cannot generate a packing list.' }],
        usage: { input_tokens: 100, output_tokens: 50 },
      })

      const req = createMockRequest('POST', '/api/packing', {
        headers: {},
        body: {
          destinations: ['Bangkok'],
          duration: 7,
          activities: ['temples'],
        },
      })

      const response = await packingHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.packingList).toBeDefined()
      expect(data.packingList.categories.length).toBeGreaterThan(0)
    })

    it('should include temple items in fallback when includeTemples is true', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Invalid response' }],
        usage: { input_tokens: 100, output_tokens: 50 },
      })

      const req = createMockRequest('POST', '/api/packing', {
        headers: {},
        body: {
          destinations: ['Bangkok'],
          duration: 7,
          activities: ['temples'],
          includeTemples: true,
        },
      })

      const response = await packingHandler(req, mockContext as never)
      const data = await parseResponse(response)

      const clothingCategory = data.packingList.categories.find(
        (c: { name: string }) => c.name === 'Clothing'
      )
      const sarong = clothingCategory?.items.find(
        (i: { item: string }) => i.item.toLowerCase().includes('sarong')
      )
      expect(sarong).toBeDefined()
    })

    it('should include monsoon items in fallback when isMonsoon is true', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Invalid' }],
        usage: { input_tokens: 100, output_tokens: 50 },
      })

      const req = createMockRequest('POST', '/api/packing', {
        headers: {},
        body: {
          destinations: ['Bangkok'],
          duration: 7,
          activities: [],
          weather: { avgTemp: 30, rainChance: 80, isMonsoon: true },
        },
      })

      const response = await packingHandler(req, mockContext as never)
      const data = await parseResponse(response)

      const accessoriesCategory = data.packingList.categories.find(
        (c: { name: string }) => c.name === 'Accessories'
      )
      const umbrella = accessoriesCategory?.items.find(
        (i: { item: string }) => i.item.toLowerCase().includes('umbrella')
      )
      expect(umbrella).toBeDefined()
      expect(umbrella?.priority).toBe('essential')
    })

    it('should not include temple items when includeTemples is false', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Invalid' }],
        usage: { input_tokens: 100, output_tokens: 50 },
      })

      const req = createMockRequest('POST', '/api/packing', {
        headers: {},
        body: {
          destinations: ['Phuket'],
          duration: 7,
          activities: ['beaches'],
          includeTemples: false,
        },
      })

      const response = await packingHandler(req, mockContext as never)
      const data = await parseResponse(response)

      const clothingCategory = data.packingList.categories.find(
        (c: { name: string }) => c.name === 'Clothing'
      )
      const sarong = clothingCategory?.items.find(
        (i: { item: string }) => i.item.toLowerCase().includes('sarong')
      )
      expect(sarong).toBeUndefined()
    })
  })

  describe('error handling', () => {
    beforeEach(() => {
      setMockEnv('ANTHROPIC_API_KEY', 'test-key')
    })

    it('should return 500 when AI API throws error', async () => {
      mockCreate.mockRejectedValue(new Error('API rate limit exceeded'))

      const req = createMockRequest('POST', '/api/packing', {
        headers: {},
        body: {
          destinations: ['Bangkok'],
          duration: 7,
          activities: [],
        },
      })

      const response = await packingHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to generate packing list')
    })
  })
})
