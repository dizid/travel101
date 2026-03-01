# Strategic Improvement Plan: Global Smart Traveler

## Executive Summary

Transform the app from a Thailand-only MVP into a scalable, high-quality travel platform with:
1. **Trustworthy information** users can rely on for real travel decisions
2. **Polished UI/UX** that feels professional and delightful
3. **Comprehensive Thailand database** as the flagship country
4. **Multi-country architecture** enabling rapid expansion

---

## Part 1: Information Quality (CRITICAL)

Users are making real travel decisions based on this app. Bad advice = ruined trips, visa issues, or worse.

### 1.1 Visa Information System

**Current State:** High-quality but hardcoded in `countryStore.ts`. Recently verified (Jan 2025).

**Improvements:**

| Enhancement | Why It Matters |
|-------------|----------------|
| **Version tracking** | Show "Last verified: January 2025" so users know data freshness |
| **Source citations** | Link to official Thai Immigration pages for verification |
| **Change alerts** | Notify users when visa rules change (e.g., border run crackdown) |
| **Nationality-specific rules** | Different countries have different exemptions (93 countries list) |
| **Scenario calculator** | "I want to stay 4 months" → show all options with pros/cons |

**Database Schema Addition:**
```sql
CREATE TABLE visa_types (
  id UUID PRIMARY KEY,
  country_id UUID REFERENCES countries(id),
  code VARCHAR(20) NOT NULL,           -- 'visa_exemption', 'dtv', etc.
  name VARCHAR(100) NOT NULL,
  official_name VARCHAR(255),          -- Official Thai immigration name
  duration_days INT,
  max_extensions INT DEFAULT 0,
  extension_days INT DEFAULT 0,
  requirements JSONB,                   -- {documents: [], financials: [], etc.}
  eligible_nationalities TEXT[],        -- NULL = all, or specific country codes
  restrictions JSONB,                   -- {land_entries_max: 2, etc.}
  source_url TEXT,                      -- Official Thai Immigration link
  last_verified_at TIMESTAMPTZ,
  version INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE visa_updates (
  id UUID PRIMARY KEY,
  visa_type_id UUID REFERENCES visa_types(id),
  change_description TEXT NOT NULL,
  effective_date DATE,
  announced_at TIMESTAMPTZ DEFAULT NOW(),
  severity VARCHAR(20)                  -- 'info', 'important', 'critical'
);
```

### 1.2 Warnings & Safety Information

**Current State:** Enriched SafetyView with 8 accordion sections (general safety, transport, food/water, health, embassy contacts, solo/women travelers, weather, scams). MedicalView has 17 real hospitals + editorial intro.

**Completed (2026-03):**

| Category | Status |
|----------|--------|
| **Location-specific** | Partially done via enriched SafetyView sections |
| **Seasonal** | Done — weather section in SafetyView |
| **Legal consequences** | Done — included in safety accordion |
| **Scam details** | Done — dedicated scam section |
| **Health** | Done — MedicalView with 17 real hospitals |
| **Emergency contacts** | Done — embassy contacts in SafetyView |

**Remaining improvements:**

**Database Schema:**
```sql
CREATE TABLE warnings (
  id UUID PRIMARY KEY,
  country_id UUID REFERENCES countries(id),
  category VARCHAR(50) NOT NULL,        -- 'legal', 'health', 'scam', 'safety', 'cultural'
  severity INT CHECK (severity BETWEEN 1 AND 5),
  title VARCHAR(255) NOT NULL,
  summary TEXT NOT NULL,                -- Short version
  full_content TEXT,                    -- Detailed explanation
  applies_to JSONB,                     -- {provinces: [], attractions: [], seasons: []}
  source_url TEXT,
  last_verified_at TIMESTAMPTZ
);

CREATE TABLE emergency_contacts (
  id UUID PRIMARY KEY,
  country_id UUID REFERENCES countries(id),
  name VARCHAR(100) NOT NULL,           -- 'Tourist Police', 'Bangkok Hospital'
  type VARCHAR(50),                     -- 'police', 'hospital', 'embassy'
  phone VARCHAR(50),
  address TEXT,
  province VARCHAR(100),
  google_maps_url TEXT,
  notes TEXT,
  is_24_hours BOOLEAN DEFAULT false
);
```

### 1.3 Practical Travel Information

**Status:** DONE via Travel Guides system (2026-03). 8 guides seeded covering practical topics:

| Guide | Category | Status |
|-------|----------|--------|
| Ultimate Thailand Guide for First-Time Visitors | destination | Published |
| Best Time to Visit Thailand: Month-by-Month | practical | Published |
| Thailand on a Budget: Under $30/Day | budget | Published |
| Bangkok Neighborhoods: Where to Stay | destination | Published |
| Island Hopping in Southern Thailand | destination | Published |
| Chiang Mai for Digital Nomads | destination | Published |
| Thai Food Guide: What to Eat & Where | food | Published |
| Thailand Safety: What Every Traveler Should Know | safety | Published |

Built with: `travel_guides` table, `guides.mts` API, `useGuides.ts` composable, `GuidesView.vue` + `GuideDetailView.vue`, markdown rendering with TOC, related guides cross-linking.

**Database Schema:**
```sql
CREATE TABLE practical_guides (
  id UUID PRIMARY KEY,
  country_id UUID REFERENCES countries(id),
  category VARCHAR(50) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,                -- Rich markdown content
  quick_facts JSONB,                    -- Key bullet points
  applies_to JSONB,                     -- {provinces: [], traveler_types: []}
  last_updated_at TIMESTAMPTZ,
  sort_order INT DEFAULT 0
);
```

### 1.4 Comprehensive Attractions Database

**Current State:** 3 fallback attractions. Database is EMPTY.

**Target:** 200+ attractions with rich content.

**Content Structure Per Attraction:**

```
ATTRACTION
├── Basic Info (name, location, category, description)
├── Rich About (2-3 paragraphs of context)
├── Practical Details
│   ├── Opening hours
│   ├── Entry fees (Thai/foreigner pricing)
│   ├── Best time to visit
│   ├── How to get there
│   └── Time needed
├── Insider Tips (5-10 per attraction)
│   ├── Timing tips
│   ├── Money-saving tips
│   ├── Crowd avoidance
│   └── Photography spots
├── Local Secrets (Pro feature)
│   ├── Hidden spots
│   ├── Local food nearby
│   └── Off-beaten-path experiences
├── Recommendations (3-5 each)
│   ├── Where to eat
│   ├── Where to stay
│   └── What to do nearby
├── Category Scores (for matching)
└── Related Attractions
```

**Coverage by Province:**

| Region | Provinces | Key Attractions Target |
|--------|-----------|----------------------|
| **Central** | Bangkok, Ayutthaya, Kanchanaburi | 50 |
| **North** | Chiang Mai, Chiang Rai, Pai, Sukhothai | 40 |
| **South (Andaman)** | Phuket, Krabi, Phi Phi, Khao Lak | 40 |
| **South (Gulf)** | Koh Samui, Koh Phangan, Koh Tao | 25 |
| **East** | Pattaya, Koh Chang, Rayong | 20 |
| **Isaan** | Khon Kaen, Udon Thani, Nakhon Ratchasima | 25 |
| **Total** | 77 provinces | 200+ |

### 1.5 AI-Powered Content Generation

Use AI (Claude) to generate initial content, then human-verify.

**Generation Pipeline:**
```
1. Claude generates attraction description + tips
2. Store as "draft" status
3. Human reviews/edits
4. Mark as "verified"
5. Show verification badge to users
```

**AI Prompts for Content:**
```
Generate detailed travel content for [ATTRACTION] in Thailand:

1. ABOUT (200-300 words):
   - What makes this place special
   - Historical/cultural significance
   - What to expect

2. PRACTICAL INFO:
   - Opening hours (verify against Google)
   - Entry fees (foreigner/Thai pricing)
   - Best time of day/year to visit
   - How long to spend
   - Getting there from nearest city

3. INSIDER TIPS (5-7):
   - Format: [TYPE] Title: Specific actionable advice
   - Types: timing, money, crowds, photo, transport, food

4. LOCAL SECRETS (2-3):
   - Hidden spots most tourists miss
   - Local food recommendations
   - Unique experiences

5. NEARBY RECOMMENDATIONS:
   - 1 restaurant with specific dish to try
   - 1 cafe/bar
   - 1 hotel for different budgets
```

---

## Part 2: UI/UX Improvements

### 2.1 Critical Fixes

| Issue | Location | Fix |
|-------|----------|-----|
| **Mobile sidebar** | AttractionDetailView | Convert to off-canvas drawer on mobile |
| **Floating AI button** | AttractionDetailView:552 | Move to bottom nav or make dismissible |
| **Form validation** | ProfileView, VisaWizard | Show inline errors before submission |
| **No breadcrumbs** | Detail pages | ~~Add breadcrumb component~~ DONE — BreadcrumbNav on 9+ views |
| **No error states** | All API calls | Add error UI + retry button |

### 2.2 New Components Needed

```
src/components/ui/
├── Breadcrumb.vue          # Navigation trail
├── SkeletonLoader.vue      # Loading placeholders
├── ErrorState.vue          # API error with retry
├── Toast.vue               # Success/error notifications
├── ConfirmDialog.vue       # Destructive action confirmations
├── Tooltip.vue             # Help text on hover
├── ProgressBar.vue         # Multi-step progress
└── Badge.vue               # Status indicators
```

### 2.3 Skeleton Loaders

Replace spinner-only loading with content-shaped skeletons:

```vue
<!-- AttractionCard skeleton -->
<div class="card animate-pulse">
  <div class="h-48 bg-gray-200 rounded-t-xl"></div>
  <div class="p-4 space-y-3">
    <div class="h-6 bg-gray-200 rounded w-3/4"></div>
    <div class="h-4 bg-gray-200 rounded w-full"></div>
    <div class="h-4 bg-gray-200 rounded w-2/3"></div>
  </div>
</div>
```

### 2.4 Mobile-First Improvements

| Area | Current | Improved |
|------|---------|----------|
| **Attraction grid** | 1 column on phone | 2 columns with smaller cards |
| **Profile buttons** | Cramped 2x4 grid | Scrollable pills or full-width |
| **Visa wizard** | 2x5 country grid | Horizontal scroll or search |
| **Detail sidebar** | Full-width block | Slide-out drawer |
| **Navigation** | Basic dropdown | Bottom tab bar option |

### 2.5 Accessibility Fixes

```vue
<!-- Add to all icon-only buttons -->
<button aria-label="Save to favorites">
  <HeartOutlined />
</button>

<!-- Add visible focus indicators -->
<style>
button:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}
</style>

<!-- Add skip link -->
<a href="#main-content" class="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

### 2.6 Pro Monetization UX

**Current:** Small sidebar card, lock icons on content.

**Improved:**
- Show "Preview" of locked content (blurred first paragraph)
- In-context upgrade prompts: "Unlock 47 local secrets for $9/month"
- Progress indicator: "You've used 2/3 free AI chats this week"
- Value comparison: "Pro users save avg. 15% on their trips"

---

## Part 3: Template Site Architecture

### 3.1 Core Concept: Thailand as Template

**Architecture:** One codebase, multiple deployments. Each country gets its own site.

```
smarttraveler-thailand.netlify.app  → Thailand data + Thai gold/teal theme
smarttraveler-bali.netlify.app      → Indonesia data + tropical green theme
smarttraveler-japan.netlify.app     → Japan data + red/white theme
```

**NOT a multi-country dropdown** - each site is dedicated to ONE country with:
- Country-specific domain/subdomain
- Country-specific database (or filtered view)
- Country-specific design (colors, fonts, imagery)
- Country-specific AI knowledge

### 3.2 Config-Driven Everything

**Single config file per deployment:**

```typescript
// src/config/country.config.ts (different per deployment)
export const countryConfig = {
  // Identity
  id: 'thailand',
  code: 'TH',
  name: 'Thailand',
  localName: 'ประเทศไทย',
  flagEmoji: '🇹🇭',

  // Branding
  theme: {
    primaryColor: '#f59e0b',      // Thai gold
    primaryColorDark: '#d97706',
    accentColor: '#14b8a6',       // Thai teal
    accentColorDark: '#0d9488',
    gradientFrom: 'amber-50',
    gradientTo: 'teal-50',
  },

  // Copy
  greeting: 'สวัสดี',              // Hello in local language
  tagline: 'Land of Smiles',
  metaTitle: 'Smart Traveler Thailand',
  metaDescription: 'Your intelligent guide to Thailand travel',

  // Features (toggle per country)
  features: {
    visaWizard: true,
    aiChat: true,
    proTier: true,
    itineraryBuilder: true,
  },

  // Practical info
  currency: { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  timezone: 'Asia/Bangkok',
  emergencyNumber: '191',
  touristPolice: '1155',

  // API/Database
  databaseUrl: process.env.DATABASE_URL,  // Can be same DB with country filter, or separate
}
```

### 3.3 Build-Time Theme Injection

**Tailwind config reads from country config:**

```javascript
// tailwind.config.js
const { countryConfig } = require('./src/config/country.config')

module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          500: countryConfig.theme.primaryColor,
          600: countryConfig.theme.primaryColorDark,
        },
        accent: {
          500: countryConfig.theme.accentColor,
          600: countryConfig.theme.accentColorDark,
        },
      },
    },
  },
}
```

**Or CSS variables at runtime:**
```css
:root {
  --color-primary: var(--country-primary);
  --color-accent: var(--country-accent);
}
```

### 3.4 Database Strategy

**Option A: Single DB, country_id filter (recommended for start)**
```sql
-- All tables have country_id
SELECT * FROM attractions WHERE country_id = 'thailand';
SELECT * FROM visa_types WHERE country_id = 'thailand';
```
- Simpler to manage
- Shared infrastructure
- Config specifies which country_id to filter

**Option B: Separate DB per country (for scale)**
```
DATABASE_URL_THAILAND=postgres://...thailand
DATABASE_URL_INDONESIA=postgres://...indonesia
```
- Complete isolation
- Different scaling per country
- More complex ops

### 3.5 Deployment Pipeline

**One repo, multiple Netlify sites:**

```yaml
# netlify.toml - base config
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  COUNTRY = "thailand"  # Override per site in Netlify UI
```

**Per-site environment variables in Netlify:**
```
Site: smarttraveler-thailand
  COUNTRY=thailand
  DATABASE_URL=postgres://...
  ANTHROPIC_API_KEY=sk-...

Site: smarttraveler-bali
  COUNTRY=indonesia
  DATABASE_URL=postgres://...
  ANTHROPIC_API_KEY=sk-...
```

**Build script loads correct config:**
```typescript
// vite.config.ts
const country = process.env.COUNTRY || 'thailand'
const config = await import(`./src/config/countries/${country}.config.ts`)
```

### 3.6 Content Templates

**Thailand establishes the content structure:**

| Content Type | Thailand Template | New Country Fills |
|--------------|-------------------|-------------------|
| **Visa Types** | Structure: code, duration, requirements, restrictions | Japan: tourist, work, student visas |
| **Warnings** | Categories: legal, health, scam, safety, cultural | Bali: specific scams, temple etiquette |
| **Attractions** | Fields: about, tips, secrets, recommendations | Bali: Ubud, Uluwatu, etc. |
| **Practical Guides** | Topics: money, SIM, transport, culture | Bali: Rupiah, Telkomsel, Grab/Gojek |

### 3.7 Launching a New Country Site

**Step-by-step process:**

```
Day 1: Setup
├── Copy thailand.config.ts → indonesia.config.ts
├── Update branding (colors, greeting, tagline)
├── Create Netlify site with env vars
└── Deploy empty shell (shows "Coming soon")

Day 2-3: Core Data
├── AI-generate visa types from official sources
├── AI-generate warnings (research common issues)
├── AI-generate 10 provinces/regions
└── Insert into database with country_id='indonesia'

Day 4-7: Attractions
├── AI-generate 30-50 attractions
├── Each with: description, tips, secrets, recommendations
├── Human verification pass
└── Add category scores for matching

Day 8-9: Refinement
├── AI-generate practical guides
├── Add emergency contacts
├── Test visa wizard flow
└── Test AI chat with country context

Day 10: Launch
├── Final QA
├── Remove "Coming soon"
├── Announce launch
└── Monitor for issues
```

**Time to launch new country: ~2 weeks**

### 3.8 Shared vs Country-Specific Code

| Layer | Shared | Country-Specific |
|-------|--------|------------------|
| **Components** | All UI components | Theme colors only |
| **Views** | All page layouts | Copy/text via config |
| **Stores** | Logic and structure | Data from DB |
| **API endpoints** | All endpoints | Filter by country_id |
| **AI prompts** | Template structure | Country facts injected |
| **Styles** | Tailwind classes | Colors from config |
| **Images** | Country-specific | Hero, icons, photos |
| **Database** | Schema | Data per country |

---

## Part 4: Implementation Roadmap

**Strategy:** Make Thailand the perfect template, then clone for new countries.

### Phase 1: Config-Driven Architecture (Week 1)

**Goal:** Extract all Thailand-specific code into config. Codebase becomes country-agnostic.

**Day 1-2: Create Country Config System**
- [ ] Create `src/config/country.config.ts` with Thailand defaults
- [ ] Move hardcoded text to config: greeting, tagline, meta tags
- [ ] Move theme colors to config (reference in Tailwind)
- [ ] Move currency, emergency numbers to config
- [ ] Create `src/config/countries/thailand.ts` as reference

> Note: Auth uses Neon Auth (not Clerk as originally planned)

**Day 2-3: Database Schema (Multi-Country Ready)**
- [ ] Create `db/migrations/001_core_schema.sql`:
  - Add `country_id` column to existing `attractions` table
  - Create `visa_types` table (with country_id)
  - Create `warnings` table (with country_id)
  - Create `provinces` table (with country_id)
  - Create `practical_guides` table (with country_id)
  - Create `emergency_contacts` table (with country_id)
- [ ] Run migrations on Neon
- [ ] Seed Thailand as `country_id = 'thailand'`

**Day 4-5: API Layer with Country Filter**
- [ ] Add `COUNTRY_ID` env var, read in all endpoints
- [ ] Create `/api/visas` - replaces hardcoded visa types
- [ ] Create `/api/warnings` - replaces hardcoded warnings
- [ ] Create `/api/practical-guides` - new content type
- [ ] Update `/api/attractions` to filter by country_id
- [ ] Create AI prompt template system (`lib/prompts.mts`)

**Day 5: Frontend Migration**
- [ ] Update `countryStore.ts` to load from API + config
- [ ] Remove ALL hardcoded Thailand data
- [ ] Load config on app init
- [ ] Update views to use config for text/branding

### Phase 2: Thailand Content Generation (Week 2)

**Goal:** Comprehensive Thailand database with AI-generated, human-verified content.

**Day 1: Seed Core Data**
- [ ] Seed visa types from existing hardcoded data (keep accuracy)
- [ ] Seed warnings with enhanced location-specific content
- [ ] Seed 77 provinces with regions
- [ ] Seed emergency contacts (police, hospitals, embassies)

**Day 2-3: AI-Generate Attractions (Batch 1: Top 50)**
- [ ] Create AI content generation script
- [ ] Generate 50 top attractions:
  - Bangkok (15): Grand Palace, Wat Pho, Chatuchak, Khao San, etc.
  - Chiang Mai (10): Old City, Doi Suthep, Night Bazaar, etc.
  - Phuket (8): Patong, Kata, Old Town, Big Buddha, etc.
  - Islands (10): Phi Phi, Koh Samui, Koh Tao, etc.
  - Others (7): Ayutthaya, Pai, Krabi, etc.
- [ ] Each attraction includes:
  - Rich description + about (AI-generated)
  - 5-7 insider tips
  - 2-3 local secrets (Pro)
  - 3-5 recommendations
  - Category scores for matching

**Day 4: Human Verification Pass**
- [ ] Review AI-generated content for accuracy
- [ ] Verify opening hours, prices against Google/official sites
- [ ] Add "last_verified_at" timestamps
- [ ] Flag any content needing more research

**Day 5: Practical Guides**
- [ ] AI-generate 8 practical guides:
  - Money & ATMs
  - SIM Cards & Internet
  - Transportation
  - Accommodation Tips
  - Language Basics
  - Cultural Etiquette
  - Weather & Packing
  - Food & Safety
- [ ] Human verify facts (ATM fees, carrier packages, etc.)

### Phase 3: UI/UX Polish (Week 2-3, parallel with content)

**Goal:** Professional, polished experience as content fills in.

**Day 1-2: Core Components**
- [ ] Create `SkeletonLoader.vue` (card, list, detail variants)
- [x] Create `BreadcrumbNav.vue` with router integration (DONE)
- [ ] Create `ErrorState.vue` with retry callback
- [ ] Create `Toast.vue` notification system

**Day 3: Mobile Fixes**
- [ ] AttractionDetailView: Convert sidebar to slide-out drawer on mobile
- [ ] Fix "Ask AI" button positioning (bottom nav or in-page)
- [ ] Attractions grid: 2 columns on mobile
- [ ] Profile form: horizontal scroll for button groups

**Day 4: Forms & Validation**
- [ ] Add inline validation to ProfileView
- [ ] Add inline validation to VisaWizard
- [ ] Show errors on submit attempt
- [ ] Add auto-save indicator for profile

**Day 5: Accessibility & Polish**
- [ ] Add aria-labels to icon buttons
- [ ] Add visible focus indicators
- [ ] Add skip-to-content link
- [ ] Test with keyboard navigation

### Phase 4: Dynamic Theming & Country Selector (Week 3)

**Goal:** App visually adapts per country, users can switch.

**Day 1: CSS Variable System**
- [ ] Replace hardcoded Tailwind colors with CSS variables
- [ ] Create `--country-primary`, `--country-accent` variables
- [ ] Update `App.vue` to set variables from country theme

**Day 2: Country Selector**
- [ ] Add country dropdown to header (desktop)
- [ ] Add country selector to mobile menu
- [ ] Store selected country in localStorage + Pinia
- [ ] Update all API calls with country filter

**Day 3: AI Prompt Templating**
- [ ] Create `lib/prompts.mts` with template functions
- [ ] Move visa knowledge to database + template injection
- [ ] Update `ai.mts` to use templates
- [ ] Update `attraction-ai.mts` to use templates

**Day 4: Route Structure**
- [ ] Update router with optional country prefix: `/:country?/attractions`
- [ ] Add redirect from old routes to new
- [ ] Update all internal links to include country
- [ ] Handle country from URL on initial load

### Phase 5: Indonesia/Bali Site Launch (Week 4)

**Goal:** Deploy second site using the template. Prove the model works.

**Day 1: Create Indonesia Config + Netlify Site**
- [ ] Copy `thailand.config.ts` → `indonesia.config.ts`
- [ ] Update theme: tropical greens (#22c55e, #14b8a6)
- [ ] Update copy: "Selamat datang", "Island Paradise"
- [ ] Create new Netlify site: `smarttraveler-bali`
- [ ] Set env vars: `COUNTRY_ID=indonesia`, `DATABASE_URL`, `ANTHROPIC_API_KEY`

**Day 2-3: Indonesia Content Generation**
- [ ] AI-generate visa types (VOA, B211A, KITAS, etc.)
- [ ] AI-generate warnings (scams, temple dress code, traffic)
- [ ] AI-generate provinces: Bali, Java, Lombok, Sumatra, Sulawesi
- [ ] AI-generate 30 attractions:
  - Bali (20): Ubud, Seminyak, Uluwatu, Tanah Lot, Nusa Penida
  - Lombok (5): Gili Islands, Mount Rinjani
  - Java (5): Yogyakarta, Borobudur, Bromo

**Day 4: Human Verification**
- [ ] Verify visa info against Indonesian embassy sources
- [ ] Check attraction details (hours, prices)
- [ ] Review warnings for accuracy
- [ ] Test AI chat responses

**Day 5: QA & Launch**
- [ ] Full flow test on Indonesia site
- [ ] Verify theme looks correct
- [ ] Test visa wizard with Indonesian visas
- [ ] Deploy to production
- [ ] Announce launch

---

## Key Files to Modify/Create

| Phase | File | Action |
|-------|------|--------|
| 1 | `db/migrations/*.sql` | CREATE - schema migrations |
| 1 | `netlify/functions/visas.mts` | CREATE - visa API |
| 1 | `netlify/functions/warnings.mts` | CREATE - warnings API |
| 1 | `netlify/functions/countries.mts` | CREATE - countries API |
| 1 | `src/stores/countryStore.ts` | MODIFY - API-driven data |
| 2 | `db/seed/thailand/*.sql` | CREATE - seed data |
| 2 | `netlify/functions/practical-guides.mts` | CREATE - guides API |
| 3 | `src/components/ui/SkeletonLoader.vue` | CREATE |
| 3 | `src/components/ui/Breadcrumb.vue` | CREATE |
| 3 | `src/components/ui/ErrorState.vue` | CREATE |
| 3 | `src/components/ui/Toast.vue` | CREATE |
| 4 | `src/config/countries/*.ts` | CREATE - country configs |
| 4 | `netlify/functions/lib/prompts.mts` | CREATE - AI templates |
| 4 | `src/App.vue` | MODIFY - dynamic theming |
| 4 | `src/router/index.ts` | MODIFY - country routes |

---

## Verification Checklist

### Information Quality
- [ ] Visa info shows "Last verified" date
- [x] Warnings have location-specific content (SafetyView enriched with 8 sections)
- [ ] 100+ attractions with rich content
- [ ] Each attraction has 5+ tips
- [x] Practical guides cover all categories (8 travel guides published)
- [x] Emergency contacts are complete (embassy contacts in SafetyView, 17 hospitals in MedicalView)

### UI/UX
- [ ] Mobile sidebar is a drawer
- [ ] Skeleton loaders on all lists
- [x] Breadcrumbs on detail pages (BreadcrumbNav on 9+ views)
- [ ] Error states with retry
- [ ] Form validation is inline
- [ ] Accessibility score > 90

### Multi-Country
- [ ] Country data loads from API
- [ ] Theme changes per country
- [ ] AI prompts use templates
- [ ] Routes support country prefix
- [ ] Can add new country in < 2 weeks

---

## Decisions Made

| Question | Answer |
|----------|--------|
| **Architecture** | Template site model - one codebase, multiple deployments per country |
| **Priority** | All aspects in parallel (architecture → content → UI/UX simultaneously) |
| **Content generation** | AI-generate with human verification |
| **Second country** | Indonesia/Bali |
| **Database strategy** | Single DB with `country_id` filter (simpler to start) |
| **Timeline** | 4 weeks to Indonesia launch |

---

## Template Site Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                      ONE CODEBASE                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Components │  │   Views     │  │   Stores    │             │
│  │  (shared)   │  │  (shared)   │  │  (shared)   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                           │                                     │
│                    ┌──────┴──────┐                              │
│                    │   Config    │                              │
│                    │  (per site) │                              │
│                    └──────┬──────┘                              │
└───────────────────────────┼─────────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
   │  Thailand   │   │  Indonesia  │   │   Japan     │
   │   Site      │   │   Site      │   │   Site      │
   ├─────────────┤   ├─────────────┤   ├─────────────┤
   │ Gold/Teal   │   │ Green       │   │ Red/White   │
   │ Thai visas  │   │ Indo visas  │   │ Japan visas │
   │ 200 places  │   │ 50 places   │   │ 100 places  │
   └─────────────┘   └─────────────┘   └─────────────┘
```

---

## First Action Items (Starting Phase 1)

1. **Create `src/config/country.config.ts`** - Thailand as default
2. **Extract hardcoded Thailand text** from HomeView, router, etc.
3. **Create database migration** with `country_id` on all tables
4. **Run migration** on Neon
5. **Seed Thailand data** (visas, warnings from current hardcoded)

Ready to begin implementation.
