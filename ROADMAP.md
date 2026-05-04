# Roadmap

> **For AI reviewers**: This file lists in-flight and proposed work. Each item has a **Status**, **Definition of done**, and **Verification** block. When reviewing, please flag any item where the status doesn't match the working tree. Do not propose changes outside the **In scope** lists. Items in [Out of scope](#out-of-scope) are intentionally excluded.

---

## Status snapshot (as of 2026-04-30)

| Item | Status | Branch | Notes |
|---|---|---|---|
| PR1 — UpgradeModal honesty fix | 🟡 IMPLEMENTED, NOT COMMITTED | working tree | Copy is already truthful in both files; needs commit + E2E regression test |
| PR2 — HomeView redesign | 🟡 IMPLEMENTED (90%), NOT COMMITTED | working tree | 8 of 9 sections present; "AI Superpowers" row was dropped — see [PR2 deviation](#pr2-deviation) |
| PR3 — WelcomeWizard onboarding | 🟡 IMPLEMENTED, NOT COMMITTED | working tree | Component built; mounted in HomeView; needs E2E spec |
| PR4 — Auth pages (`/auth/sign-in`, `/auth/sign-up`) | ✅ SHIPPED | `8bd4fc1` (main) | See [Recently shipped](#recently-shipped) |
| PR5 — Onward Ticket DOB picker + auth gate | ✅ SHIPPED | `7ec6618` (main) | See [Recently shipped](#recently-shipped) |
| PR6 — `/simplify` review pass | ✅ SHIPPED | folded into `9db6a22` (main) | See [Recently shipped](#recently-shipped) |
| PR7 — Intent-picker hero (Layer A) | 🔵 IN PROGRESS | working tree | Replaces hero with "I want to…" cards + trust strip + trial CTA |
| PR8 — Persona-aware capabilities (Layer B) | ⬜ NOT STARTED | — | Re-orders capabilities by `prefs.tripType` |
| PR9 — Intent nav + proof signals (Layer C) | ⬜ NOT STARTED | — | Mega-menu + social-proof counter + freshness banner |
| Affiliate integration phases | 📋 PROPOSED — separate workstream | — | See [Affiliate workstream](#affiliate-workstream) |

**Legend**: ✅ shipped to prod · 🟡 implemented locally, not committed · 🔵 in progress · ⬜ not started · 📋 proposed

**Immediate next action**: ship PR1 + PR2 + PR3 as a single bundled commit (or three sequential commits — see [Commit strategy](#commit-strategy)) once E2E specs are added. All three are mutually consistent in the working tree.

---

## Recently shipped

### PR4 — Auth pages (`8bd4fc1`)
`useAuth.signIn()` was redirecting to a route that didn't exist, so any unauthenticated upgrade flow ("Go Pro" → `startCheckout` → `signIn`) hit the 404 catch-all. Built local pages calling `authClient.signIn.email()` / `authClient.signUp.email()` (Neon Auth SDK is programmatic-only — no hosted UI). Pages honor `?redirect=` query param, default to `/dashboard`. Skipped during SSG prerender (auth client is browser-only). **Unblocks**: Pro upgrade flow, OnwardTicket sign-in gate.

### PR5 — Onward Ticket DOB picker + auth gate (`7ec6618`)
- **DOB picker**: replaced Ant `DatePicker` (which was showing year-decade 2040-2049 due to a `defaultPickerValue` interaction bug) with native `<input type="date">`. iOS gives a wheel picker, Android a scroll picker. Removed `dobDayjs` computed bridge — `passenger.born_on` is already `YYYY-MM-DD`. E2E `fillDob()` collapsed from 17 lines of flaky calendar nav to a one-liner.
- **Auth gate**: `/onward-ticket` now shows a friendly sign-in card to anonymous users instead of letting them complete Steps 1-2 and hit a 401 "No authentication provided" wall at payment. The DB requires `onward_bookings.user_id NOT NULL`; the route already declared `requiresAuth: true` but no router guard enforced it.

### PR6 — `/simplify` code review pass (folded into `9db6a22`)
- og:image reverted from `.svg` to `.png` (FB/Twitter/LinkedIn/WhatsApp don't render SVG previews)
- Parallelized `fetchBySlug` + `fetchAll` in `GuideDetailView` and `FestivalDetailView` (one fewer round-trip)
- Added `if (!data.value)` guards in `onMounted` for SSG-prerendered detail views (no double-fetch on hydration)
- Removed redundant `loading.value = false` in heritage SSR branches (`finally` already handles it)
- Replaced 8 `waitForTimeout` calls in `onward-ticket.spec.ts` with proper Playwright `waitFor` state assertions

---

## Active workstream — Landing page + onboarding + Pro value story

### Context

`HomeView.vue` previously showed only 3 pillars (Places, Festivals, Heritage) plus a "Plan" tools menu, but the app actually offers ~10 distinct user-facing capabilities (AI Smart Match, AI Itinerary Planner, AI Packing, 211-phrase Phrasebook, Visa Wizard, Cost Calculator, Province Safety Dashboard, 46 Travel Guides, etc.). Bounce rate is 92% and organic traffic is ~0% — visitors don't see the breadth.

Pro subscription ($10/month, 7-day trial) is real and mostly enforced, but it was invisible on the landing page — visitors only encountered it when they hit a gate deep in the app. There was no onboarding flow.

This workstream addresses three things:
1. Make the breadth of the site clear on the landing page (PR2).
2. Add a small, short onboarding for first-time visitors (PR3).
3. Communicate the Pro value proposition honestly with no overselling (PR1).

It also patches a "truth-in-advertising" gap: `UpgradeModal.vue` previously listed Pro benefits ("Persistent Chats", "Smart Alerts") that are not enforced in code; `ProGate.vue` previously listed "Expense Tracking" and "Priority Support" which don't exist.

### What's actually gated as Pro (enforced in code)

| Feature | Gate type | File |
|---|---|---|
| AI Itinerary Planner | `ProGate` (full feature) | `src/views/ItineraryView.vue` |
| AI Packing Lists | `ProGate` (full feature) | `src/views/PackingView.vue` |
| Travel Alerts dashboard | `ProGate` (full feature) | `src/views/AlertsView.vue` |
| Smart Match favorites | `ProGate` (favoriting action) | `src/views/SmartMatchView.vue` |
| AI daily usage limits (1/day → unlimited) | Backend `checkAndIncrementUsage()` | `netlify/functions/lib/usage.mts` |
| Onward Tickets | Pro = 2 free/month, free = $0.99 via Stripe | `netlify/functions/onward-ticket.mts` |
| Cost Calculator + 90-Day | `isPro` check (softer UX) | `src/views/CostCalculatorView.vue`, `src/views/NinetyDayView.vue` |

**Not enforced — must NOT advertise**: "Persistent Chats", proactive "Smart Alerts" notifications, server-side Local Secrets check, Expense Tracking, Priority Support.

### Commit strategy

**Recommended**: ship as 3 sequential commits in the order PR1 → PR2 → PR3 so that each commit is independently reviewable and revertible. PR1 is the lowest-risk, highest-honesty change. PR2 depends on PR1's truthful copy (the `#pricing` table reuses the same feature list). PR3 is the only one that adds a new file.

**Acceptable alternative**: single bundled commit titled `feat: landing-page revamp (PR1+PR2+PR3)`. Use only if E2E specs are co-located.

---

### PR1 — UpgradeModal honesty fix

**Status**: 🟡 IMPLEMENTED, NOT COMMITTED. Both files in working tree contain the truthful copy.

#### In scope

- `src/components/ui/UpgradeModal.vue` — replace `proFeatures` array
- `src/components/ui/ProGate.vue` — replace `proFeatures` array

#### Target state (already present in working tree)

```ts
// UpgradeModal.vue — line 21
const proFeatures = [
  { icon: '🎯', label: 'AI Itinerary Planner', description: 'Multi-day plans, ICS & PDF export' },
  { icon: '🎒', label: 'AI Packing Lists', description: 'Weather + activity-aware' },
  { icon: '♾️', label: 'Unlimited AI usage', description: 'No daily limits on Smart Match, Chat, tools' },
  { icon: '⭐', label: 'Smart Match favorites', description: 'Save your top destinations' },
  { icon: '✈️', label: 'Onward Tickets', description: '2 free bookings/month' },
  { icon: '🔔', label: 'Travel Alerts dashboard', description: 'Visa, weather, safety alerts in one view' },
]
```

```ts
// ProGate.vue — line 14
const proFeatures = [
  'AI Itinerary Planner — multi-day plans, ICS & PDF export',
  'AI Packing Lists — weather + activity-aware',
  'Unlimited AI usage — no daily limits',
  'Smart Match favorites',
  'Onward Tickets — 2 free bookings/month',
  'Travel Alerts dashboard',
]
```

Both lists must remain semantically identical (same 6 items, same order). Reviewers: if you change one, change the other.

#### Definition of done

- [ ] Both files committed.
- [ ] No occurrences of "Persistent Chats", "Smart Alerts", "Expense Tracking", or "Priority Support" anywhere in `src/`.
- [ ] E2E `tests/e2e/pro-upgrade.spec.ts` includes a regression assertion: `await expect(page.locator('text=Persistent Chats')).toHaveCount(0)`.

#### Verification

```bash
npm run build                                                    # passes
grep -RIn "Persistent Chats\|Smart Alerts\|Expense Tracking\|Priority Support" src/   # zero hits
npx playwright test pro-upgrade.spec --project=chromium --workers=1   # green
```

#### Risk: 🟢 low — pure copy change, no logic.

---

### PR2 — HomeView redesign

**Status**: 🟡 IMPLEMENTED ~90%, NOT COMMITTED. 8 of 9 sections specified are present in `src/views/HomeView.vue`.

#### Verified present in working tree

| # | Section | Anchor / heading | HomeView line(s) |
|---|---|---|---|
| 1 | Hero | — | ~138 |
| 2 | Capabilities grid | `id="capabilities"` | ~245–~298 (8 cards from `capabilities` array, line 46) |
| 3 | Upcoming festival banner | `<UpcomingFestivalBanner />` | ~301 |
| 4 | Hidden Gems | "Hidden Gems" heading | ~309–~341 |
| 5 | Personalization invite | — | ~342–~400 |
| 6 | Free vs Pro pricing table | `id="pricing"` | ~402–~485 |
| 7 | Booking Partners | — | ~486–~527 |
| 8 | Bottom CTA | — | ~528+ |

#### PR2 deviation

The original spec listed a 9th section — **"AI Superpowers row"** with horizontal scroll-snap on mobile, 4 cards (Smart Match, AI Itinerary, AI Packing, AI Chat). This section is **not present** in the working tree.

**Decision required from CEO** (not for AI reviewer to decide):
- **Option A — descope it**. The 8-card capabilities grid (#2) already surfaces every AI feature. Adding a second AI-only row would be redundant. Recommended.
- **Option B — ship it**. Insert between sections #3 and #4. Spec retained for reference in the [original spec archive](#archive-original-pr2-section-4).

**If A**: delete this paragraph, mark PR2 as 🟡 IMPLEMENTED 100%, proceed to commit.
**If B**: file path `src/views/HomeView.vue`, insert at ~308.

#### In scope

- `src/views/HomeView.vue` — sole file modified.

#### Mobile-first conventions (verify on review)

- Grids: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- Stats row: single line on mobile, smaller font, `gap-4`
- Tap targets: `min-h-[44px]`
- Reused utilities only: `btn-thai`, `btn-thai-outline`, `card-thai`, `text-gradient-thai`, `shadow-soft`, `animate-fade-in`, `animate-slide-up`, `animate-delay-{100..400}`
- All new color classes are literal (Tailwind 3 doesn't dynamically resolve) — see `Capability.iconBg` / `iconText` pattern at `HomeView.vue:46`.

#### Definition of done

- [ ] PR1 committed first (this PR's `#pricing` section reuses the truthful feature list).
- [ ] Decision recorded on PR2 deviation (A or B).
- [ ] `tests/e2e/home.spec.ts` updated: replace assertions for "Discover Thailand", "Plan Your Trip" with new headings (`Everything you need`, `Free vs Pro`).
- [ ] `tests/e2e/pro-upgrade.spec.ts` updated: assert "Free vs Pro" and "$10/month" are visible on `/`.

#### Verification

```bash
npm run build                                                              # vite-ssg pre-renders Home — must pass
npm run dev                                                                # then visit / on 375px and 1280px viewports
npx playwright test home.spec pro-upgrade.spec --project=chromium --workers=1   # green
```

Manual check: `#capabilities` and `#pricing` anchors scroll into view from hero CTAs.

#### Risk: 🟡 medium — large diff (~360 lines), but isolated to one file. SSG pre-render must stay green.

---

### PR3 — WelcomeWizard (first-visit onboarding)

**Status**: 🟡 IMPLEMENTED, NOT COMMITTED. `src/components/features/WelcomeWizard.vue` exists (untracked, 319 lines). Mounted and triggered in `src/views/HomeView.vue:11,25–33`.

#### Verified present in working tree

- `src/components/features/WelcomeWizard.vue` — 3-step wizard, props `isOpen`, emits `close` + `complete`.
- `src/views/HomeView.vue:25–33` — trigger logic (SSG-safe, only reads localStorage in `onMounted`).
- `src/views/HomeView.vue:11` — import.

```ts
// HomeView.vue:25–33 (verified present)
const showWizard = ref(false)
function openWizard() { showWizard.value = true }
onMounted(() => {
  if (typeof window === 'undefined') return
  const done = localStorage.getItem('welcome-wizard-completed')
  if (!done && !userStore.hasProfile) showWizard.value = true
})
```

#### Wizard step contract (writes to existing `userStore.prefs` schema — no DB change)

| Step | Field(s) written | Source type |
|---|---|---|
| 1 — Trip purpose | `prefs.tripType` | `TripType` (`@/types`) |
| 2 — Travel style + group | `prefs.travelStyle[]`, `prefs.groupType` | `TravelStyle`, `GroupType` |
| 3 — Nationality | `prefs.nationality` (string) | top-10 chip presets + free text |

`hasProfile` (computed in `userStore.ts:29–32`) flips when `nationality !== ''` AND `travelStyle.length > 0` — both are written by the wizard's `finish()` handler. Verified.

On **skip**: still set `welcome-wizard-completed=1` so we don't re-prompt; don't write prefs.

#### In scope (remaining work)

- `tests/e2e/home.spec.ts` and any other spec hitting `/` — add `addInitScript` to set the completion flag, otherwise the wizard backdrop will intercept hero CTA clicks:
  ```ts
  await page.addInitScript(() => localStorage.setItem('welcome-wizard-completed', '1'))
  ```
- New spec assertions: with cleared storage the wizard appears; clicking Skip closes it and sets the flag; completing populates `userStore.prefs`.

#### Definition of done

- [ ] WelcomeWizard.vue tracked (`git add`) and committed.
- [ ] HomeView.vue trigger committed in same commit.
- [ ] All E2E specs hitting `/` have `addInitScript` for the completion flag (otherwise they'll regress on this PR).
- [ ] New assertions in `home.spec.ts`: cleared-storage path shows wizard; skip path closes + sets flag; complete path populates `prefs.nationality`.

#### Verification

```bash
npm run dev                                                  # then in DevTools console:
localStorage.removeItem('welcome-wizard-completed')          # reload / → wizard appears
# Complete wizard → reload → wizard does NOT reappear, profile populated
# Skip wizard → reload → wizard does NOT reappear, profile empty

npm run build                                                # SSG pre-renders without wizard mounting
npx playwright test home.spec --project=chromium --workers=1 # green
```

#### Risk: 🟡 medium — affects every E2E spec that lands on `/` (backdrop blocks clicks). Coordinate with PR2 spec updates.

---

### Critical files (cross-PR)

| File | PRs |
|---|---|
| `src/views/HomeView.vue` | PR2 + PR3 |
| `src/components/ui/UpgradeModal.vue` | PR1 |
| `src/components/ui/ProGate.vue` | PR1 |
| `src/components/features/WelcomeWizard.vue` | PR3 (new file) |
| `src/stores/userStore.ts` | read-only reference (`updatePreferences`, `hasProfile`) |
| `src/composables/useSubscription.ts` | read-only reference (CTA wiring) |
| `tests/e2e/home.spec.ts` | PR2 + PR3 |
| `tests/e2e/pro-upgrade.spec.ts` | PR1 + PR2 |

### Combined end-to-end verification (after PR1 + PR2 + PR3)

```bash
npm run build                                                              # vite-ssg pre-render must succeed
npm run test:run                                                           # unit tests green
npx playwright test home.spec pro-upgrade.spec --project=chromium --workers=1   # E2E green
```

Manual:
1. `npm run dev` → open `/` at 375px and 1280px → confirm 8 (or 9) sections render and Free vs Pro shows the 10 honest comparison rows.
2. Clear `localStorage` → reload `/` → WelcomeWizard appears → complete it → Smart Match + Visa Wizard now have profile data.
3. Visit `/itinerary` while logged out → `UpgradeModal` shows 6 honest items, no "Persistent Chats".

---

## Active workstream — UX clarity ("what does this site offer?")

### Context

Current bounce rate is 92%. PR2 added a capabilities grid, but a first-time visitor still fails the 5-second test:
- The hero (`HomeView.vue:138-242`) doesn't disambiguate audience (tourist? nomad? expat?).
- 8 equal-weight capability cards = decision paralysis.
- No primary intent path. No proof signals. Trial CTA is below the fold (Section 6).
- Wizard captures `prefs.tripType` but only Smart Match uses it; the home stays static for everyone.

This workstream is split into three layers, each independently shippable. **Layer A (PR7) ships first** because it's one file, one day, and directly answers the CEO ask.

---

### PR7 — Intent-picker hero (Layer A)

**Status**: 🔵 IN PROGRESS — implemented in working tree alongside this roadmap update.

**Goal**: replace the generic hero with one that names the visitor, names the differentiator, offers three intent-matched paths, and shows the trial CTA above the fold.

#### In scope

- `src/views/HomeView.vue` — replace hero block at lines `138–242` only. Sections 2–8 untouched.

#### Target structure (top → bottom)

1. **Thai greeting pill** — keep as-is (cultural grounding).
2. **H1**: *"Thailand, sorted."* (4 words, scannable.)
3. **Sub-H1**: *"Visa, AI itinerary, onward ticket, safety — in one app."*
4. **Three "I want to…" intent cards** in a single row on `sm+`, stacked on mobile:
   - 🗺️ **Plan my trip** → `/itinerary` if `userStore.hasProfile`, else opens WelcomeWizard
   - 🛂 **Check my visa** → `/visa`
   - ✈️ **Get an onward ticket** → `/onward-ticket`
   Each card has icon, title, one-line outcome ("Multi-day plan with budget", "60-second visa wizard", "Bookable in 2 minutes").
5. **Secondary line under cards** — *"Free to start. $10/month for the AI tools. 7-day free trial, no card required."* with inline `<RouterLink to="#pricing">` "see what's free →".
6. **Trust strip** — single horizontal row, dividers on `md+`:
   `400+ Places · 50+ Festivals · 8 UNESCO · 46 Guides · 211 Phrases · Updated weekly`
   (collapses the existing 5-stat row + adds "Updated weekly").
7. **Optional sub-link** — *"See everything you get →"* anchor to `#capabilities` (preserved from current).

The existing wave divider, gradient backgrounds, and decorative blobs stay.

#### Honest copy guardrails

- Do not write "AI-powered" — write "AI plans your days".
- Do not write "all-in-one travel platform" — write specific features.
- "Free trial" must say "no card required" because Stripe checkout actually does require a card. **Verify before merge** — if Stripe collects card upfront, change copy to "$0 for 7 days".

#### Definition of done

- [ ] Hero block replaced; lines 138–242 replaced (≈ similar net line count).
- [ ] Three intent cards render and route correctly on mobile (375px) and desktop (1280px).
- [ ] "Plan my trip" card opens WelcomeWizard if `userStore.hasProfile === false`, else routes to `/itinerary`.
- [ ] Trial copy verified against actual Stripe checkout behavior.
- [ ] `npm run build` passes (vite-ssg pre-renders).
- [ ] `tests/e2e/home.spec.ts` updated with assertions for new H1 ("Thailand, sorted") and the 3 intent cards.

#### Verification

```bash
npm run build                                                            # vite-ssg pre-render must succeed
npm run dev                                                              # then visit / on 375px and 1280px viewports
npx playwright test home.spec --project=chromium --workers=1             # green
```

Manual: clear localStorage, reload `/`, click "Plan my trip" → wizard opens. Set profile, reload, click "Plan my trip" → routes to `/itinerary`.

#### Risk: 🟢 low — single file, isolated to hero block, no logic outside HomeView.

---

### PR8 — Persona-aware capabilities (Layer B)

**Status**: ⬜ NOT STARTED. Spec only.

**Goal**: capabilities grid re-orders by `userStore.prefs.tripType` so a returning visitor sees their relevant tools first.

#### In scope

- `src/views/HomeView.vue` — convert the static `capabilities` const at line 46 into a `computed` that filters/orders by `prefs.tripType`.

#### Persona orderings

| Persona (`tripType`) | Top 4 (shown prominently) | Remaining (collapsed under "see all") |
|---|---|---|
| `holiday` (default) | AI Itinerary, Smart Match, Visa & Entry, Onward Ticket | Cost & Safety, Festivals & Heritage, AI Packing & Phrasebook, Medical & Emergency |
| `digital_nomad` | Visa & Entry, Setup Guide (via Visa card), Cost & Safety, Phrasebook | AI Itinerary, Festivals & Heritage, Smart Match, Medical & Emergency |
| `expat` | Visa & Entry (90-Day, Countdown), Medical & Emergency, Setup Guide, Cost & Safety | Festivals & Heritage, Phrasebook, Smart Match, AI Itinerary |

A user without `prefs.tripType` set sees the current default ordering — the wizard captures this on first visit (PR3).

#### Definition of done

- [ ] `computed(() => orderedCapabilities)` driven by `userStore.prefs.tripType`.
- [ ] First 4 cards always visible; cards 5–8 behind a "Show all 8 tools" toggle on mobile, always visible on `lg+`.
- [ ] Reactive on wizard completion (no reload needed).
- [ ] No regressions in `home.spec.ts` for the default-persona path.

#### Verification

```bash
npm run dev
# Set localStorage to clear profile → home shows holiday-default order
# Run wizard → pick "Digital nomad" → home re-orders without reload
# Run wizard → pick "Moving here" → home re-orders again
npm run build
npx playwright test home.spec --project=chromium --workers=1
```

#### Risk: 🟢 low — purely client-side, SSG renders the default ordering.

---

### PR9 — Intent nav + proof signals (Layer C)

**Status**: ⬜ NOT STARTED. Spec only.

**Goal**: every page (not just home) communicates breadth and freshness via the header nav, plus social-proof counter and freshness banner.

#### In scope (multi-file — biggest of the three)

- **Mega-menu in `AppHeader.vue`** — replace flat nav with intent-grouped dropdown:
  - **Plan**: AI Itinerary, Smart Match, Cost Calculator, AI Packing
  - **Visa & Entry**: Visa Wizard, TDAC, 90-Day, Visa Countdown, Onward Ticket
  - **Stay Safe**: Safety, Medical, Emergency, Travel Alerts
  - **Discover**: Attractions, Festivals, Heritage, Travel Guides, Phrasebook
- **New `src/components/ui/SocialProofCounter.vue`** — pulls real counts from new endpoint `netlify/functions/stats.mts`:
  - `onward_bookings` count last 30 days
  - Itinerary generations last 30 days (from `ai_usage`)
  - Newsletter subscribers
  Renders as: *"1,247 travelers planned trips this month."* Mounted on home + dashboard. Cache 1h.
- **New `src/components/ui/FreshnessBanner.vue`** — build-time generated feed of recent content updates (read from `git log` over `db/seed/*` + content tables in `scripts/freshness-feed.ts` → `.ssg-data/freshness.json`). Renders as: *"Updated this week: 12 new attractions, Songkran 2026 dates, new TDAC rules."*
- **"Last updated YYYY-MM-DD" badges** on detail views (already partially specced in [src/utils/seo.ts](/home/marc/DEV/travel/src/utils/seo.ts) but not rendered).

#### Definition of done

- [ ] Mega-menu functional on desktop (hover/click) and mobile (accordion).
- [ ] Stats function returns real counts; shows "Loading…" state under 200ms.
- [ ] Freshness feed regenerates on each `npm run build`.
- [ ] Last-updated badges visible on AttractionDetailView, GuideDetailView, FestivalDetailView, HeritageDetailView.

#### Verification

```bash
npm run build                                              # freshness-feed.ts runs in prefetch
npm run dev
curl http://localhost:3000/.netlify/functions/stats        # returns JSON with 3 counts
# Visit /, /dashboard, any detail page → counter, banner, badge all render
npx playwright test --project=chromium --workers=1
```

#### Risk: 🟡 medium — touches AppHeader (every page), new function + DB query, new build script. Stage behind PR7+PR8.

---

## Out of scope

The AI reviewer should **not** propose changes in any of these areas as part of this roadmap:

- Auth flow (`/auth/sign-in`, `/auth/sign-up`) — shipped in PR4 (`8bd4fc1`).
- Onward Ticket DOB picker, auth gate, or Stripe 3DS recovery — shipped in PR5 (`7ec6618`) + earlier `9db6a22`.
- SSG / sitemap / indexing — owned by [MARKETING-PLAN.md](./MARKETING-PLAN.md), not this file.
- New Pro features beyond what is currently enforced — see [What's actually gated as Pro](#whats-actually-gated-as-pro-enforced-in-code) before suggesting any.
- Affiliate placement intelligence beyond the table below — separate workstream.
- Database migrations — none required for PR1/PR2/PR3.

---

## Affiliate workstream

> Separate from the landing-page workstream. Tracked here for visibility; sequenced after PR1–3 land.

### Phase 1: Sign Up (current)

| Program | Status | Affiliate ID | Priority |
|---|---|---|---|
| Klook | Active | 108922 | 1 (SE Asia activities) |
| 12Go Asia | Active | 14551206 | 2 (Transport bookings) |
| Viator | Active | P00284724 | 3 (Tours backup) |
| Booking.com | Rejected by CJ — quality upgrade done, ready to reapply | — | 4 (Hotels) |
| GetYourGuide | Pending | — | 5 (Tours & activities) |
| SafetyWing | Pending | — | 6 (Travel insurance) |
| Skyscanner | Later (need 5K/mo traffic) | — | 7 (Flights) |
| Agoda | Rejected | 1956706 | Re-apply when more established |

### Phase 2: Basic integration (after IDs obtained)

- **Attraction detail pages**: "Book on Klook" / "Find tours on GetYourGuide" buttons linked to relevant activities.
- **Hotel recommendations**: Booking.com affiliate links inside `attraction_recommendations` rows.
- **Flight search page**: Skyscanner widget or deep links integrated into existing flight search feature.
- **Activity cards**: Link `attraction_tips` and `attraction_secrets` to bookable experiences.

### Phase 3: Smart affiliate links

- Auto-match attractions to Klook / GetYourGuide activities by location + category.
- Contextual hotel suggestions based on user's selected province/area.
- Flight deep links pre-filled with Thailand destination airports.
- Track click-through and conversion rates per program.

### Phase 4: Revenue optimization

- A/B test affiliate placements (inline vs sidebar vs CTA buttons).
- Compare commission performance across programs.
- Prioritize highest-converting programs per content type.
- Add affiliate disclosure in footer/pages (FTC compliance).

---

## Archive — original PR2 Section 4 (AI Superpowers row)

Retained verbatim in case Option B (above) is chosen.

> **AI Superpowers row** (heading "Plan smarter with AI"). Horizontal scroll-snap on `<sm`, 4-col grid on `sm+`. Cards: Smart Match (with mock "92% match" chip), AI Itinerary, AI Packing, AI Chat. `<ProBadge>` where applicable.
