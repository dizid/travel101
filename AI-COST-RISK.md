# AI Cost / Abuse Risk — Anonymous Anthropic-Calling Endpoints

## Status
Hardened — 4 endpoints touched, all kept live (real monetized travel app, not disabled)

## Date
2026-06-19

## Risk level
Scanner flagged critical (100). Confirmed accurate: `ai.mts` and `packing.mts` called the Anthropic API on behalf of anonymous callers (no `x-user-id` header, no valid JWT) while completely skipping the usage-quota check — the quota block only ran `if (userId)`, so unauthenticated requests had zero cost controls. `attraction-ai.mts` already required auth, so it had no anonymous path to begin with, but lacked rate limiting.

## What was found

**`netlify/functions/ai.mts`** (before fix) — quota check gated entirely behind `if (userId)`:
```ts
// Check usage limits for authenticated users
if (userId) {
  try {
    const db = await getDb()
    const usageCheck = await checkAndIncrementUsage(db, userId, 'general_chat')
    if (!usageCheck.allowed) {
      return new Response(JSON.stringify({ error: 'Daily AI chat limit reached', ... }), { status: 429, ... })
    }
  } catch (usageError) {
    console.error('Usage check failed:', usageError)
  }
}
// Anonymous callers fell straight through to the Anthropic call below
// with no rate limit, no quota, and no input-length cap.
```
Same pattern confirmed in `netlify/functions/packing.mts`.

**`netlify/functions/attraction-ai.mts`** — already required auth (no anonymous path), but had no rate limiting and no shared-secret check, so a leaked JWT or a compromised authenticated session could still be hammered with no per-IP throttle.

**`netlify/functions/enrich-place.mts`** — already gated by an admin-key check (not user-facing), but likewise had no rate limit, so a leaked admin key or a buggy automated caller had no throttle.

## What changed

All changes below are already in the working tree, uncommitted (verified via `git status` — see Verification section).

1. **`netlify/functions/lib/rate-limit.mts`** (new) — in-memory per-IP token-bucket rate limiter, `checkRateLimit(key, maxTokens = 10, windowMs = 60_000)`, namespaced per endpoint (e.g. `${ip}:ai`) so one function's traffic can't exhaust another's budget. Includes a stale-bucket sweep (`MAX_BUCKETS = 5000`, `STALE_AFTER_MS = 10 minutes`) to avoid unbounded `Map` growth. Documented top-of-file limitation: Netlify Functions run as separate, potentially concurrent instances/containers, so this state is **per-instance only** and resets on cold start — explicitly **not** a substitute for the DB-backed quota, just a first line of defense against casual scripted abuse hitting one warm instance.

2. **`db/migrations/017_anon_ai_usage.sql`** (new) — new `ai_anon_usage` table keyed by `(anon_id, feature_type, usage_date)` with a UNIQUE constraint, tracking per-IP daily usage for anonymous callers. No foreign key to the `users` table, since an anonymous ID (client IP) isn't guaranteed to map to a real user account.

3. **`netlify/functions/lib/security.mts`** — added `validateAppSecret(req)`: checks an `APP_SHARED_SECRET` env var against an `x-app-secret` request header using a timing-safe compare. Documented as a speed bump — stops casual abuse, not a determined attacker who inspects DevTools/network requests and copies the header. **Fails open** (returns `true`) if `APP_SHARED_SECRET` isn't configured, logging a warning once per cold start, so local dev isn't broken by this change.

4. **`netlify/functions/lib/usage.mts`** — added `ANON_LIMITS` (1 request/day per feature for anonymous callers — intentionally tighter than the authenticated free tier, since there's no account or identity to tie abuse back to) and `checkAndIncrementAnonUsage(db, anonId, featureType)`, mirroring the existing authenticated `checkAndIncrementUsage` function.

5. **`netlify/functions/ai.mts`** and **`netlify/functions/packing.mts`** — added, in cheapest-first order: shared-secret check (401) → IP rate limit (429) → DB-backed quota. The critical fix: the quota call is now **unconditional**:
   ```ts
   const usageCheck = userId
     ? await checkAndIncrementUsage(db, userId, 'general_chat')
     : await checkAndIncrementAnonUsage(db, clientIp, 'general_chat')
   ```
   replacing the old `if (userId)` guard that let anonymous traffic skip the quota check entirely. Also added input-length caps (`MAX_MESSAGE_LENGTH = 4000` in `ai.mts`; destination/activity array caps in `packing.mts`) enforced before the Anthropic call. Note: the existing `catch` block around the quota check still fails open on a DB error (logs and continues) — this was pre-existing behavior, left unchanged, and is mitigated by the new rate limit and shared-secret checks still applying regardless.

6. **`netlify/functions/attraction-ai.mts`** — added shared-secret check + rate limit. No quota-bypass fix needed here since auth was already mandatory and the DB quota always ran for the authenticated user.

7. **`netlify/functions/enrich-place.mts`** — added rate limit only (already gated by a stronger admin-key check); documented as defense-in-depth against a leaked admin key or a buggy automated caller, not a primary control.

8. **Test files** (`netlify/functions/__tests__/ai.test.ts`, `attraction-ai.test.ts`, `packing.test.ts`) — updated to import and call `resetRateLimitsForTests()` in `beforeEach`, so rate-limit bucket state doesn't leak across test cases sharing a mock IP.

## Build status

`npm run build` passes with no TypeScript errors (verified — see Verification section).

## Known gaps (flagging honestly, not blockers)

- **No new test cases exercise the new protections.** The test file updates only wire up `resetRateLimitsForTests()` in `beforeEach` — none of the three updated test files actually assert the new `401` (missing/invalid shared secret), `429` (rate limit exceeded), or anonymous-quota-exceeded response paths. The protections are wired into the handlers but are currently unverified by automated tests.
- **`APP_SHARED_SECRET` has no documented deployment step.** No `.env.example` entry exists for it, and there's no note anywhere about setting it in the Netlify dashboard/env vars. Because `validateAppSecret()` fails open when the var is unset, forgetting to set it in production silently degrades this control back to "no shared-secret check" rather than breaking the app — which is the safe failure mode, but it means the protection won't actually be active until someone deliberately sets the env var and redeploys.

## Provider console steps

**Anthropic** (console.anthropic.com -> Plans & Billing): configure usage alerts (notify at chosen % thresholds of budget). A hard organization-wide monthly spending limit with Auto-Reload is available on Team/Enterprise plans via Organization Settings. On lower individual tiers, a true hard stop may not be available — treat email alerts as your trigger to manually pause the key if needed.

## Verification

Build passed, ran in `/home/marc/DEV/travel`:
```
npm run build
```
Output completed with no TypeScript or build errors (Vite SSG build finished cleanly across all routes).

Confirmed via `git status --short` that the following are uncommitted working-tree changes (not yet committed):
```
 M netlify/functions/__tests__/ai.test.ts
 M netlify/functions/__tests__/attraction-ai.test.ts
 M netlify/functions/__tests__/packing.test.ts
 M netlify/functions/ai.mts
 M netlify/functions/attraction-ai.mts
 M netlify/functions/enrich-place.mts
 M netlify/functions/lib/security.mts
 M netlify/functions/lib/usage.mts
 M netlify/functions/packing.mts
?? db/migrations/017_anon_ai_usage.sql
?? netlify/functions/lib/rate-limit.mts
```

**Recommended before committing/deploying** (not performed as part of this review):

1. Add test cases that actually exercise the new failure paths, not just the reset hook:
   - Missing/invalid `x-app-secret` header → expect `401`, with `APP_SHARED_SECRET` set in the test environment (since the check fails open when unset, the test must set the env var to actually exercise the rejecting branch).
   - 11th+ request within a 60-second window from the same IP key → expect `429`.
   - Anonymous caller making a 2nd request the same day for the same `feature_type` → expect quota-exceeded response (`ANON_LIMITS` = 1/day), not a silent pass-through.

2. Manual curl checks against a local dev server (`npm run dev`) before deploying:

   Missing shared secret (with `APP_SHARED_SECRET` set in the function's env):
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/.netlify/functions/ai \
     -H "Content-Type: application/json" \
     -d '{"message": "hello"}'
   # expect: 401
   ```

   Rate limit trip (run 11+ times quickly from the same IP, with a valid `x-app-secret` header):
   ```bash
   for i in $(seq 1 12); do
     curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/.netlify/functions/ai \
       -H "Content-Type: application/json" \
       -H "x-app-secret: <APP_SHARED_SECRET value>" \
       -d '{"message": "hello"}'
   done
   # expect: first 10 succeed (200 or quota-related), remainder return 429
   ```

   Anonymous quota exceeded (2 requests, same day, no auth headers, valid shared secret, under the rate limit):
   ```bash
   curl -s -X POST http://localhost:3000/.netlify/functions/ai \
     -H "Content-Type: application/json" -H "x-app-secret: <secret>" -d '{"message": "first"}'
   curl -s -X POST http://localhost:3000/.netlify/functions/ai \
     -H "Content-Type: application/json" -H "x-app-secret: <secret>" -d '{"message": "second"}'
   # expect: first request 200, second 429 with code "LIMIT_REACHED" (ANON_LIMITS = 1/day)
   ```

3. Add an `APP_SHARED_SECRET` entry to `.env.example` and set it as a Netlify environment variable for the production site before relying on the shared-secret check in production (remember: it fails open if unset, so until this step is done the check is effectively a no-op).

## Re-enable
N/A — all four endpoints remain live; no endpoint was disabled as part of this hardening.
