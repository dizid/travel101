
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tech Stack

- **Frontend**: Vue 3 + Vite + TypeScript
- **UI**: Tailwind CSS + Ant Design Vue
- **State**: Pinia stores
- **Database**: Neon (PostgreSQL)
- **Backend**: Netlify Functions (serverless)
- **Auth**: Clerk
- **Payments**: Stripe
- **AI**: Grok/Claude APIs for prompt engineering features

## Commands

```bash
# Development
npm run dev              # Start Vite dev server (port 3000)
netlify dev              # Start with Netlify Functions

# Build & Deploy
npm run build            # Production build
netlify deploy           # Deploy to Netlify

# Testing
npm run test             # Run Vitest unit tests
npm run test:e2e         # Run Playwright E2E tests
```

## Architecture

```
src/
├── components/      # Reusable Vue components (e.g., WarningCard.vue)
├── composables/     # Vue composition functions (useAuth, useAI, useMatcher)
├── stores/          # Pinia stores (userStore, countryStore, subscriptionStore)
├── views/           # Page-level components (DashboardView, VisaView)
├── modules/         # Plugin-based extras (packlist/, itinerary/)
functions/           # Netlify serverless functions (user.js, ai.js, countries.js)
```

**Data Layers**: Users (prefs JSONB) → Countries (theme/packs JSONB) → Infos (visas/warnings) → Extras (type/data) → Prompts (AI templates)

**Key Patterns**:
- Composables for logic separation (useAI handles AI calls with caching/fallback)
- Plugin pattern for modular extras (app.use(PacklistModule))
- Profile-matching via scoring against DB categories
- AI prompts stored in DB as templates, filled with profile data at runtime

## Preferences

- Act like a senior developer
- Write complete, working code - no mocks, stubs, or TODOs
- Use clear comments only when logic isn't self-evident
- Keep existing working code intact when adding features
- Prefer editing existing files over creating new ones
- Use the Neon and Stripe MCP servers for database/payment operations