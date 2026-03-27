# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tech Stack

- **Frontend**: Vue 3.4 + Vite 5 + TypeScript 5.4
- **UI**: Tailwind CSS 3.4 + Ant Design Vue 4.1
- **State**: Pinia 2.1 + VueUse Core 10.9
- **Routing**: Vue Router 4.3
- **Database**: Neon PostgreSQL (@neondatabase/serverless)
- **Backend**: Netlify Functions (serverless, Node 20)
- **Auth**: Neon Auth (@neondatabase/neon-js)
- **Payments**: Stripe 14.0
- **AI**: Anthropic Claude SDK (claude-sonnet-4-20250514)

## Development Server

**IMPORTANT**: This app uses `@netlify/vite-plugin` which emulates Netlify's platform inside Vite.

| Port | What | Purpose |
|------|------|---------|
| **3000** | Vite dev server | Main entry point (access here) |

### How it works

```
Browser → localhost:3000 (Vite + Netlify plugin)
              ├── /* → Vue app with HMR
              └── /.netlify/functions/* → Serverless functions (emulated by plugin)
```

The `@netlify/vite-plugin` intercepts requests and emulates:
- Serverless functions
- Redirects & rewrites (from netlify.toml)
- Headers and environment variables

### For development:
```bash
npm run dev    # Access app at localhost:3000
```

**Note**: If port 3000 is stuck: `npm run kill-ports` or `lsof -ti:3000 | xargs -r kill -9`

## Commands

```bash
# Build & Deploy
npm run build            # Type-check + production build
npm run preview          # Preview production build locally
netlify deploy           # Deploy to Netlify

# Testing & Quality
npm run test             # Run Vitest unit tests
npm run test:e2e         # Run Playwright E2E tests
npm run lint             # ESLint with auto-fix
npm run typecheck        # Vue-tsc type checking

# Utilities
npm run kill-ports       # Kill processes on ports 8888 and 3000
```

## Architecture

```
src/
├── components/
│   ├── layout/          # AppHeader, AppFooter
│   ├── ui/              # LoadingSpinner, ProBadge, EmptyState, SectionHeader,
│   │                    # FeatureCard, AILimitBanner, BreadcrumbNav,
│   │                    # ExitIntentPopup, MatchScoreCard, NewsletterSignup,
│   │                    # PersonalizationBar, ShareButton, UpgradeModal, UsageMeter
│   ├── common/          # AffiliateButton, AffiliateCard
│   └── features/        # AttractionCard, AttractionChat, AIChat, WarningCard,
│                        # CurrencyCalculator, FestivalCard, FlightSearch, GuideCard,
│                        # ItineraryActivityModal, ItineraryCostAnalytics,
│                        # ItineraryGenerateModal, ProfileQuickEdit, ScamAlert,
│                        # TransportSearch, UpcomingFestivalBanner, WeatherWidget
│       └── heritage/    # HeritageCard, HeritageGallery, HeritageTimeline
├── composables/
│   ├── useApi.ts        # HTTP client with auth headers (GET, POST, PUT, DELETE)
│   ├── useAI.ts         # AI chat with conversation caching (30min TTL)
│   ├── useAIUsage.ts    # AI usage tracking and limits
│   ├── useAlerts.ts     # Travel alerts by location
│   ├── useAuth.ts       # Neon Auth session + profile sync
│   ├── useCurrency.ts   # Currency conversion
│   ├── useFavorites.ts  # Saved places/favorites
│   ├── useFestivals.ts  # Thai festivals data
│   ├── useFlights.ts    # Flight search
│   ├── useGeolocation.ts # Browser geolocation
│   ├── useGuides.ts     # Travel guides content
│   ├── useItinerary.ts  # AI itinerary generation
│   ├── useMatcher.ts    # Profile-based attraction scoring
│   ├── useOnwardTicket.ts # Onward ticket booking
│   ├── useSafety.ts     # Safety information
│   ├── useSeo.ts        # SEO meta tags
│   ├── useSubscription.ts # Stripe subscription status
│   └── useWeather.ts    # Weather forecasts
├── stores/
│   ├── userStore.ts     # Profile, auth, activity (localStorage persist)
│   └── countryStore.ts  # Thailand data, visas, warnings, attractions
├── views/               # 31 page components
│   ├── HomeView.vue             # Landing page
│   ├── DashboardView.vue        # User dashboard
│   ├── ProfileView.vue          # User profile settings
│   ├── AttractionsView.vue      # Attraction listings
│   ├── AttractionDetailView.vue # Single attraction detail
│   ├── SmartMatchView.vue       # AI-powered attraction matching
│   ├── SavedPlacesView.vue      # User's saved places
│   ├── FestivalsView.vue        # Thai festivals listing
│   ├── FestivalDetailView.vue   # Single festival detail
│   ├── HeritageView.vue         # Heritage sites listing
│   ├── HeritageDetailView.vue   # Single heritage site detail
│   ├── GuidesView.vue           # Travel guides listing
│   ├── GuideDetailView.vue      # Guide detail with markdown + TOC
│   ├── VisaWizardView.vue       # Visa requirements wizard
│   ├── NinetyDayView.vue        # 90-day reporting guide
│   ├── TDACGuideView.vue        # TDAC guide
│   ├── SetupGuideView.vue       # Getting started guide
│   ├── OnwardTicketView.vue     # Onward ticket booking
│   ├── ItineraryView.vue        # AI itinerary builder
│   ├── CostCalculatorView.vue   # Trip cost calculator
│   ├── PackingView.vue          # AI packing list
│   ├── SafetyView.vue           # Safety information (enriched)
│   ├── AlertsView.vue           # Travel alerts
│   ├── WarningsView.vue         # Travel warnings
│   ├── MedicalView.vue          # Medical information (17 real hospitals)
│   ├── PeopleView.vue           # People/culture info
│   ├── AboutView.vue            # About page with editorial credibility
│   ├── ContactView.vue          # Contact page
│   ├── PrivacyView.vue          # Privacy policy
│   ├── TermsView.vue            # Terms of service
│   └── NotFoundView.vue         # 404 page
├── router/              # Vue Router with lazy-loaded routes
├── lib/                 # Auth client wrapper
├── types/               # TypeScript interfaces
├── utils/               # Utility modules
│   ├── affiliates.ts    # Affiliate link generation + tracking
│   ├── booking-pdf.ts   # Onward ticket PDF generation
│   ├── export.ts        # Data export utilities
│   ├── markdown.ts      # Lightweight markdown-to-HTML renderer
│   └── seo.ts           # SEO meta tags, JSON-LD schemas
└── styles/              # Tailwind + global CSS

netlify/functions/       # Serverless backend (26 functions)
├── user.mts             # User profile CRUD
├── ai.mts               # Claude API for travel advice
├── attraction-ai.mts    # Personalized attraction AI (intros, tips, chat)
├── attractions.mts      # Attraction queries with filtering
├── alerts.mts           # Travel alerts by location
├── advisories.mts       # Safety advisories
├── currency.mts         # Currency conversion rates
├── festivals.mts        # Thai festivals data
├── flights.mts          # Flight search integration
├── guides.mts           # Travel guides (list, get by slug, categories)
├── heritage.mts         # Heritage sites data
├── itinerary.mts        # AI itinerary generation
├── matches.mts          # Profile-based attraction matching
├── onward-ticket.mts    # Onward ticket booking + PDF
├── packing.mts          # AI packing list generator
├── safety.mts           # Safety information by region
├── usage.mts            # AI usage tracking
├── weather.mts          # Weather forecasts
├── newsletter.mts       # Email newsletter signup
├── sitemap.mts          # Dynamic XML sitemap (includes guide pages)
├── google-places.mts    # Google Places API integration
├── enrich-place.mts     # AI place enrichment pipeline
├── ingest-places.mts    # Bulk place ingestion
├── unsplash-track.mts   # Unsplash image tracking
├── subscription.mts     # Stripe subscription management
├── webhook-stripe.mts   # Stripe webhook handler
├── __tests__/           # Function unit tests (Vitest)
└── lib/
    ├── auth.mts         # Auth utilities
    ├── db.mts           # Neon database wrapper
    ├── matching.mts     # Backend matching logic
    ├── responses.mts    # HTTP response helpers
    ├── security.mts     # Security utilities
    └── usage.mts        # Usage tracking utilities

db/
├── migrations/          # SQL migrations (001-013)
│   ├── 001_attractions.sql
│   ├── 002_places_expansion.sql
│   ├── 003_add_cost_tier.sql
│   ├── 003_pro_features.sql
│   ├── 004_safety_features.sql
│   ├── 005_heritage_features.sql
│   ├── 006_ai_cache.sql
│   ├── 007_ai_usage_tracking.sql
│   ├── 008_ai_usage_fk.sql
│   ├── 009_festivals.sql
│   ├── 010_more_festivals.sql
│   ├── 011_travel_guides.sql
│   ├── 011_unesco_heritage_sites.sql
│   ├── 011_fix_province_and_categories.sql
│   ├── 012_onward_bookings.sql
│   └── 013_onward_bookings_pro.sql
└── seed/
    ├── attractions_seed.sql
    ├── heritage_seed.sql
    ├── places_seed.sql
    └── guides_seed.sql   # 8 travel guides (81KB)
```

## Data Model

**Core tables**: `user_profiles` → `attractions` → `attraction_tips` / `attraction_secrets` / `attraction_recommendations`

- **user_profiles**: user_id, prefs (JSONB), is_pro, stripe_customer_id
- **attractions**: slug, name, category, location, province, categories (JSONB), is_hidden_gem, is_pro_only, cost_tier
- **attraction_tips**: timing, transport, money-saving, crowd avoidance, photography, prep
- **attraction_secrets**: hidden spots, local food, experiences, insider tips (Pro-only)
- **attraction_recommendations**: restaurants, cafes, hotels, activities with Google Maps URLs

**Extended tables**:
- **heritage_sites**: Heritage and cultural sites with historical data
- **festivals**: Thai festivals with dates, locations, descriptions
- **travel_guides**: Blog/editorial content with markdown, categories, tags, reading time
- **places**: Expanded place data from Google Places integration
- **ai_cache**: Cached AI responses for performance
- **ai_usage**: Per-user AI usage tracking and limits
- **onward_bookings**: Onward ticket bookings with PDF generation
- **safety_***: Safety information tables by region

**Note**: Migrations 003 and 011 each have numbering conflicts (multiple files). All have been applied.

## Key Patterns

**Composables**: Logic separation - useApi for HTTP, useAI for AI calls with caching, useMatcher for weighted scoring (interests 3x, styles 2.5x, budget 2x)

**Stores**: Pinia with computed getters, localStorage persistence, API fallbacks

**AI Integration**: Claude Sonnet 4, system prompt with visa info, user profile context, conversation history (last 10 messages)

**Matching Algorithm**: Client-side weighted scoring against attraction categories, real-time sorting by match percentage

**API Routing**: `/api/*` redirects to `/.netlify/functions/:splat` via netlify.toml

**Affiliate System**: Klook, Agoda, 12go, GetYourGuide, SafetyWing affiliate links with tracking

**SEO**: JSON-LD schemas (FAQPage, Article, WebSite, HowTo, BreadcrumbList), BreadcrumbNav on all hierarchical pages, dynamic sitemap with guide pages, hreflang tags

**Content System**: Travel guides with markdown rendering, table of contents extraction, related guides cross-linking on guide/attraction/festival detail pages

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
# Database
DATABASE_URL              # Neon PostgreSQL connection string

# Auth
VITE_NEON_AUTH_URL        # Neon Auth endpoint

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY # Stripe publishable key (frontend)
STRIPE_SECRET_KEY         # Stripe API key
STRIPE_WEBHOOK_SECRET     # Stripe webhook signing secret
STRIPE_PRO_PRICE_ID       # Stripe Pro subscription price

# AI
ANTHROPIC_API_KEY         # Claude API key

# Affiliate Partners
VITE_KLOOK_AFFILIATE_ID           # Klook tours/activities
VITE_AGODA_AFFILIATE_ID           # Agoda hotel bookings
VITE_12GO_AFFILIATE_ID            # 12go transport bookings
VITE_GETYOURGUIDE_AFFILIATE_ID    # GetYourGuide tours
VITE_SAFETYWING_AFFILIATE_ID      # SafetyWing travel insurance

# System
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

## Deployment

- **Netlify site**: `travel303` / `happyroam.travel`
- **Netlify site ID**: `147e20e5-e01a-46aa-9846-41ab51af4de2`
- **GitHub repo**: `dizid/travel101`
- **Neon project**: `hidden-darkness-69201067` (eu-west-2), database: `neondb`
- **Deploy**: Always use `netlify deploy --build` or Netlify MCP `deploy-site` — never drag-and-drop (no functions get deployed)
