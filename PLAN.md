# Fix Onward Reservation login/trial loop + clean up uncommitted AI cost-risk work

## Context

The CEO got stuck in a loop trying to book an Onward Reservation: click "Onward Reservation" → get told to sign in → land back on Dashboard with nothing changed → click "Start Free Trial" → sign in again → back on Dashboard, still nothing changed.

Investigation (3 parallel Explore agents + direct file verification) found this wasn't a literal infinite redirect — there's no `router.beforeEach` guard anywhere in the app, so `requiresAuth`/`requiresPro` route meta is purely decorative. It was **three linked navigation-intent bugs**:

1. `src/views/OnwardTicketView.vue:400` — the "Sign in to continue" button was a `RouterLink to="/dashboard"`. It never went to `/auth/sign-in` at all.
2. `src/composables/useSubscription.ts:30-35` (`startCheckout`) — when called while logged out, it called `signIn('/dashboard?upgrade=true')` and returned null, discarding the "start a trial" intent entirely.
3. `src/views/DashboardView.vue:32` only checked `route.query.upgrade === 'success'`, never `'true'` (the value `useSubscription` actually sends pre-checkout), so that signal was silently dropped.

Backend confirms Onward Reservation is auth-only (not Pro-gated) by design — `db/migrations/012_onward_bookings.sql` requires `user_id NOT NULL`, `013_onward_bookings_pro.sql` adds dual pricing (Pro = free, non-Pro = $12), and `netlify/functions/onward-ticket.mts` enforces only `requireAuthSafe()`.

Separately, a code review of already-uncommitted AI-cost-abuse hardening work (rate limiting, anonymous usage quotas, shared-secret check — documented in `AI-COST-RISK.md`) found the last local commit (`6998a24`) was broken: it referenced `lib/rate-limit.mts`, `validateAppSecret`, and `checkAndIncrementAnonUsage`, none of which existed in that commit.

The personalization/UI-complexity concern ("personalization in multiple places?", "too complex ui/ux") was diagnosed but no code changes were made for it — treated as a separate future design pass.

---

## Part 1 — Fix the Onward Reservation / trial loop — ✅ DONE (uncommitted)

**`src/views/OnwardTicketView.vue`**
- Added `useAuth()` import, replaced the broken `RouterLink to="/dashboard"` with a button calling `signIn('/onward-ticket')`. Verified live: clicking it now lands on `/auth/sign-in?redirect=%2Fonward-ticket`.

**`src/views/DashboardView.vue`**
- Added `useRouter`, capture+clear `route.query.upgrade` on mount, branch on `'success'` (existing) vs `'true'` (new — auto-resumes `startCheckout()` so the interrupted "Start Free Trial" click completes after login instead of silently requiring a second click). Verified live: clicking "Start Free Trial" while logged out redirects to `/auth/sign-in?redirect=%2Fdashboard%3Fupgrade%3Dtrue`.

**Status:** verified via `npm run build`, live browser click-through of both redirect chains. Not yet committed — was intentionally left for review (see TODO.md).

**Known minor residual issue, not fixed:** `userStore.isAuthenticated` isn't persisted to localStorage, so an already-logged-in user hitting `/onward-ticket` via hard reload could see a brief flash of the sign-in gate before the reactive `v-if` updates. Cosmetic, self-resolving.

---

## Part 2 — Clean up the uncommitted AI cost-risk work — ✅ DONE (committed `70c669d`)

- Committed `lib/security.mts`, `lib/usage.mts`, `lib/rate-limit.mts` (new), `db/migrations/017_anon_ai_usage.sql` (new), `attraction-ai.test.ts`, `AI-COST-RISK.md` — completing what `6998a24` referenced but never included.
- Wired the frontend to send `x-app-secret` (`useApi.ts` + `.env.template` entries for `APP_SHARED_SECRET`/`VITE_APP_SHARED_SECRET`).
- Fixed a collateral bug found during verification: `enrich-place.test.ts` was missing the `resetRateLimitsForTests()` call its sibling test files got, causing 3 tests to fail from leaked rate-limit state.
- Applied migration 017 to Neon (`hidden-darkness-69201067` / `neondb`) — verified `ai_anon_usage` table schema via query.
- Verified HEAD builds/typechecks clean in an isolated `git worktree` checkout (confirms the commit is no longer broken standalone).

**Not done — deferred, see TODO.md:** setting real `APP_SHARED_SECRET`/`VITE_APP_SHARED_SECRET` values in Netlify + redeploying; adding automated 401/429/anon-quota test cases.

---

## Part 3 — Personalization / UI complexity — diagnosis only, no changes

Recorded for a future design pass:
- Header (every page): "Go Pro" pill + "Personalized"/profile-% chip render side by side (`AppHeader.vue:201-256`), plus `AppFooter.vue:36` footer "Go Pro" link.
- Dashboard alone stacks 3 separate upgrade/personalization panels: "Complete Your Profile" card, "Plan Your Perfect Trip" Pro-upsell panel, "Today's AI Usage" panel with its own embedded upgrade link.
- Profile-completion percentage logic independently reimplemented 3 times (`DashboardView.vue`, `AppHeader.vue`, `PersonalizationBar.vue`) rather than shared.
- "Upgrade to Pro" CTAs duplicated with bespoke copy across 10+ views.
- Separately noticed: `SafetyView`, `NinetyDayView`, `MedicalView`, `CostCalculatorView`, `SetupGuideView` declare `requiresPro: true` in `routes.ts` but aren't wrapped in `<ProGate>` — currently accessible for free. Flagged, not fixed (see TODO.md).

---

## Verification performed

1. `npm run build` — clean, before and after all changes.
2. `npx vitest run` — 1305/1306 passing (up from 1292/1306 baseline); the 1 remaining failure (`weather.test.ts`, temple dress-code tip) is pre-existing and unrelated.
3. Live browser click-through (via headless browse) of both redirect chains in Part 1.
4. Isolated `git worktree` + `vue-tsc -b` on HEAD to confirm commit `70c669d` is internally consistent.
5. Neon schema query confirming `ai_anon_usage` table exists with expected columns.
