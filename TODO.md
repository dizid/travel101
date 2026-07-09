# TODO

Follow-ups from PLAN.md. All three previously-deferred items below were completed in a
follow-up pass.

## Done

- [x] Fix `getPackingTips()` in `netlify/functions/weather.mts` — the "always relevant"
      temple dress-code tip was getting silently dropped by `slice(0, 5)` whenever hot +
      rainy tips both fired (happens every July, current month). Reordered so it's pushed
      first and always survives the cap. Fixes the last failing unit test.
- [x] Add automated test coverage for the AI cost-risk protections (401 missing/invalid
      `x-app-secret`, 429 rate limit, anonymous quota exceeded) — was the doc's own
      flagged "known gap."
- [x] Commit the Onward Reservation fix (`OnwardTicketView.vue`, `DashboardView.vue`).
- [x] Commit the stray `.gitignore` `.gstack/` line picked up from tooling this session.
- [x] **Set real `APP_SHARED_SECRET` / `VITE_APP_SHARED_SECRET` in Netlify + redeployed.**
      Generated a 64-char secret, set it via `netlify env:set` (both server + client vars,
      all contexts/scopes), rebuilt locally (`netlify deploy --build` alone silently skipped
      the rebuild — confirmed via dist mtime — so `.env.local` needed the same var added
      before a real `npm run build` would embed it), and redeployed to production. Verified
      live via curl (no header → 401, wrong header → 401, correct header → 200) and
      confirmed the exact secret string is present in the live served JS bundle.
- [x] **Added `<ProGate>`-equivalent enforcement to `SafetyView`.** Re-checked all 5 flagged
      views by reading their actual templates instead of grepping for the `<ProGate>`
      component: `NinetyDayView`, `MedicalView`, `CostCalculatorView`, and `SetupGuideView`
      already had their own working inline `v-if="!isPro"` gate — only `SafetyView` had zero
      enforcement (just a decorative `ProBadge`). Fixed to match the sibling pattern:
      emergency phone numbers stay free (duplicated at `/emergency`), scam reports/guide/
      reporting are now gated.
- [x] **Personalization/UI decluttering.** Built `useProfileCompleteness` composable
      (replaces 3 duplicated calculations in AppHeader/Dashboard/PersonalizationBar).
      Merged AppHeader's "Go Pro" pill + "Personalized"/profile-% chip into one unified
      slot. Cut Dashboard from ~9 separately-bordered cards to 6 clear sections (profile
      nudge shrunk to one row, removed the 3rd redundant "Upgrade to Pro" copy inside the
      usage meter, merged Destination/booking/weather/currency into one "Trip Tools" card).
      Verified visually in-browser at both `/dashboard` and `/attractions`.

## Not done — explicitly out of scope

- [ ] Standardizing the remaining ~10 bespoke "Upgrade to Pro" copy blocks scattered across
      individual feature pages (CostCalculator, NinetyDay, AttractionDetail, AIChat, etc.)
      into one shared component/copy source. Diagnosed but not touched — a larger follow-up,
      not requested this round.
- [ ] Adding a real `router.beforeEach` guard to enforce `requiresAuth`/`requiresPro` route
      meta app-wide (currently decorative). Explicitly deferred earlier — the per-view inline
      gates cover the actual enforcement need today.

## Verification

- `npm run build` — passes.
- `npx vitest run` — 1321/1321 passing.
- Live production verification: curl against `happyroam.travel` AI endpoints, bundle
  inspection for the embedded secret, and browser screenshots of the new Dashboard and
  Safety page.
- All work committed (`70c669d` through `e5540f9`); working tree clean.
