import { describe, it, expect, beforeEach, vi } from 'vitest'
import '../__mocks__/db'
import '../__mocks__/anthropic'
import { setMockQueryResult, clearMockResults, wasQueryMade } from '../__mocks__/db'
import { mockAnthropic, setMockAIResponse, setMockAIError, resetAnthropicMocks } from '../__mocks__/anthropic'
import { setMockEnv, clearMockEnv } from './setup.js'
import { createMockRequest, parseResponse } from './helpers.js'
import { resetRateLimitsForTests } from '../lib/rate-limit.mts'

import aiHandler from '../ai.mts'

const mockContext = {
  geo: { city: 'Bangkok' },
  ip: '127.0.0.1',
}

describe('ai function', () => {
  beforeEach(() => {
    clearMockResults()
    clearMockEnv()
    vi.clearAllMocks()
    resetAnthropicMocks()
    resetRateLimitsForTests()

    // Set required env vars
    setMockEnv('DATABASE_URL', 'postgresql://test:test@localhost/test')
    setMockEnv('ANTHROPIC_API_KEY', 'sk-ant-test-123')
  })

  describe('authentication', () => {
    it('should return 401 for GET without x-user-id', async () => {
      const req = createMockRequest('GET', '/api/ai', {
        headers: {},
      })

      const response = await aiHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 401 for DELETE without x-user-id', async () => {
      const req = createMockRequest('DELETE', '/api/ai', {
        headers: {},
      })

      const response = await aiHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 403 for GET when user is not Pro', async () => {
      setMockQueryResult('SELECT is_pro', [{ is_pro: false }])

      const req = createMockRequest('GET', '/api/ai', {
        headers: { 'x-user-id': 'user-123' },
      })

      const response = await aiHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(403)
      expect(data.error).toBe('Pro subscription required')
    })

    it('should return 403 for DELETE when user is not Pro', async () => {
      setMockQueryResult('SELECT is_pro', [{ is_pro: false }])

      const req = createMockRequest('DELETE', '/api/ai', {
        headers: { 'x-user-id': 'user-123' },
      })

      const response = await aiHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(403)
      expect(data.error).toBe('Pro subscription required')
    })
  })

  describe('GET /api/ai', () => {
    it('should load conversation history for Pro users', async () => {
      const mockConversation = {
        id: 'conv-123',
        conversation_type: 'general',
        context_slug: null,
        title: 'Test conversation',
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      setMockQueryResult('SELECT is_pro', [{ is_pro: true }])
      setMockQueryResult('SELECT id, conversation_type', [mockConversation])

      const req = createMockRequest('GET', '/api/ai?type=general', {
        headers: { 'x-user-id': 'user-123' },
      })

      const response = await aiHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.conversation).toBeTruthy()
      expect(data.conversation.id).toBe('conv-123')
      expect(data.conversation.messages).toHaveLength(2)
    })

    it('should filter by conversation type and context', async () => {
      setMockQueryResult('SELECT is_pro', [{ is_pro: true }])
      setMockQueryResult('SELECT id, conversation_type', [])

      const req = createMockRequest('GET', '/api/ai?type=attraction&context=wat-phra-kaew', {
        headers: { 'x-user-id': 'user-123' },
      })

      const response = await aiHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.conversation).toBeNull()
      expect(wasQueryMade('conversation_type')).toBe(true)
      expect(wasQueryMade('context_slug')).toBe(true)
    })

    it('should return null when no conversation exists', async () => {
      setMockQueryResult('SELECT is_pro', [{ is_pro: true }])
      setMockQueryResult('SELECT id, conversation_type', [])

      const req = createMockRequest('GET', '/api/ai', {
        headers: { 'x-user-id': 'user-123' },
      })

      const response = await aiHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.conversation).toBeNull()
    })
  })

  describe('POST /api/ai', () => {
    it('should return 500 when ANTHROPIC_API_KEY is missing', async () => {
      clearMockEnv()
      setMockEnv('DATABASE_URL', 'postgresql://test:test@localhost/test')
      // Don't set ANTHROPIC_API_KEY

      const req = createMockRequest('POST', '/api/ai', {
        headers: { 'x-user-id': 'user-123' },
        body: { message: 'Hello' },
      })

      const response = await aiHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(500)
      expect(data.error).toBe('AI service not configured')
    })

    it('should return 400 when message is missing', async () => {
      const req = createMockRequest('POST', '/api/ai', {
        headers: { 'x-user-id': 'user-123' },
        body: {},
      })

      const response = await aiHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.error).toBe('Message is required')
    })

    it('should process message and return AI response', async () => {
      setMockAIResponse('Here is my travel advice for you!')

      const req = createMockRequest('POST', '/api/ai', {
        headers: { 'x-user-id': 'user-123' },
        body: { message: 'What is the best time to visit Thailand?' },
      })

      const response = await aiHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.response).toBe('Here is my travel advice for you!')
      expect(data.usage).toBeTruthy()
      expect(data.usage.inputTokens).toBe(100)
      expect(data.usage.outputTokens).toBe(50)
    })

    it('should include user profile in system prompt', async () => {
      setMockAIResponse('Based on your preferences...')

      const userProfile = {
        nationality: 'US',
        tripType: 'long-stay',
        travelStyle: ['adventure', 'authentic'],
        budget: 'mid',
        interests: ['temples', 'food'],
      }

      const req = createMockRequest('POST', '/api/ai', {
        headers: { 'x-user-id': 'user-123' },
        body: { message: 'Recommend a visa', userProfile },
      })

      const response = await aiHandler(req, mockContext as never)

      expect(response.status).toBe(200)
      expect(mockAnthropic.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          system: expect.stringContaining('Nationality: US'),
        })
      )
      expect(mockAnthropic.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          system: expect.stringContaining('temples, food'),
        })
      )
    })

    it('should include conversation history in messages', async () => {
      setMockAIResponse('Follow-up response')

      const conversationHistory = [
        { role: 'user', content: 'Previous question' },
        { role: 'assistant', content: 'Previous answer' },
      ]

      const req = createMockRequest('POST', '/api/ai', {
        headers: { 'x-user-id': 'user-123' },
        body: { message: 'Follow up question', conversationHistory },
      })

      const response = await aiHandler(req, mockContext as never)

      expect(response.status).toBe(200)
      expect(mockAnthropic.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            { role: 'user', content: 'Previous question' },
            { role: 'assistant', content: 'Previous answer' },
            { role: 'user', content: 'Follow up question' },
          ],
        })
      )
    })

    it('should save conversation to DB when saveToDb is true and user is Pro', async () => {
      setMockAIResponse('AI response')
      setMockQueryResult('SELECT is_pro', [{ is_pro: true }])
      setMockQueryResult('SELECT id FROM ai_conversations', [])
      setMockQueryResult('INSERT INTO ai_conversations', [{ id: 'conv-new' }])

      const req = createMockRequest('POST', '/api/ai', {
        headers: { 'x-user-id': 'user-123' },
        body: { message: 'Save this', saveToDb: true },
      })

      const response = await aiHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.conversationId).toBe('conv-new')
      expect(wasQueryMade('INSERT INTO ai_conversations')).toBe(true)
    })

    it('should update existing conversation when one exists', async () => {
      setMockAIResponse('AI response')
      setMockQueryResult('SELECT is_pro', [{ is_pro: true }])
      setMockQueryResult('SELECT id FROM ai_conversations', [{ id: 'conv-existing' }])
      setMockQueryResult('UPDATE ai_conversations', [])

      const req = createMockRequest('POST', '/api/ai', {
        headers: { 'x-user-id': 'user-123' },
        body: { message: 'Update conversation', saveToDb: true },
      })

      const response = await aiHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.conversationId).toBe('conv-existing')
      expect(wasQueryMade('UPDATE ai_conversations')).toBe(true)
    })

    it('should not save to DB when saveToDb is false', async () => {
      setMockAIResponse('AI response')

      const req = createMockRequest('POST', '/api/ai', {
        headers: { 'x-user-id': 'user-123' },
        body: { message: 'Do not save', saveToDb: false },
      })

      const response = await aiHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.conversationId).toBeNull()
      expect(wasQueryMade('INSERT INTO ai_conversations')).toBe(false)
    })

    it('should handle Claude API errors gracefully', async () => {
      setMockAIError('Claude API rate limit exceeded')

      const req = createMockRequest('POST', '/api/ai', {
        headers: { 'x-user-id': 'user-123' },
        body: { message: 'Test' },
      })

      const response = await aiHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to process AI request')
    })

    it('should continue even if DB save fails', async () => {
      setMockAIResponse('AI response despite DB error')
      setMockQueryResult('SELECT is_pro', [{ is_pro: true }])
      // No INSERT result set - will fail silently

      const req = createMockRequest('POST', '/api/ai', {
        headers: { 'x-user-id': 'user-123' },
        body: { message: 'Save attempt', saveToDb: true },
      })

      const response = await aiHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.response).toBe('AI response despite DB error')
    })
  })

  describe('DELETE /api/ai', () => {
    it('should archive conversation for Pro users', async () => {
      setMockQueryResult('SELECT is_pro', [{ is_pro: true }])
      setMockQueryResult('UPDATE ai_conversations', [])

      const req = createMockRequest('DELETE', '/api/ai?type=general', {
        headers: { 'x-user-id': 'user-123' },
      })

      const response = await aiHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(wasQueryMade('UPDATE ai_conversations')).toBe(true)
      expect(wasQueryMade('is_archived = true')).toBe(true)
    })

    it('should filter by type and context when archiving', async () => {
      setMockQueryResult('SELECT is_pro', [{ is_pro: true }])
      setMockQueryResult('UPDATE ai_conversations', [])

      const req = createMockRequest('DELETE', '/api/ai?type=attraction&context=phuket', {
        headers: { 'x-user-id': 'user-123' },
      })

      const response = await aiHandler(req, mockContext as never)

      expect(response.status).toBe(200)
      expect(wasQueryMade('conversation_type')).toBe(true)
      expect(wasQueryMade('context_slug')).toBe(true)
    })
  })

  describe('unsupported methods', () => {
    it('should return 405 for PUT method', async () => {
      const req = createMockRequest('PUT', '/api/ai', {
        headers: { 'x-user-id': 'user-123' },
        body: { message: 'Test' },
      })

      const response = await aiHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(405)
      expect(data.error).toBe('Method not allowed')
    })

    it('should return 405 for PATCH method', async () => {
      const req = createMockRequest('PATCH', '/api/ai', {
        headers: { 'x-user-id': 'user-123' },
        body: { message: 'Test' },
      })

      const response = await aiHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(405)
      expect(data.error).toBe('Method not allowed')
    })
  })

  describe('system prompt', () => {
    it('should include Thailand visa information in system prompt', async () => {
      setMockAIResponse('Visa info response')

      const req = createMockRequest('POST', '/api/ai', {
        headers: { 'x-user-id': 'user-123' },
        body: { message: 'Tell me about visas' },
      })

      await aiHandler(req, mockContext as never)

      expect(mockAnthropic.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          system: expect.stringContaining('Visa Exemption: 60 days'),
        })
      )
      expect(mockAnthropic.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          system: expect.stringContaining('DTV (Destination Thailand Visa)'),
        })
      )
    })

    it('should use claude-haiku model', async () => {
      setMockAIResponse('Response')

      const req = createMockRequest('POST', '/api/ai', {
        headers: { 'x-user-id': 'user-123' },
        body: { message: 'Test' },
      })

      await aiHandler(req, mockContext as never)

      expect(mockAnthropic.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
        })
      )
    })
  })
})
