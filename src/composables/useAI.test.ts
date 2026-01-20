import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAI } from './useAI'
import { useUserStore } from '@/stores/userStore'
import { mockFetch, createMockResponse, createErrorResponse } from '@/test/setup'
import { backpackerPrefs } from '@/test/fixtures'

describe('useAI', () => {
  let userStore: ReturnType<typeof useUserStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    userStore = useUserStore()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('ask', () => {
    it('should send message and receive response', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          response: 'AI response text',
          usage: { inputTokens: 100, outputTokens: 50 },
        })
      )

      const { ask, conversationHistory } = useAI()
      const result = await ask('Hello AI')

      expect(result).toBe('AI response text')
      expect(conversationHistory.value).toHaveLength(2)
      expect(conversationHistory.value[0]).toEqual({ role: 'user', content: 'Hello AI' })
      expect(conversationHistory.value[1]).toEqual({ role: 'assistant', content: 'AI response text' })
    })

    it('should include user profile in request', async () => {
      userStore.updatePreferences(backpackerPrefs)
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          response: 'Response',
          usage: { inputTokens: 100, outputTokens: 50 },
        })
      )

      const { ask } = useAI()
      await ask('Test message')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/ai'),
        expect.objectContaining({
          body: expect.stringContaining('"userProfile"'),
        })
      )
    })

    it('should truncate conversation history to last 10 messages', async () => {
      const { ask, conversationHistory } = useAI()

      // Manually add 20 messages to history
      for (let i = 0; i < 20; i++) {
        conversationHistory.value.push({ role: 'user', content: `Message ${i}` })
      }

      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          response: 'Response',
          usage: { inputTokens: 100, outputTokens: 50 },
        })
      )

      await ask('New message')

      // Check the API was called with truncated history
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.conversationHistory.length).toBeLessThanOrEqual(10)
    })

    it('should store conversation ID from response', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          response: 'Response',
          conversationId: 'conv-123',
          usage: { inputTokens: 100, outputTokens: 50 },
        })
      )

      const { ask, conversationId } = useAI()
      await ask('Test')

      expect(conversationId.value).toBe('conv-123')
    })

    it('should return null on API error', async () => {
      mockFetch.mockResolvedValueOnce(createErrorResponse('AI Error', 500))

      const { ask } = useAI()
      const result = await ask('Test')

      expect(result).toBeNull()
    })
  })

  describe('clearHistory', () => {
    it('should clear conversation history and ID', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          response: 'Response',
          conversationId: 'conv-123',
          usage: { inputTokens: 100, outputTokens: 50 },
        })
      )

      const { ask, clearHistory, conversationHistory, conversationId } = useAI()
      await ask('Test')

      expect(conversationHistory.value.length).toBeGreaterThan(0)
      expect(conversationId.value).toBe('conv-123')

      clearHistory()

      expect(conversationHistory.value).toEqual([])
      expect(conversationId.value).toBeNull()
    })
  })

  describe('loadConversation', () => {
    it('should require Pro for loading conversation', async () => {
      userStore.setPro(false)

      const { loadConversation } = useAI()
      const result = await loadConversation()

      expect(result).toBe(false)
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should load conversation for Pro users', async () => {
      userStore.setPro(true)
      userStore.setAuthUser('user-123')
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          conversation: {
            id: 'conv-123',
            messages: [
              { role: 'user', content: 'Previous question' },
              { role: 'assistant', content: 'Previous answer' },
            ],
          },
        })
      )

      const { loadConversation, conversationHistory, conversationId, conversationLoaded } = useAI()
      const result = await loadConversation()

      expect(result).toBe(true)
      expect(conversationHistory.value).toHaveLength(2)
      expect(conversationId.value).toBe('conv-123')
      expect(conversationLoaded.value).toBe(true)
    })

    it('should handle no existing conversation', async () => {
      userStore.setPro(true)
      userStore.setAuthUser('user-123')
      mockFetch.mockResolvedValueOnce(createMockResponse({ conversation: null }))

      const { loadConversation, conversationLoaded } = useAI()
      const result = await loadConversation()

      expect(result).toBe(false)
      expect(conversationLoaded.value).toBe(true)
    })
  })

  describe('startNewConversation', () => {
    it('should archive old conversation for Pro users', async () => {
      userStore.setPro(true)
      userStore.setAuthUser('user-123')
      mockFetch.mockResolvedValueOnce(createMockResponse({ success: true }))

      const { startNewConversation, conversationHistory } = useAI()

      // Add some history first
      conversationHistory.value.push({ role: 'user', content: 'Old message' })

      await startNewConversation()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/ai'),
        expect.objectContaining({ method: 'DELETE' })
      )
      expect(conversationHistory.value).toEqual([])
    })

    it('should just clear history for non-Pro users', async () => {
      userStore.setPro(false)

      const { startNewConversation, conversationHistory } = useAI()
      conversationHistory.value.push({ role: 'user', content: 'Old message' })

      await startNewConversation()

      expect(mockFetch).not.toHaveBeenCalled()
      expect(conversationHistory.value).toEqual([])
    })
  })

  describe('getPersonalizedIntro', () => {
    // Use unique slugs per test to avoid module-level cache collisions
    it('should fetch personalized intro', async () => {
      userStore.updatePreferences(backpackerPrefs)
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          response: 'Personalized intro for this attraction',
        })
      )

      const { getPersonalizedIntro } = useAI()
      const result = await getPersonalizedIntro('intro-fetch-test')

      expect(result).toBe('Personalized intro for this attraction')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/attraction-ai'),
        expect.objectContaining({
          body: expect.stringContaining('personalized_intro'),
        })
      )
    })

    it('should return null if user has no profile', async () => {
      // Don't set preferences, so hasProfile is false

      const { getPersonalizedIntro } = useAI()
      const result = await getPersonalizedIntro('no-profile-test')

      expect(result).toBeNull()
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should cache intro for 30 minutes', async () => {
      userStore.updatePreferences(backpackerPrefs)
      mockFetch.mockResolvedValue(
        createMockResponse({
          response: 'Cached intro',
        })
      )

      const { getPersonalizedIntro } = useAI()

      // First call - use unique slug for this test
      const result1 = await getPersonalizedIntro('cache-ttl-test')
      expect(result1).toBe('Cached intro')
      expect(mockFetch).toHaveBeenCalledTimes(1)

      // Second call within TTL
      vi.advanceTimersByTime(15 * 60 * 1000) // 15 minutes
      const result2 = await getPersonalizedIntro('cache-ttl-test')

      expect(result2).toBe('Cached intro')
      expect(mockFetch).toHaveBeenCalledTimes(1) // No new call
    })

    it('should fetch fresh data after cache expires', async () => {
      userStore.updatePreferences(backpackerPrefs)
      mockFetch
        .mockResolvedValueOnce(createMockResponse({ response: 'First intro' }))
        .mockResolvedValueOnce(createMockResponse({ response: 'Fresh intro' }))

      const { getPersonalizedIntro } = useAI()

      // First call - use unique slug for this test
      await getPersonalizedIntro('cache-expire-test')
      expect(mockFetch).toHaveBeenCalledTimes(1)

      // Advance past TTL
      vi.advanceTimersByTime(31 * 60 * 1000) // 31 minutes

      // Second call should fetch fresh
      const result = await getPersonalizedIntro('cache-expire-test')
      expect(result).toBe('Fresh intro')
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should use different cache keys for different attractions', async () => {
      userStore.updatePreferences(backpackerPrefs)
      mockFetch
        .mockResolvedValueOnce(createMockResponse({ response: 'Intro A' }))
        .mockResolvedValueOnce(createMockResponse({ response: 'Intro B' }))

      const { getPersonalizedIntro } = useAI()

      const resultA = await getPersonalizedIntro('cache-key-test-a')
      const resultB = await getPersonalizedIntro('cache-key-test-b')

      expect(resultA).toBe('Intro A')
      expect(resultB).toBe('Intro B')
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('getTailoredTips', () => {
    it('should fetch tailored tips', async () => {
      userStore.updatePreferences(backpackerPrefs)
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          response: 'Tailored tips for you',
        })
      )

      const { getTailoredTips } = useAI()
      const result = await getTailoredTips('test-attraction')

      expect(result).toBe('Tailored tips for you')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/attraction-ai'),
        expect.objectContaining({
          body: expect.stringContaining('tailored_tips'),
        })
      )
    })

    it('should return null without profile', async () => {
      const { getTailoredTips } = useAI()
      const result = await getTailoredTips('test-attraction')

      expect(result).toBeNull()
    })
  })

  describe('askAboutAttraction', () => {
    it('should maintain separate history per attraction', async () => {
      userStore.updatePreferences(backpackerPrefs)
      mockFetch
        .mockResolvedValueOnce(createMockResponse({ response: 'Response A' }))
        .mockResolvedValueOnce(createMockResponse({ response: 'Response B' }))

      const { askAboutAttraction, getAttractionHistory } = useAI()

      await askAboutAttraction('attraction-a', 'Question about A')
      await askAboutAttraction('attraction-b', 'Question about B')

      const historyA = getAttractionHistory('attraction-a')
      const historyB = getAttractionHistory('attraction-b')

      expect(historyA).toHaveLength(2)
      expect(historyB).toHaveLength(2)
      expect(historyA[0].content).toBe('Question about A')
      expect(historyB[0].content).toBe('Question about B')
    })

    it('should accumulate history for same attraction', async () => {
      userStore.updatePreferences(backpackerPrefs)
      mockFetch
        .mockResolvedValueOnce(createMockResponse({ response: 'Response 1' }))
        .mockResolvedValueOnce(createMockResponse({ response: 'Response 2' }))

      const { askAboutAttraction, getAttractionHistory } = useAI()

      await askAboutAttraction('test', 'First question')
      await askAboutAttraction('test', 'Second question')

      const history = getAttractionHistory('test')
      expect(history).toHaveLength(4)
    })
  })

  describe('clearAttractionHistory', () => {
    it('should clear specific attraction history', async () => {
      userStore.updatePreferences(backpackerPrefs)
      mockFetch.mockResolvedValue(createMockResponse({ response: 'Response' }))

      const { askAboutAttraction, clearAttractionHistory, getAttractionHistory } = useAI()

      await askAboutAttraction('attraction-a', 'Question')
      await askAboutAttraction('attraction-b', 'Question')

      clearAttractionHistory('attraction-a')

      expect(getAttractionHistory('attraction-a')).toHaveLength(0)
      expect(getAttractionHistory('attraction-b')).toHaveLength(2)
    })

    it('should clear all attraction history when no slug provided', async () => {
      userStore.updatePreferences(backpackerPrefs)
      mockFetch.mockResolvedValue(createMockResponse({ response: 'Response' }))

      const { askAboutAttraction, clearAttractionHistory, getAttractionHistory } = useAI()

      await askAboutAttraction('attraction-a', 'Question')
      await askAboutAttraction('attraction-b', 'Question')

      clearAttractionHistory()

      expect(getAttractionHistory('attraction-a')).toHaveLength(0)
      expect(getAttractionHistory('attraction-b')).toHaveLength(0)
    })
  })

  describe('isPro computed', () => {
    it('should reflect user store Pro status', () => {
      userStore.setPro(false)
      const { isPro } = useAI()
      expect(isPro.value).toBe(false)

      userStore.setPro(true)
      expect(isPro.value).toBe(true)
    })
  })
})
