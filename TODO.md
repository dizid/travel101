# TODO

Follow-ups from PLAN.md. Items marked `[x]` were executed as part of this session.

## Done now

- [x] Fix `getPackingTips()` in `netlify/functions/weather.mts` — the "always relevant"
      temple dress-code tip was getting silently dropped by `slice(0, 5)` whenever hot +
      rainy tips both fired (happens every July, current month). Reordered so it's pushed
      first and always survives the cap. Fixes the last failing unit test.
- [x] Add automated test coverage for the AI cost-risk protections (401 missing/invalid
      `x-app-secret`, 429 rate limit, anonymous quota exceeded) — was the doc's own
      flagged "known gap."
- [x] Commit the Onward Reservation fix (`OnwardTicketView.vue`, `DashboardView.vue`) —
      already verified live and via build; no reason to leave it sitting uncommitted.
- [x] Commit the stray `.gitignore` `.gstack/` line picked up from tooling this session —
      harmless (ignores a local tool-state dir), no reason to leave it dangling.

## Deferred — needs your call, not done

- [ ] **Set real `APP_SHARED_SECRET` / `VITE_APP_SHARED_SECRET` values in Netlify + redeploy.**
      Not done: this changes production behavior on live AI endpoints and requires generating
      and storing a real secret. Say the word and I'll set it (`envVarIsSecret: false` per your
      rules), redeploy, and verify with curl.
- [ ] **Add `<ProGate>` enforcement to `SafetyView`, `NinetyDayView`, `MedicalView`,
      `CostCalculatorView`, `SetupGuideView`.** These declare `requiresPro: true` in
      `routes.ts` but currently have zero enforcement — free to access. Not done because
      this is a monetization/product decision (do existing free users get grandfathered?
      is there a heads-up?), not just a bug fix, and it's the same "add a real router guard"
      scope you explicitly deferred earlier in this session.
- [ ] **Personalization/UI decluttering** (header chip + Dashboard card + PersonalizationBar +
      SmartMatch gate all independently reimplementing "complete your profile"; 10+ pages
      with bespoke "Upgrade to Pro" copy). Diagnosed in PLAN.md, explicitly deferred to a
      separate design pass per your earlier answer.

## Verification

- `npm run build` — passes.
- `npx vitest run` — 1306/1306 passing (was 1292/1306 at session start).
