import type { Context, Config } from '@netlify/functions'
import Anthropic from '@anthropic-ai/sdk'
import { getDb } from './lib/db.mts'

const SYSTEM_PROMPT = `You are a friendly and knowledgeable Thailand travel advisor. You help travelers with:
- Visa requirements and recommendations based on nationality and trip type
- Cultural tips and local customs
- Safety advice and scam awareness
- Destination recommendations
- Itinerary planning

Key facts about Thailand visas (VERIFIED January 2025):

**SHORT-TERM STAYS:**
- Visa Exemption: 60 days for 93 countries (extended from 30 in July 2024), extendable +30 days (1,900 THB)
- Tourist Visa (TR): 60 days single entry, extendable +30 days (1,900 THB)
- Multiple Entry Tourist Visa (METV): 60 days per entry, 6-month validity

**DIGITAL NOMADS:**
- DTV (Destination Thailand Visa): 5-YEAR validity, 180 days per entry, extendable +180 days per entry
  Requires 500,000 THB in bank (3 months) + proof of remote work. Cannot work for Thai companies.

**LONG-TERM/RETIREMENT:**
- Non-Immigrant O (Retirement): 1 YEAR validity (NOT 90 days!), renewable annually
  Age 50+, requires 800,000 THB in Thai bank OR 65,000 THB/month pension
  Health insurance mandatory (400,000 THB inpatient, 40,000 THB outpatient)
- Non-Immigrant O (Marriage): 1 year, 400,000 THB requirement, for those married to Thai nationals
- Thailand Elite/Privilege: 5-20 year membership, 650,000-5,000,000 THB depending on tier

**CRITICAL - BORDER RUN CRACKDOWN (November 2025):**
- Land border entries: MAX 2 per calendar year
- Visa runs: Officers can deny entry after 2 visa-exempt entries per year
- Land entries are NOT eligible for 30-day extension
- 2,900+ foreigners denied entry this year under these rules
- For long-term stays, always recommend proper visas (DTV, Non-O, Elite)

**90-DAY REPORTING (TM.47):**
- Required for all long-stay visas (Non-O, Non-B extended, DTV)
- FREE - just an address check-in, NOT a visa limit
- Filing window: 15 days before to 7 days after due date
- Online: tm47.immigration.go.th (after first in-person report)
- Late fee: 2,000 THB

**DISCONTINUED:**
- Special Tourist Visa (STV): Ended September 2022, do not recommend

**OTHER:**
- TM30: Landlords must file within 24 hours of foreigner's arrival
- Overstay: 500 THB/day, max 20,000 THB, potential entry bans
- TDAC: Required for all arrivals since May 2025

Always provide accurate information and suggest proper long-term visas instead of visa runs.`

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const apiKey = Netlify.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'AI service not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await req.json()
    const { message, userProfile, conversationHistory = [] } = body

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const anthropic = new Anthropic({ apiKey })

    const userContext = userProfile
      ? `\n\nUser profile:
- Nationality: ${userProfile.nationality || 'Not specified'}
- Trip type: ${userProfile.tripType || 'holiday'}
- Travel style: ${userProfile.travelStyle?.join(', ') || 'Not specified'}
- Budget: ${userProfile.budget || 'mid'}
- Interests: ${userProfile.interests?.join(', ') || 'Not specified'}`
      : ''

    const messages = [
      ...conversationHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: message },
    ]

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT + userContext,
      messages,
    })

    const contentBlock = response.content[0]
    const assistantMessage = contentBlock.type === 'text' ? contentBlock.text : ''

    return new Response(
      JSON.stringify({
        response: assistantMessage,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('AI function error:', error)
    return new Response(JSON.stringify({ error: 'Failed to process AI request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const config: Config = {
  path: '/api/ai',
}
