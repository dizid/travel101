import { describe, it, expect, beforeEach, vi } from 'vitest'
import './__mocks__/db'
import './__mocks__/anthropic'
import { setMockQueryResult, clearMockResults, wasQueryMade } from './__mocks__/db'
import { setMockAIResponse, resetAnthropicMocks, setMockAIError, mockAnthropic } from './__mocks__/anthropic'
import { setMockEnv, clearMockEnv } from './__tests__/setup'
import { createMockRequest, parseResponse } from './__tests__/helpers'

import attractionAiHandler from './attraction-ai.mts'

const mockContext = {
  geo: { city: 'Bangkok' },
  ip: '127.0.0.1',
}

const mockAttraction = {
  id: 'attr-1',
  slug: 'wat-phra-kaew',
  name: 'Wat Phra Kaew',
  description: 'Temple of the Emerald Buddha',
  about: 'The most sacred Buddhist temple in Thailand',
  category: 'temple',
  location: 'Grand Palace',
  province: 'Bangkok',
  categories: { culture: 0.95, history: 0.85, photography: 0.7 },
}

const mockUserProfile = {
  nationality: 'US',
  tripType: 'holiday',
  travelStyle: ['culture', 'authentic'],
  budget: 'mid',
  interests: ['temples', 'history'],
  groupType: 'couple',
}

describe('attraction-ai function', () => {
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
      const req = createMockRequest('POST', '/api/attraction-ai', {
        headers: {},
        body: { action: 'personalized_intro', attractionSlug: 'wat-phra-kaew' },
      })

      const response = await attractionAiHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized - login required for AI features')
    })
  })

  describe('method validation', () => {
    it('should return 405 for GET method', async () => {
      const req = createMockRequest('GET', '/api/attraction-ai', {
        headers: { 'x-user-id': 'user-123' },
      })

      const response = await attractionAiHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(405)
      expect(data.error).toBe('Method not allowed')
    })

    it('should return 405 for PUT method', async () => {
      const req = createMockRequest('PUT', '/api/attraction-ai', {
        headers: { 'x-user-id': 'user-123' },
        body: {},
      })

      const response = await attractionAiHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(405)
      expect(data.error).toBe('Method not allowed')
    })
  })

  describe('configuration', () => {
    it('should return 500 when ANTHROPIC_API_KEY is missing', async () => {
      clearMockEnv()
      setMockEnv('DATABASE_URL', 'postgresql://test:test@localhost/test')

      const req = createMockRequest('POST', '/api/attraction-ai', {
        headers: { 'x-user-id': 'user-123' },
        body: { action: 'personalized_intro', attractionSlug: 'wat-phra-kaew' },
      })

      const response = await attractionAiHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(500)
      expect(data.error).toBe('AI service not configured')
    })
  })

  describe('request validation', () => {
    it('should return 400 when action is missing', async () => {
      const req = createMockRequest('POST', '/api/attraction-ai', {
        headers: { 'x-user-id': 'user-123' },
        body: { attractionSlug: 'wat-phra-kaew' },
      })

      const response = await attractionAiHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.error).toBe('action and attractionSlug are required')
    })

    it('should return 400 when attractionSlug is missing', async () => {
      const req = createMockRequest('POST', '/api/attraction-ai', {
        headers: { 'x-user-id': 'user-123' },
        body: { action: 'personalized_intro' },
      })

      const response = await attractionAiHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.error).toBe('action and attractionSlug are required')
    })

    it('should return 404 when attraction not found', async () => {
      setMockQueryResult('SELECT id, slug', [])

      const req = createMockRequest('POST', '/api/attraction-ai', {
        headers: { 'x-user-id': 'user-123' },
        body: { action: 'personalized_intro', attractionSlug: 'nonexistent' },
      })

      const response = await attractionAiHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(404)
      expect(data.error).toBe('Attraction not found')
    })

    it('should return 400 for invalid action', async () => {
      setMockQueryResult('SELECT id, slug', [mockAttraction])

      const req = createMockRequest('POST', '/api/attraction-ai', {
        headers: { 'x-user-id': 'user-123' },
        body: { action: 'invalid_action', attractionSlug: 'wat-phra-kaew' },
      })

      const response = await attractionAiHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid action')
    })
  })

  describe('personalized_intro action', () => {
    it('should return 400 when user profile is missing', async () => {
      setMockQueryResult('SELECT id, slug', [mockAttraction])

      const req = createMockRequest('POST', '/api/attraction-ai', {
        headers: { 'x-user-id': 'user-123' },
        body: { action: 'personalized_intro', attractionSlug: 'wat-phra-kaew' },
      })

      const response = await attractionAiHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.error).toBe('User profile required for personalized intro')
    })

    it('should return 400 when user profile is empty', async () => {
      setMockQueryResult('SELECT id, slug', [mockAttraction])

      const req = createMockRequest('POST', '/api/attraction-ai', {
        headers: { 'x-user-id': 'user-123' },
        body: {
          action: 'personalized_intro',
          attractionSlug: 'wat-phra-kaew',
          userProfile: {},
        },
      })

      const response = await attractionAiHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.error).toBe('User profile required for personalized intro')
    })

    it('should generate personalized intro', async () => {
      setMockQueryResult('SELECT id, slug', [mockAttraction])
      setMockAIResponse('This is perfect for you because the temple offers deep cultural immersion perfect for history enthusiasts.')

      const req = createMockRequest('POST', '/api/attraction-ai', {
        headers: { 'x-user-id': 'user-123' },
        body: {
          action: 'personalized_intro',
          attractionSlug: 'wat-phra-kaew',
          userProfile: mockUserProfile,
        },
      })

      const response = await attractionAiHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.response).toContain('perfect for you')
      expect(data.usage).toBeTruthy()
      expect(data.usage.inputTokens).toBe(100)
      expect(data.usage.outputTokens).toBe(50)
    })

    it('should include user profile in AI request', async () => {
      setMockQueryResult('SELECT id, slug', [mockAttraction])
      setMockAIResponse('Personalized response')

      const req = createMockRequest('POST', '/api/attraction-ai', {
        headers: { 'x-user-id': 'user-123' },
        body: {
          action: 'personalized_intro',
          attractionSlug: 'wat-phra-kaew',
          userProfile: mockUserProfile,
        },
      })

      await attractionAiHandler(req, mockContext as never)

      expect(mockAnthropic.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            expect.objectContaining({
              content: expect.stringContaining('Nationality: US'),
            }),
          ],
        })
      )
    })
  })

  describe('tailored_tips action', () => {
    it('should return 400 when user profile is missing', async () => {
      setMockQueryResult('SELECT id, slug', [mockAttraction])

      const req = createMockRequest('POST', '/api/attraction-ai', {
        headers: { 'x-user-id': 'user-123' },
        body: { action: 'tailored_tips', attractionSlug: 'wat-phra-kaew' },
      })

      const response = await attractionAiHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.error).toBe('User profile required for tailored tips')
    })

    it('should return empty response when no tips exist', async () => {
      setMockQueryResult('SELECT id, slug', [mockAttraction])
      setMockQueryResult('SELECT tip_type', [])

      const req = createMockRequest('POST', '/api/attraction-ai', {
        headers: { 'x-user-id': 'user-123' },
        body: {
          action: 'tailored_tips',
          attractionSlug: 'wat-phra-kaew',
          userProfile: mockUserProfile,
        },
      })

      const response = await attractionAiHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.response).toBe('')
      expect(data.usage.inputTokens).toBe(0)
    })

    it('should generate tailored tips from existing tips', async () => {
      setMockQueryResult('SELECT id, slug', [mockAttraction])
      setMockQueryResult('SELECT tip_type', [
        { tip_type: 'timing', title: 'Best time to visit', content: 'Visit early morning' },
        { tip_type: 'transport', title: 'Getting there', content: 'Take BTS to Saphan Taksin' },
      ])
      setMockAIResponse('[timing] Best time to visit: As a cultural traveler, visit at sunrise for the most peaceful experience.\n\n[transport] Getting there: For a mid-budget traveler, the BTS is the most economical option.')

      const req = createMockRequest('POST', '/api/attraction-ai', {
        headers: { 'x-user-id': 'user-123' },
        body: {
          action: 'tailored_tips',
          attractionSlug: 'wat-phra-kaew',
          userProfile: mockUserProfile,
        },
      })

      const response = await attractionAiHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.response).toContain('[timing]')
      expect(data.usage.inputTokens).toBe(100)
    })

    it('should fetch tips from database', async () => {
      setMockQueryResult('SELECT id, slug', [mockAttraction])
      setMockQueryResult('SELECT tip_type', [])

      const req = createMockRequest('POST', '/api/attraction-ai', {
        headers: { 'x-user-id': 'user-123' },
        body: {
          action: 'tailored_tips',
          attractionSlug: 'wat-phra-kaew',
          userProfile: mockUserProfile,
        },
      })

      await attractionAiHandler(req, mockContext as never)

      expect(wasQueryMade('attraction_tips')).toBe(true)
      expect(wasQueryMade('attraction_id')).toBe(true)
    })
  })

  describe('chat action', () => {
    it('should return 400 when message is missing', async () => {
      setMockQueryResult('SELECT id, slug', [mockAttraction])

      const req = createMockRequest('POST', '/api/attraction-ai', {
        headers: { 'x-user-id': 'user-123' },
        body: {
          action: 'chat',
          attractionSlug: 'wat-phra-kaew',
        },
      })

      const response = await attractionAiHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.error).toBe('Message required for chat')
    })

    it('should handle chat message', async () => {
      setMockQueryResult('SELECT id, slug', [mockAttraction])
      setMockAIResponse('The temple is open from 8:30 AM to 3:30 PM. Plan to spend 2-3 hours for a thorough visit.')

      const req = createMockRequest('POST', '/api/attraction-ai', {
        headers: { 'x-user-id': 'user-123' },
        body: {
          action: 'chat',
          attractionSlug: 'wat-phra-kaew',
          message: 'What are the opening hours?',
        },
      })

      const response = await attractionAiHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.response).toContain('8:30 AM')
      expect(data.usage).toBeTruthy()
    })

    it('should include conversation history in chat', async () => {
      setMockQueryResult('SELECT id, slug', [mockAttraction])
      setMockAIResponse('Yes, the Grand Palace is right next to the temple.')

      const conversationHistory = [
        { role: 'user' as const, content: 'Is this near the Grand Palace?' },
        { role: 'assistant' as const, content: 'Yes, it is located within the Grand Palace complex.' },
      ]

      const req = createMockRequest('POST', '/api/attraction-ai', {
        headers: { 'x-user-id': 'user-123' },
        body: {
          action: 'chat',
          attractionSlug: 'wat-phra-kaew',
          message: 'Can I visit both in one day?',
          conversationHistory,
        },
      })

      await attractionAiHandler(req, mockContext as never)

      expect(mockAnthropic.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            { role: 'user', content: 'Is this near the Grand Palace?' },
            { role: 'assistant', content: 'Yes, it is located within the Grand Palace complex.' },
            { role: 'user', content: 'Can I visit both in one day?' },
          ],
        })
      )
    })

    it('should include user profile context in system prompt when provided', async () => {
      setMockQueryResult('SELECT id, slug', [mockAttraction])
      setMockAIResponse('Response with profile context')

      const req = createMockRequest('POST', '/api/attraction-ai', {
        headers: { 'x-user-id': 'user-123' },
        body: {
          action: 'chat',
          attractionSlug: 'wat-phra-kaew',
          message: 'Any tips for me?',
          userProfile: mockUserProfile,
        },
      })

      await attractionAiHandler(req, mockContext as never)

      expect(mockAnthropic.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          system: expect.stringContaining('Nationality: US'),
        })
      )
    })

    it('should work without user profile', async () => {
      setMockQueryResult('SELECT id, slug', [mockAttraction])
      setMockAIResponse('Generic response')

      const req = createMockRequest('POST', '/api/attraction-ai', {
        headers: { 'x-user-id': 'user-123' },
        body: {
          action: 'chat',
          attractionSlug: 'wat-phra-kaew',
          message: 'What should I know?',
        },
      })

      const response = await attractionAiHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.response).toBe('Generic response')
    })
  })

  describe('error handling', () => {
    it('should return 500 when database query fails', async () => {
      // Test error handling by making the database throw
      const { setMockQueryError } = await import('./__mocks__/db')
      setMockQueryError(new Error('Database connection failed'))

      const req = createMockRequest('POST', '/api/attraction-ai', {
        headers: { 'x-user-id': 'user-123' },
        body: {
          action: 'chat',
          attractionSlug: 'wat-phra-kaew',
          message: 'Test message',
        },
      })

      const response = await attractionAiHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to process AI request')

      // Clean up - clear the error
      setMockQueryError(null)
    })
  })
})
