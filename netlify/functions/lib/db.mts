import { neon } from '@neondatabase/serverless'

export function getDb() {
  const databaseUrl = Netlify.env.get('DATABASE_URL')
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  return neon(databaseUrl)
}

export interface DbUserProfile {
  id: string
  user_id: string
  prefs: Record<string, unknown>
  is_pro: boolean
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: Date
  updated_at: Date
}
