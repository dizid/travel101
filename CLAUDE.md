# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tech Stack

- **Frontend**: Vue 3.4 + Vite 5 + TypeScript 5.4
- **UI**: Tailwind CSS 3.4 + Ant Design Vue 4.1
- **State**: Pinia 2.1 + VueUse Core 10.9
- **Database**: Neon PostgreSQL (@neondatabase/serverless)
- **Backend**: Netlify Functions (serverless, Node 20)
- **Auth**: Neon Auth (@neondatabase/neon-js)
- **Payments**: Stripe 14.0
- **AI**: Anthropic Claude SDK (claude-sonnet-4-20250514)

## Commands

```bash
# Development
npm run dev              # Start Vite dev server (port 3000)
netlify dev              # Start with Netlify Functions (port 8888)

# Build & Deploy
npm run build            # Type-check + production build
npm run preview          # Preview production build locally
netlify deploy           # Deploy to Netlify

# Testing & Quality
npm run test             # Run Vitest unit tests
npm run test:e2e         # Run Playwright E2E tests
npm run lint             # ESLint with auto-fix
npm run typecheck        # Vue-tsc type checking
```

## Architecture

```
src/
├── components/
│   ├── layout/          # AppHeader, AppFooter
│   ├── ui/              # LoadingSpinner, ProBadge, EmptyState, SectionHeader, FeatureCard
│   └── features/        # WarningCard, AttractionChat, AttractionCard, AIChat
├── composables/
│   ├── useApi.ts        # HTTP client with auth headers (GET, POST, PUT, DELETE)
│   ├── useAI.ts         # AI chat with conversation caching (30min TTL)
│   ├── useAuth.ts       # Neon Auth session + profile sync
│   ├── useMatcher.ts    # Profile-based attraction scoring
│   └── useSubscription.ts # Stripe subscription status
├── stores/
│   ├── userStore.ts     # Profile, auth, activity (localStorage persist)
│   └── countryStore.ts  # Thailand data, visas, warnings, attractions
├── views/               # 15 page components (Home, VisaWizard, Dashboard, etc.)
├── router/              # Vue Router with lazy-loaded routes
├── lib/                 # Auth client wrapper
├── types/               # TypeScript interfaces
└── styles/              # Tailwind + global CSS

netlify/functions/       # Serverless backend
├── user.mts             # User profile CRUD
├── ai.mts               # Claude API for travel advice
├── attraction-ai.mts    # Personalized attraction AI (intros, tips, chat)
├── attractions.mts      # Attraction queries with filtering
├── subscription.mts     # Stripe subscription management
├── webhook-stripe.mts   # Stripe webhook handler
└── lib/
    ├── db.mts           # Neon database wrapper
    └── matching.mts     # Backend matching logic

db/
├── migrations/          # SQL migrations (001_attractions.sql)
└── seed/                # Seed data (attractions_seed.sql)
```

## Data Model

**Tables**: `user_profiles` → `attractions` → `attraction_tips` / `attraction_secrets` / `attraction_recommendations`

- **user_profiles**: user_id, prefs (JSONB), is_pro, stripe_customer_id
- **attractions**: slug, name, category, location, province, categories (JSONB), is_hidden_gem, is_pro_only
- **attraction_tips**: timing, transport, money-saving, crowd avoidance, photography, prep
- **attraction_secrets**: hidden spots, local food, experiences, insider tips (Pro-only)
- **attraction_recommendations**: restaurants, cafes, hotels, activities with Google Maps URLs

## Key Patterns

**Composables**: Logic separation - useApi for HTTP, useAI for AI calls with caching, useMatcher for weighted scoring (interests 3x, styles 2.5x, budget 2x)

**Stores**: Pinia with computed getters, localStorage persistence, API fallbacks

**AI Integration**: Claude Sonnet 4, system prompt with visa info, user profile context, conversation history (last 10 messages)

**Matching Algorithm**: Client-side weighted scoring against attraction categories, real-time sorting by match percentage

**API Routing**: `/api/*` redirects to `/.netlify/functions/:splat` via netlify.toml

## Path Aliases

```typescript
@ → src/
@components → src/components/
@composables → src/composables/
@stores → src/stores/
@views → src/views/
@types → src/types/
```

## Environment Variables

```bash
DATABASE_URL              # Neon PostgreSQL connection string
VITE_NEON_AUTH_URL        # Neon Auth endpoint
STRIPE_SECRET_KEY         # Stripe API key
STRIPE_WEBHOOK_SECRET     # Stripe webhook signing secret
STRIPE_PRO_PRICE_ID       # Stripe Pro subscription price
ANTHROPIC_API_KEY         # Claude API key
URL                       # Base URL for callbacks
```

## Preferences

- Act like a senior developer
- Write complete, working code - no mocks, stubs, or TODOs
- Use clear comments only when logic isn't self-evident
- Keep existing working code intact when adding features
- Prefer editing existing files over creating new ones
- Use parameterized SQL queries (tagged template syntax) for all database operations
- Follow existing Thai-inspired theming (gold, royal blue, teal, coral palette)
- Use the Neon and Stripe MCP servers for database/payment operations
