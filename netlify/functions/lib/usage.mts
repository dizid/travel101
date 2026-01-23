import type { NeonQueryFunction } from '@neondatabase/serverless'

// Daily limits for free users (1 per feature to encourage Pro upgrade)
export const FREE_LIMITS = {
  general_chat: 1,
  attraction_intro: 1,
  attraction_tips: 1,
  attraction_chat: 1,
  packing: 1,
} as const

export type FeatureType = keyof typeof FREE_LIMITS

export interface UsageCheckResult {
  allowed: boolean
  currentUsage: number
  limit: number
  remaining: number
  isPro: boolean
}

export interface UsageData {
  used: number
  limit: number
  remaining: number
}

/**
 * Check if user can use a feature and increment usage counter
 * Pro users always get unlimited access
 */
export async function checkAndIncrementUsage(
  db: NeonQueryFunction<false, false>,
  userId: string,
  featureType: FeatureType
): Promise<UsageCheckResult> {
  // Check if user is Pro
  const userResult = await db`
    SELECT is_pro FROM user_profiles WHERE user_id = ${userId}
  `
  const isPro = userResult.length > 0 && userResult[0].is_pro

  // Pro users have unlimited access - still track for analytics
  if (isPro) {
    await db`
      INSERT INTO ai_usage (user_id, feature_type, usage_date, usage_count)
      VALUES (${userId}, ${featureType}, CURRENT_DATE, 1)
      ON CONFLICT (user_id, feature_type, usage_date)
      DO UPDATE SET
        usage_count = ai_usage.usage_count + 1,
        updated_at = NOW()
    `
    return {
      allowed: true,
      currentUsage: 0,
      limit: Infinity,
      remaining: Infinity,
      isPro: true,
    }
  }

  // Get current usage for free user
  const usageResult = await db`
    SELECT usage_count FROM ai_usage
    WHERE user_id = ${userId}
      AND feature_type = ${featureType}
      AND usage_date = CURRENT_DATE
  `

  const currentUsage = usageResult.length > 0 ? usageResult[0].usage_count : 0
  const limit = FREE_LIMITS[featureType]

  // Check if limit reached
  if (currentUsage >= limit) {
    return {
      allowed: false,
      currentUsage,
      limit,
      remaining: 0,
      isPro: false,
    }
  }

  // Increment usage
  await db`
    INSERT INTO ai_usage (user_id, feature_type, usage_date, usage_count)
    VALUES (${userId}, ${featureType}, CURRENT_DATE, 1)
    ON CONFLICT (user_id, feature_type, usage_date)
    DO UPDATE SET
      usage_count = ai_usage.usage_count + 1,
      updated_at = NOW()
  `

  return {
    allowed: true,
    currentUsage: currentUsage + 1,
    limit,
    remaining: limit - currentUsage - 1,
    isPro: false,
  }
}

/**
 * Get usage status for all features (for dashboard display)
 */
export async function getUsageStatus(
  db: NeonQueryFunction<false, false>,
  userId: string
): Promise<{ usage: Record<FeatureType, UsageData>; isPro: boolean }> {
  // Check if user is Pro
  const userResult = await db`
    SELECT is_pro FROM user_profiles WHERE user_id = ${userId}
  `
  const isPro = userResult.length > 0 && userResult[0].is_pro

  // Pro users get unlimited
  if (isPro) {
    const usage = Object.fromEntries(
      Object.keys(FREE_LIMITS).map(key => [
        key,
        { used: 0, limit: Infinity, remaining: Infinity }
      ])
    ) as Record<FeatureType, UsageData>
    return { usage, isPro: true }
  }

  // Get today's usage for free user
  const usageResult = await db`
    SELECT feature_type, usage_count
    FROM ai_usage
    WHERE user_id = ${userId}
      AND usage_date = CURRENT_DATE
  `

  const usageMap = new Map(usageResult.map(r => [r.feature_type, r.usage_count]))

  const usage = Object.fromEntries(
    Object.entries(FREE_LIMITS).map(([feature, limit]) => {
      const used = usageMap.get(feature) || 0
      return [feature, { used, limit, remaining: Math.max(0, limit - used) }]
    })
  ) as Record<FeatureType, UsageData>

  return { usage, isPro: false }
}

/**
 * Check usage without incrementing (for display purposes)
 */
export async function checkUsage(
  db: NeonQueryFunction<false, false>,
  userId: string,
  featureType: FeatureType
): Promise<UsageData & { isPro: boolean }> {
  const userResult = await db`
    SELECT is_pro FROM user_profiles WHERE user_id = ${userId}
  `
  const isPro = userResult.length > 0 && userResult[0].is_pro

  if (isPro) {
    return { used: 0, limit: Infinity, remaining: Infinity, isPro: true }
  }

  const usageResult = await db`
    SELECT usage_count FROM ai_usage
    WHERE user_id = ${userId}
      AND feature_type = ${featureType}
      AND usage_date = CURRENT_DATE
  `

  const used = usageResult.length > 0 ? usageResult[0].usage_count : 0
  const limit = FREE_LIMITS[featureType]

  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    isPro: false,
  }
}
