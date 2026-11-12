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

// Ceiling per day for ALL counted AI calls together (free + anonymous; Pro calls are
// counted too but never refused) (T-0569). Free accounts are instant, so per-account
// limits alone didn't bound Marc's Anthropic bill. ~200 Haiku calls is well under $2.
export const FREE_GLOBAL_DAILY_LIMIT = 200

/** The quota result from a counting INSERT ... RETURNING usage_count (no row = refused). */
function countedResult(rows: Record<string, unknown>[], limit: number): UsageCheckResult {
  if (rows.length === 0) {
    return { allowed: false, currentUsage: limit, limit, remaining: 0, isPro: false }
  }
  const currentUsage = Number(rows[0].usage_count) || 1
  return { allowed: true, currentUsage, limit, remaining: Math.max(0, limit - currentUsage), isPro: false }
}

// Daily limits for anonymous (unauthenticated) callers, keyed by IP.
// Lower than the free authenticated tier on purpose: anonymous traffic has
// no account to upgrade and no way to tie abuse to a real identity, so the
// cap is tighter. This is the real fix for the "anonymous callers skip the
// quota entirely" gap -- previously these requests hit no quota at all.
export const ANON_LIMITS: Record<FeatureType, number> = {
  general_chat: 1,
  attraction_intro: 1,
  attraction_tips: 1,
  attraction_chat: 1,
  packing: 1,
}

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
  featureType: FeatureType,
): Promise<UsageCheckResult> {
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

  const limit = FREE_LIMITS[featureType]

  // Count and check in ONE statement (T-0569): the old read-then-write let parallel
  // requests from one account all read 0 and all pass. The row lock of ON CONFLICT makes
  // the per-user limit exact; the daily ceiling for all free + anonymous calls is checked
  // in the same statement (parallel calls from different callers can pass it by about as
  // many as run at once). Pro members' calls are logged in ai_usage too but are left out
  // of the ceiling (T-0571): one Pro member browsing attraction pages could otherwise use
  // up the day's 200 and lock out every free and anonymous user.
  const counted = await db`
    INSERT INTO ai_usage (user_id, feature_type, usage_date, usage_count)
    SELECT ${userId}, ${featureType}, CURRENT_DATE, 1
    WHERE (SELECT COALESCE(SUM(u.usage_count), 0) FROM ai_usage u
           WHERE u.usage_date = CURRENT_DATE
             AND NOT EXISTS (SELECT 1 FROM user_profiles p WHERE p.user_id = u.user_id AND p.is_pro))
      + (SELECT COALESCE(SUM(usage_count), 0) FROM ai_anon_usage WHERE usage_date = CURRENT_DATE)
      < ${FREE_GLOBAL_DAILY_LIMIT}
    ON CONFLICT (user_id, feature_type, usage_date)
    DO UPDATE SET
      usage_count = ai_usage.usage_count + 1,
      updated_at = NOW()
    WHERE ai_usage.usage_count < ${limit}
    RETURNING usage_count
  `
  return countedResult(counted, limit)
}

/**
 * Get usage status for all features (for dashboard display)
 */
export async function getUsageStatus(
  db: NeonQueryFunction<false, false>,
  userId: string,
): Promise<{ usage: Record<FeatureType, UsageData>; isPro: boolean }> {
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

/**
 * Check and increment usage for an ANONYMOUS (unauthenticated) caller,
 * tracked by a client-IP-derived identifier instead of user_id.
 *
 * This is the real fix for the cost-abuse gap: previously, AI-calling
 * functions only checked/incremented the DB-backed quota when userId was
 * truthy, so any request that omitted the x-user-id header (or had no
 * valid JWT) bypassed the quota system entirely and got unlimited free
 * Claude API calls. Anonymous callers now get a real quota too, tracked in
 * a separate ai_anon_usage table (no FK to user_profiles, since an IP-keyed
 * "identity" is never guaranteed to map to a real user row).
 *
 * NOTE: IP-based identity is weak (shared NAT/proxy, VPNs, IPv6 rotation),
 * which is exactly why the anonymous limit is lower than the free
 * authenticated limit -- it's a deterrent against casual/scripted abuse,
 * not a strong identity system. Authenticated users still get the stronger,
 * per-account FREE_LIMITS path above.
 */
export async function checkAndIncrementAnonUsage(
  db: NeonQueryFunction<false, false>,
  anonId: string,
  featureType: FeatureType,
): Promise<UsageCheckResult> {
  const limit = ANON_LIMITS[featureType]

  // One statement, same as checkAndIncrementUsage (T-0569).
  const counted = await db`
    INSERT INTO ai_anon_usage (anon_id, feature_type, usage_date, usage_count)
    SELECT ${anonId}, ${featureType}, CURRENT_DATE, 1
    WHERE (SELECT COALESCE(SUM(u.usage_count), 0) FROM ai_usage u
           WHERE u.usage_date = CURRENT_DATE
             AND NOT EXISTS (SELECT 1 FROM user_profiles p WHERE p.user_id = u.user_id AND p.is_pro))
      + (SELECT COALESCE(SUM(usage_count), 0) FROM ai_anon_usage WHERE usage_date = CURRENT_DATE)
      < ${FREE_GLOBAL_DAILY_LIMIT}
    ON CONFLICT (anon_id, feature_type, usage_date)
    DO UPDATE SET
      usage_count = ai_anon_usage.usage_count + 1,
      updated_at = NOW()
    WHERE ai_anon_usage.usage_count < ${limit}
    RETURNING usage_count
  `
  return countedResult(counted, limit)
}
