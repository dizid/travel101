import type { Context, Config } from '@netlify/functions'
import Anthropic from '@anthropic-ai/sdk'
import { getDb } from './lib/db.mts'
import { checkAndIncrementUsage, type FeatureType } from './lib/usage.mts'

interface UserPrefs {
  nationality?: string
  tripType?: string
  travelStyle?: string[]
  budget?: string
  interests?: string[]
  groupType?: string
}

interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}

interface RequestBody {
  action: 'personalized_intro' | 'tailored_tips' | 'chat'
  attractionSlug: string
  userProfile?: UserPrefs
  message?: string
  conversationHistory?: AIMessage[]
}

interface Attraction {
  id: string
  slug: string
  name: string
  description: string
  about: string | null
  category: string
  location: string | null
  province: string | null
  categories: Record<string, number>
}

interface AttractionTip {
  tip_type: string
  title: string
  content: string
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function formatUserProfile(prefs: UserPrefs): string {
  const parts: string[] = []
  if (prefs.nationality) parts.push(`Nationality: ${prefs.nationality}`)
  if (prefs.tripType) parts.push(`Trip type: ${prefs.tripType}`)
  if (prefs.travelStyle?.length) parts.push(`Travel style: ${prefs.travelStyle.join(', ')}`)
  if (prefs.budget) parts.push(`Budget: ${prefs.budget}`)
  if (prefs.interests?.length) parts.push(`Interests: ${prefs.interests.join(', ')}`)
  if (prefs.groupType) parts.push(`Traveling as: ${prefs.groupType}`)
  return parts.join('\n')
}

function formatCategories(categories: Record<string, number>): string {
  return Object.entries(categories)
    .filter(([, score]) => score > 0.5)
    .map(([cat]) => cat.replace(/_/g, ' '))
    .join(', ')
}

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  // Auth check - require user to be logged in to use AI features
  const userId = req.headers.get('x-user-id')
  if (!userId) {
    return json({ error: 'Unauthorized - login required for AI features' }, 401)
  }

  const apiKey = Netlify.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) {
    return json({ error: 'AI service not configured' }, 500)
  }

  try {
    const body: RequestBody = await req.json()
    const { action, attractionSlug, userProfile, message, conversationHistory = [] } = body

    if (!action || !attractionSlug) {
      return json({ error: 'action and attractionSlug are required' }, 400)
    }

    // Fetch attraction from database
    const db = await getDb()
    const attractions: Attraction[] = await db`
      SELECT id, slug, name, description, about, category, location, province, categories
      FROM attractions WHERE slug = ${attractionSlug}
    `

    if (attractions.length === 0) {
      return json({ error: 'Attraction not found' }, 404)
    }

    const attraction = attractions[0]
    const anthropic = new Anthropic({ apiKey })

    // Map action to feature type for usage tracking
    const featureMap: Record<string, FeatureType> = {
      personalized_intro: 'attraction_intro',
      tailored_tips: 'attraction_tips',
      chat: 'attraction_chat',
    }
    const featureType = featureMap[action]

    // Check usage limits
    if (featureType) {
      const usageCheck = await checkAndIncrementUsage(db, userId, featureType)
      if (!usageCheck.allowed) {
        return json({
          error: `Daily ${action.replace('_', ' ')} limit reached`,
          code: 'LIMIT_REACHED',
          usage: {
            current: usageCheck.currentUsage,
            limit: usageCheck.limit,
            remaining: 0,
          },
          upgradeUrl: '/dashboard#pro',
        }, 429)
      }
    }

    switch (action) {
      case 'personalized_intro':
        return handlePersonalizedIntro(anthropic, attraction, userProfile)

      case 'tailored_tips':
        return handleTailoredTips(anthropic, attraction, userProfile, db)

      case 'chat':
        return handleChat(anthropic, attraction, userProfile, message, conversationHistory)

      default:
        return json({ error: 'Invalid action' }, 400)
    }
  } catch (error) {
    console.error('Attraction AI function error:', error)
    return json({ error: 'Failed to process AI request' }, 500)
  }
}

async function handlePersonalizedIntro(
  anthropic: Anthropic,
  attraction: Attraction,
  userProfile?: UserPrefs
) {
  if (!userProfile || Object.keys(userProfile).length === 0) {
    return json({ error: 'User profile required for personalized intro' }, 400)
  }

  const systemPrompt = `You are a friendly Thailand travel expert. Write a personalized 2-3 sentence explanation of why a specific destination would be perfect for a traveler based on their profile. Be warm, specific, and highlight what matches their interests. Do not use generic phrases - be specific to both the place and the person.`

  const userMessage = `Based on this traveler's profile and attraction, write why this place would be perfect for them:

TRAVELER PROFILE:
${formatUserProfile(userProfile)}

DESTINATION:
Name: ${attraction.name}
Province: ${attraction.province || 'Thailand'}
Category: ${attraction.category}
Description: ${attraction.description}
${attraction.about ? `About: ${attraction.about}` : ''}
Best for: ${formatCategories(attraction.categories)}

Write 2-3 sentences explaining why this destination is perfect for this specific traveler. Start with "This is perfect for you because..." or similar personalized opener.`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  const contentBlock = response.content[0]
  const text = contentBlock.type === 'text' ? contentBlock.text : ''

  return json({
    response: text,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  })
}

async function handleTailoredTips(
  anthropic: Anthropic,
  attraction: Attraction,
  userProfile: UserPrefs | undefined,
  db: ReturnType<typeof getDb>
) {
  if (!userProfile || Object.keys(userProfile).length === 0) {
    return json({ error: 'User profile required for tailored tips' }, 400)
  }

  // Fetch tips for this attraction
  const tips: AttractionTip[] = await db`
    SELECT tip_type, title, content
    FROM attraction_tips
    WHERE attraction_id = ${attraction.id}
    ORDER BY sort_order
  `

  if (tips.length === 0) {
    return json({ response: '', usage: { inputTokens: 0, outputTokens: 0 } })
  }

  const tipsText = tips.map(t => `[${t.tip_type}] ${t.title}: ${t.content}`).join('\n\n')

  const systemPrompt = `You are a Thailand travel expert. Rewrite travel tips to be more relevant and personalized for a specific traveler. Adjust the advice based on their budget, interests, travel style, and group type. Keep the same structure but make the advice more targeted and useful for them specifically.`

  const userMessage = `Personalize these travel tips for ${attraction.name} for this specific traveler:

TRAVELER PROFILE:
${formatUserProfile(userProfile)}

ORIGINAL TIPS:
${tipsText}

Rewrite each tip to be more relevant for this traveler. If they're on a budget, emphasize money-saving aspects. If they're traveling with family, add family-friendly advice. If they're interested in culture, highlight cultural aspects. Keep the same [type] labels. Be specific and actionable.`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  const contentBlock = response.content[0]
  const text = contentBlock.type === 'text' ? contentBlock.text : ''

  return json({
    response: text,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  })
}

async function handleChat(
  anthropic: Anthropic,
  attraction: Attraction,
  userProfile: UserPrefs | undefined,
  message: string | undefined,
  conversationHistory: AIMessage[]
) {
  if (!message) {
    return json({ error: 'Message required for chat' }, 400)
  }

  const userContext = userProfile && Object.keys(userProfile).length > 0
    ? `\n\nThe traveler's profile:\n${formatUserProfile(userProfile)}`
    : ''

  const systemPrompt = `You are a knowledgeable and friendly Thailand travel advisor helping someone plan their visit to ${attraction.name} in ${attraction.province || 'Thailand'}.

About this destination:
${attraction.about || attraction.description}

Category: ${attraction.category}
Best for: ${formatCategories(attraction.categories)}${userContext}

Answer questions with specific, actionable advice for this destination. Be concise but helpful. If you don't know something specific about this place, say so honestly rather than making up details. Focus on practical tips that would help someone visiting.`

  const messages = [
    ...conversationHistory.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user' as const, content: message },
  ]

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    system: systemPrompt,
    messages,
  })

  const contentBlock = response.content[0]
  const text = contentBlock.type === 'text' ? contentBlock.text : ''

  return json({
    response: text,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  })
}

export const config: Config = {
  path: '/api/attraction-ai',
}
