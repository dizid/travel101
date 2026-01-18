import { ref, computed } from 'vue'
import { useApi } from './useApi'
import { useUserStore } from '@/stores/userStore'

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

interface AIResponse {
  response: string
  conversationId?: string
  usage: {
    inputTokens: number
    outputTokens: number
  }
}

interface AIConversation {
  id: string
  conversation_type: string
  context_slug: string | null
  title: string
  messages: AIMessage[]
  created_at: string
  updated_at: string
}

// Cache configuration
const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes
const CACHE_MAX_SIZE = 50
const MAX_CONVERSATION_HISTORY = 10 // Messages to keep (5 exchanges)

// Cache for personalized intros with TTL
interface CacheEntry {
  value: string
  timestamp: number
}
const introCache = new Map<string, CacheEntry>()

// Clean expired cache entries
function cleanExpiredCache() {
  const now = Date.now()
  for (const [key, entry] of introCache) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      introCache.delete(key)
    }
  }
}

// Evict oldest entry if cache is full
function evictOldestIfNeeded() {
  if (introCache.size >= CACHE_MAX_SIZE) {
    let oldestKey: string | null = null
    let oldestTime = Infinity
    for (const [key, entry] of introCache) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    }
    if (oldestKey) {
      introCache.delete(oldestKey)
    }
  }
}

export function useAI() {
  const { get, post, del, loading, error } = useApi()
  const userStore = useUserStore()
  const conversationHistory = ref<AIMessage[]>([])
  const conversationId = ref<string | null>(null)
  const conversationLoaded = ref(false)

  // Attraction-specific conversation history (keyed by slug)
  const attractionHistory = ref<Map<string, AIMessage[]>>(new Map())

  const isPro = computed(() => userStore.isPro)

  // Load previous conversation from database (Pro feature)
  async function loadConversation(type = 'general', context?: string): Promise<boolean> {
    if (!isPro.value) return false

    try {
      const params = new URLSearchParams({ type })
      if (context) params.set('context', context)

      const result = await get<{ conversation: AIConversation | null }>(`/ai?${params}`)
      if (result?.conversation) {
        conversationHistory.value = result.conversation.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        }))
        conversationId.value = result.conversation.id
        conversationLoaded.value = true
        return true
      }
    } catch (e) {
      console.error('Failed to load conversation:', e)
    }

    conversationLoaded.value = true
    return false
  }

  // Start a new conversation (archive old one)
  async function startNewConversation(type = 'general', context?: string): Promise<void> {
    if (isPro.value) {
      try {
        const params = new URLSearchParams({ type })
        if (context) params.set('context', context)
        await del(`/ai?${params}`)
      } catch (e) {
        console.error('Failed to archive old conversation:', e)
      }
    }

    conversationHistory.value = []
    conversationId.value = null
  }

  async function ask(message: string, persist = true): Promise<string | null> {
    // Truncate history to last N messages to avoid token limits
    const truncatedHistory = conversationHistory.value.slice(-MAX_CONVERSATION_HISTORY)

    const response = await post<AIResponse>('/ai?type=general', {
      message,
      userProfile: userStore.profile.prefs,
      conversationHistory: truncatedHistory,
      saveToDb: persist && isPro.value,
    })

    if (response) {
      conversationHistory.value.push(
        { role: 'user', content: message },
        { role: 'assistant', content: response.response }
      )
      if (response.conversationId) {
        conversationId.value = response.conversationId
      }
      return response.response
    }

    return null
  }

  function clearHistory() {
    conversationHistory.value = []
    conversationId.value = null
  }

  // Get AI-generated personalized intro for an attraction
  async function getPersonalizedIntro(attractionSlug: string): Promise<string | null> {
    // Clean expired entries first
    cleanExpiredCache()

    // Check cache (stable key using sorted JSON)
    const sortedPrefs = userStore.profile.prefs
      ? JSON.stringify(userStore.profile.prefs, Object.keys(userStore.profile.prefs).sort())
      : ''
    const cacheKey = `${attractionSlug}-${sortedPrefs}`
    const cached = introCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.value
    }

    if (!userStore.hasProfile) {
      return null
    }

    const response = await post<AIResponse>('/attraction-ai', {
      action: 'personalized_intro',
      attractionSlug,
      userProfile: userStore.profile.prefs,
    })

    if (response?.response) {
      // Evict oldest if at capacity
      evictOldestIfNeeded()
      introCache.set(cacheKey, {
        value: response.response,
        timestamp: Date.now(),
      })
      return response.response
    }

    return null
  }

  // Get AI-tailored tips based on user profile
  async function getTailoredTips(attractionSlug: string): Promise<string | null> {
    if (!userStore.hasProfile) {
      return null
    }

    const response = await post<AIResponse>('/attraction-ai', {
      action: 'tailored_tips',
      attractionSlug,
      userProfile: userStore.profile.prefs,
    })

    return response?.response || null
  }

  // Chat about a specific attraction with context
  async function askAboutAttraction(
    attractionSlug: string,
    message: string
  ): Promise<string | null> {
    // Get or initialize conversation history for this attraction
    if (!attractionHistory.value.has(attractionSlug)) {
      attractionHistory.value.set(attractionSlug, [])
    }
    const history = attractionHistory.value.get(attractionSlug) || []

    // Truncate history to last N messages to avoid token limits
    // Keep full history locally for display, but only send recent context to API
    const truncatedHistory = history.slice(-MAX_CONVERSATION_HISTORY)

    const response = await post<AIResponse>('/attraction-ai', {
      action: 'chat',
      attractionSlug,
      userProfile: userStore.profile.prefs,
      message,
      conversationHistory: truncatedHistory,
    })

    if (response?.response) {
      history.push(
        { role: 'user', content: message },
        { role: 'assistant', content: response.response }
      )
      attractionHistory.value.set(attractionSlug, history)
      return response.response
    }

    return null
  }

  // Clear attraction-specific history
  function clearAttractionHistory(attractionSlug?: string) {
    if (attractionSlug) {
      attractionHistory.value.delete(attractionSlug)
    } else {
      attractionHistory.value.clear()
    }
  }

  // Get conversation history for a specific attraction
  function getAttractionHistory(attractionSlug: string): AIMessage[] {
    return attractionHistory.value.get(attractionSlug) || []
  }

  return {
    // General AI
    ask,
    loading,
    error,
    conversationHistory,
    conversationId,
    conversationLoaded,
    clearHistory,
    loadConversation,
    startNewConversation,
    isPro,
    // Attraction-specific AI
    getPersonalizedIntro,
    getTailoredTips,
    askAboutAttraction,
    clearAttractionHistory,
    getAttractionHistory,
  }
}
