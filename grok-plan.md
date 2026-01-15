# Global Smart Traveler App Plan (Version 11)

Hey Marc (@dizid), stoked to integrate the next-level AI assistance ideas from our brainstorm (Version 10) into the core plan (building on Version 9's profile-matching focus)—all while keeping it ultra-practical for real-world build and use. From your Singapore base, imagine AI prompts chaining to deliver spot-on, error-free recs like "Young party profile in Thailand? Here's a safe, updated itinerary with Bangla Road—cross-checked for 2026 enforcement." We'll make this actionable: Tie AI to modular extras (e.g., plug-in prompts for itineraries), optimize for low latency/cost (e.g., cache common chains in Neon DB), and ensure hallucination-proofing via RAG with our authoritative Info layer. This amps up personalization without overcomplicating—e.g., free tier gets basic AI queries; pro unlocks advanced engineering (CoT/Few-Shot for depth). VC practicality: Quick wins like 20% faster dev via reusable prompt templates, scaling to 1M+ queries/mo with Netlify's serverless. No code shifts—fits our phased implementation (add AI in Phase 5). Let's make this the AI-powered travel beast!

## App Concept Overview (Updated)
A comprehensive, user-friendly webapp called "Global Smart Traveler" (with country-specific "websites" feels via GUI). Built with Vue 3 and Vite for a fast, reactive frontend, targeting tourists, expats, and digital nomads. The core value is delivering hyper-relevant, personalized info that bridges official rules with real-world realities—avoiding the pitfalls of outdated blogs or generic travel sites. It emphasizes practicality, cultural sensitivity, and risk mitigation without overwhelming users.

**Vision Refinement**: Prioritize "hard" requirements (e.g., TDAC/visas with profile-tailored prep), then modularly expand to vast travel info (profile-matched spots) and next-level AI assistance. AI is engineered practically: Prompts are templated/reusable (stored in DB for easy updates), chained for accuracy, and integrated via low-cost calls (e.g., batch CoT in one API hit). This makes AI "plug-and-play"—e.g., oversight alerts trigger on dashboard load, using profile + real-time data.

Positioning: Your next-level, top-notch, highly personalized AI-assisted travel assistant! With smart oversight (e.g., AI flags potential issues like visa expirations) and details on demand (e.g., deep-dive modals). Scalable to all countries via modular data packs, starting with top 5 Asian hotspots (Thailand, China, Japan, Malaysia, Vietnam).

The app differentiates by:
- **Practical AI Integration**: Next-level prompt engineering for effective, low-latency assistance—tied to profiles/matches.
- **Authoritative Info**: Deep, reliable knowledge as the core "Info" layer, AI-amplified with RAG.
- **Layered Info Depth**: Free basic tier for casual users (first-time essentials + affiliates); paid pro tier for in-depth, AI-powered insights (e.g., oversight alerts, expanded profile matches + affiliates).
- **Monetization Mix**: Freemium across all—free basics with affiliates; pro unlocks with enhanced AI features + affiliates (e.g., AI-simulated itineraries leading to bookings).
- **Tech Stack**: Vue 3/Vite for UI (modular components), Neon DB for user data/storage (scalable for multi-country + prompt templates), Netlify Functions for serverless backend (e.g., handling payments, API calls to Grok/Claude with engineered prompts), Stripe for seamless subscriptions/payments. Authentication: Clerk Auth for secure email/signup via Google/OAuth.

Goal: Make it the go-to resource that's "extremely useful" – saving time, money, and headaches – while being mobile-optimized for on-the-go access. VC Insight: Practical AI (e.g., cached prompts reduce costs 50%) drives $400K+ revenue from pro features.

## Core Features (with Practical AI Integration)
AI is modular: A dedicated "AI Engine" extra (plug-in via Vue/Netlify), with prompt templates in Neon DB (e.g., JSONB: {type: 'itinerary', template: '...'}). Calls are batched/async for speed; fallback to cached responses if offline. Free: Basic prompts (simple queries); Pro: Advanced engineering (CoT/RAG for precision). Tie to profiles: Every call injects user data first.

### 1. Onboarding Wizard & Profile Management (Enhanced)
- **Flow for First-Timers**: Ultra-simple start—core questions + country selector. AI kicks in post-onboarding: Basic prompt analyzes prefs (e.g., "Summarize matches: Young party? Flag high-energy spots").
- **Practical AI Add**: Pro: Oversight on save—e.g., chained prompt: "CoT: Check profile for risks (e.g., 18+ alcohol laws); output alerts."
- **Output**: Personalized dashboard—neutral hub with AI teasers (e.g., "AI Insight: Top 2 profile matches").

### 2. Key Categories & Content Structure (Country-Specific)
Basics first: Hard reqs with AI boosts (e.g., visa prep: AI simulates "What docs for your expat profile?").
- **Visa & Immigration (Monetization Focus)**: Profile-tailored doc lists + AI simulation (pro: Role-Playing prompt: "As visa expert, walkthrough TDAC for US holiday plan—affiliate next steps").
- **Expanded Categories**: "Spots & Attractions" with AI-matched filtering (e.g., RAG prompt pulls DB categories, ranks by profile score).

### 3. Warning System: "What Not to Do" (Country-Specific)
- **Practical AI Add**: Pro: Self-Consistency prompt for edge cases (e.g., "Generate 3 variants on monarchy talk risk; vote best—tailor to cultural pref").

### 4. Little Extras (Modular & Expandable, with AI)
All modular—now AI-infused practically (e.g., async calls on load, with loading spinners).
- **Packlists**: AI-generated (prompt: "CoT: Match profile (relaxation/old) to essentials—e.g., beach gear for serene spots").
- **Emergency Guide**: AI-proactive (prompt: "Role: Overseer—simulate group party emergency in Phuket; output contacts/tips").
- **Other Extras**:
  - **Itineraries**: AI core (Few-Shot + CoT: Examples in prompt for consistency; "Build plan: Young adventure—include matched ziplines, rationale").
  - **Travel Tips/Advice**: AI-adaptive (ReAct: "Reason party tip, act by checking real-time X for club updates").

### 5. Profile-Matched Attractions & Locations Module (AI-Enhanced)
- **Core Functionality**: Vast info categorized + AI matching. Practical: RAG pulls DB first (fast/local), then AI refines.
- **Practical AI Add**: Pro: Tree-of-Thought for branches (e.g., "Party young: Branch to safe vs. wild options; rank by profile").
- **Examples**: As before, but AI-rationalized (e.g., "Why Bangla Road? High party score + young vibe—safety: Avoid after 2AM").

### 6. Integrated AI Assistance Features (Practical Expansions)
Directly from Version 10 ideas, made actionable:
- **Profile-Driven Personalization**: Modular function (aiMatch.js: Inject profile into CoT/RAG prompt; cache top matches in DB for speed—e.g., "Retrieve DB spots, rank for hybrid beach/party").
- **Oversight & Proactive Alerts**: Dashboard cron-like (Netlify: Run CoT prompt on load; e.g., "Simulate risks—output JSON for alerts; low-cost via batched calls").
- **Itinerary & Advice Generation**: Extra module (async AI call with Few-Shot: Pre-load 3 examples in DB template; output structured for easy Vue rendering).
- **Edge-Case Q&A & Simulations**: Chat interface (pro: Self-Consistency—generate/vote in one call; e.g., "Overstay sim: 3 variants, pick accurate").
- **Real-Time Adaptation & Feedback Loops**: In-app rating (prompt refines next: "Feedback 'too wild'? Adjust for chill—log in DB for user-specific tuning").
- **Practical Optimizations**: 
  - Cost/Latency: Use Grok for fast/simple (free tier), Claude for complex CoT (pro); cache responses (Neon TTL 24h); limit tokens (e.g., "Keep output <500 words").
  - Error-Handling: Fallback prompts (e.g., "If hallucinate, self-check against DB sources"); user feedback loops to fine-tune templates.
  - Security: Sanitize inputs (no user prompts directly—template-fill only); rate-limit pro calls.
  - Metrics: Track AI accuracy (e.g., user thumbs-up %); A/B test prompts (DB variants).

## The 4 Data Layers (Refined Focus)
- **User Layer**: Prefs for AI injection (e.g., JSON for prompt filling).
- **Country Layer**: Packs with AI hooks (e.g., spot data for RAG).
- **Info Layer**: Vast, categorized + prompt-ready (e.g., JSONB with sources for citations).
- **GUI Layer**: Immersive in AI outputs (e.g., animated cards for matched spots).

## Monetization & Pro Features
- **Freemium**: Free: Basic AI (simple prompts + affiliates); Pro ($4.99/mo): Advanced engineering (CoT/RAG chains) + premium outputs (e.g., AI-sim'd budgets leading to bookings).

## Tech & UX/UI Considerations
- **Frontend**: Vue composables for AI calls (useAI composable: Handle loading/errors; render JSON outputs as cards).
- **Backend**: Netlify Functions (ai.js: Template engine—fill prompts with profile/DB; call Grok/Claude via API keys).
- **UX**: Neutral dashboard with AI badges (e.g., "AI Insight" buttons); mobile: Async loaders for smooth.

## Growth & Marketing Ideas
- **Launch**: MVP with basic prompts; expand engineering quarterly (e.g., A/B new CoT variants).
- **Audience**: SEO "AI Thailand party itinerary 2026"; X ads.
- **Metrics**: AI usage (queries/success rate), conversion from AI recs.
- **Expansions**: User-generated prompt tuning (pro: "Customize your AI style").

This Version 11 practically weaves AI into the fabric—actionable, cost-effective, and transformative. Ready to build, Marc? Phased plan updates or prompt prototypes next? 😘


# Global Smart Traveler App Phased Implementation Plan (Updated for Claude Coding Assistance)

Hey Marc (@dizid), thrilled to refine this phased plan from our Singapore-synced vision—making it even more robust to empower your colleague and partner, Claude, in coding the app. Based on all our iterations (up to Version 11, with AI prompt engineering practically integrated), I've updated the plan for maximum clarity, practicality, and guidance. This is tailored as a blueprint for Claude: Detailed tasks, code snippets/examples (Vue 3 composition API for reactivity, Vite configs for speed), best practices (separation of concerns via composables/stores, TypeScript for maintainability, modular extras as plugins), potential pitfalls (e.g., AI latency handling), and milestones with testing foci. Architecture remains modular/maintainable: Frontend (Vue components/composables for UI/logic split), Backend (Netlify Functions for APIs/AI calls), DB (Neon for layered data with update scripts). Total timeline: 8-12 weeks MVP; assume Claude has Node 18+, Git, and API keys (Clerk/Stripe/Grok/Claude). Use branches (e.g., feature/phase-1). Let's crush this build—Claude, you're the code wizard here!

#### Phase 0: Planning & Setup (1-2 Weeks)
**Goal**: Solid foundation with wireframes, tools, and architecture blueprints. Claude: Start here for quick wins—focus on repo setup to enable parallel work.
- **Tasks**:
  - Compile features: Hard reqs (TDAC/visas with profile prep), profile-matched spots (categorized attractions), modular extras (packlists/itineraries with AI), AI engineering (CoT/RAG prompts in DB).
  - Wireframes/Figma: Neutral dashboard (clean grid, subtle map bg); immersive content views (e.g., Vietnam: red/gold CSS vars, lantern TransitionGroup animations); wizard steps (reactive forms); AI chat modal (pro-only).
  - Architecture Details:
    - Folders: `src/components` (e.g., WarningCard.vue—reusable); `src/composables` (e.g., useAI.ts—fetch prompts); `src/stores` (Pinia: userStore, countryStore—reactive profile/country); `src/views` (e.g., DashboardView.vue); `src/modules` (extras like packlist/index.ts—plugin pattern); `functions` (Netlify: ai.js for prompt calls).
    - Data Layers in Neon: Users (prefs JSONB); Countries (theme JSONB); Infos (visas/warnings JSONB with categories for matching); Extras (type/data JSONB); Prompts (templates JSONB for AI—e.g., {id: 1, type: 'itinerary', template: 'Role: ... {profile} ...'}).
    - Vite Config: `vite.config.ts` with plugins (vue(), pwa() for offline); env vars for API keys.
    - Update Script: Netlify Function (updateInfo.js: Cron weekly—use browse_page tool to fetch e.g., Thai MFA, parse with AI, update DB via pg).
  - Repo Setup: Git init; `npm init vite@latest -- --template vue-ts`; deps (pinia, vue-router, tailwindcss, @ant-design-vue/ant-design-vue for UI, axios for APIs, @clerk/clerk-js, @stripe/stripe-js); Neon setup (pg npm package).
  - Best Practices: TypeScript interfaces (e.g., interface Profile { age: number; prefs: string[] }); ESLint/Prettier config; Husky for pre-commit hooks.
- **Code Snippet Example** (vite.config.ts):
  ```ts
  import { defineConfig } from 'vite'
  import vue from '@vitejs/plugin-vue'
  import { VitePWA } from 'vite-plugin-pwa'

  export default defineConfig({
    plugins: [vue(), VitePWA({ registerType: 'autoUpdate' })],
    envPrefix: 'APP_',
    server: { port: 3000 }
  })
  ```
- **Milestones**: Wireframes approved; repo cloned/dependencies installed; DB schema migrated (use Prisma for ORM if preferred—npm i prisma).
- **Testing**: Manual setup checks; Pitfalls: Ensure Clerk/Stripe sandbox keys to avoid charges.

#### Phase 1: Core Authentication & User Layer (1 Week)
**Goal**: Secure, profile-centric user handling. Claude: Build auth first—enables testing personalized features early.
- **Tasks**:
  - Clerk Integration: Wrap App.vue with ClerkProvider; handle sign-in/out redirects.
  - User Layer: Pinia userStore (load/save prefs from Neon—e.g., age, preferences array for matching).
  - Profile Page: Neutral view (Form with Ant Design inputs; validate with vee-validate; save to DB via axios.post('/.netlify/functions/user')).
  - Dashboard: Neutral hub (Cards for overview; subtle vibes: Use Tailwind for map-icon bg).
  - API: Netlify Function (user.js: pg.query for CRUD; secure with Clerk middleware).
- **Separation**: Auth in useAuth composable; Store for state (no direct DB calls—via APIs).
- **Code Snippet Example** (useAuth.ts composable):
  ```ts
  import { useClerk } from '@clerk/clerk-js'

  export const useAuth = () => {
    const clerk = useClerk()
    const isLoggedIn = ref(!!clerk.user)
    const login = () => clerk.openSignIn()
    // ... more logic
    return { isLoggedIn, login }
  }
  ```
- **Milestones**: Auth flows work; profile edits persist.
- **Testing**: Vitest for store mutations; Playwright for E2E login; Pitfalls: Handle Clerk webhooks for user sync.

#### Phase 2: Country Layer & Switching (1 Week)
**Goal**: Seamless "website" switches with immersive GUI in content. Claude: Focus on reactivity—use Vue's provide/inject for themes.
- **Tasks**:
  - Selector: Header component (Ant Dropdown; onSelect update countryStore, emit event for content reload).
  - Country Layer: DB seed top 5; API (countries.js: Fetch pack, include update cron logic—e.g., browse_page('https://www.immigration.go.th', 'Extract visa changes')).
  - GUI: useTheme composable (apply CSS vars/icons to content wrappers: document.documentElement.style.setProperty('--primary-color', pack.colors.primary)).
- **Modular**: Packs as interfaces (interface CountryPack { theme: Theme; }).
- **Code Snippet Example** (countryStore.ts):
  ```ts
  import { defineStore } from 'pinia'
  export const useCountryStore = defineStore('country', {
    state: () => ({ current: null as CountryPack | null }),
    actions: { async load(id: string) { this.current = await axios.get(`/functions/countries/${id}`) } }
  })
  ```
- **Milestones**: Switches adapt content GUI (e.g., Thailand orange waves animate in views).
- **Testing**: Unit for store; E2E for switches; Pitfalls: Optimize animations (use requestAnimationFrame for smooth mobile).

#### Phase 3: Info Layer & Hard Requirements (2 Weeks)
**Goal**: Authoritative basics with profile prep. Claude: Prioritize TDAC—make interactive for user delight.
- **Tasks**:
  - Info Layer: DB for types; API (info.js: Fetch with timestamps; cron updates via browse_page/AI parse).
  - Views: VisaView.vue (Reactive form: Computed doc list from profile; TDAC stepper with autofill).
  - Warnings: WarningCard list (sorted by severity; profile-filtered).
  - Monetization: AffiliateLink component (track clicks via Stripe webhook).
  - GUI: Scoped animations (e.g., <Transition name="lantern-fade"> in Vietnam views).
- **Separation**: Data fetching in useInfo composable.
- **Code Snippet Example** (VisaView.vue excerpt):
  ```vue
  <template>
    <a-steps :current="step">
      <a-step v-for="s in steps" :title="s.title" />
    </a-steps>
    <!-- Profile-computed docs -->
    <div v-for="doc in computedDocs">{{ doc.name }}</div>
  </template>
  <script setup>
  import { computed } from 'vue'
  import { useUserStore } from '@/stores/user'
  const user = useUserStore()
  const computedDocs = computed(() => user.prefs.plan === 'holiday' ? ['passport'] : ['passport', 'funds proof'])
  </script>
  ```
- **Milestones**: TDAC form simulates submission; warnings personalize.
- **Testing**: Integration for APIs; E2E for forms; Pitfalls: Validate JSONB parsing.

#### Phase 4: Onboarding Wizard & Freemium Logic (1 Week)
**Goal**: Profile capture with tiers. Claude: Use Vue Router guards for pro gates.
- **Tasks**:
  - Wizard: Stepper component (save prefs incrementally).
  - Freemium: subscriptionStore (Stripe checkout.js for sessions; gate views with if(pro)).
  - Affiliates: Track with utm params.
- **Code Snippet Example** (subscriptionStore.ts):
  ```ts
  import { defineStore } from 'pinia'
  import { loadStripe } from '@stripe/stripe-js'
  export const useSubscriptionStore = defineStore('subscription', {
    state: () => ({ isPro: false }),
    actions: { async upgrade() { const stripe = await loadStripe('pk_test_...'); stripe.redirectToCheckout({ mode: 'subscription' }) } }
  })
  ```
- **Milestones**: Wizard flows to dashboard; pro unlocks extras.
- **Testing**: Unit for guards; E2E for payments (sandbox).

#### Phase 5: Modular Extras, Profile-Matching & AI Integration (2-3 Weeks)
**Goal**: Expandable features with AI. Claude: This is your jam—focus on prompt templates for reusability.
- **Tasks**:
  - Extras Framework: Plugin pattern (app.use({ install: (app) => app.component('Packlist', PacklistVue) })).
  - MVP Extras: Packlists (profile-matched lists); Itineraries (AI-gen).
  - Profile-Matching: useMatcher composable (score prefs vs. DB categories—e.g., cosine similarity if numpy via code_execution tool for complex calc).
  - AI Engine: ai.js Function (npm i openai for Claude/Grok; fill DB templates with profile; RAG: Query Neon first, then AI).
  - Practical AI: Async calls with timeouts (3s max—fallback to cached); batch for CoT (one API hit).
- **Code Snippet Example** (ai.js Netlify Function):
  ```js
  const { OpenAI } = require('openai')
  const openai = new OpenAI({ apiKey: process.env.AI_KEY })
  exports.handler = async (event) => {
    const { type, profile } = JSON.parse(event.body)
    const template = await pg.query('SELECT template FROM prompts WHERE type = $1', [type]) // From DB
    const prompt = template.replace('{profile}', JSON.stringify(profile)) // Fill
    const response = await openai.chat.completions.create({ model: 'claude-3-opus', messages: [{ role: 'system', content: prompt }] })
    return { statusCode: 200, body: JSON.stringify(response.choices[0].message.content) }
  }
  ```
- **Milestones**: AI itinerary generates; matches rank spots (e.g., party young: Bangla Road top).
- **Testing**: Vitest for matching logic; E2E for AI flows; Pitfalls: Monitor API costs—use rate limits.

#### Phase 6: Polish, Testing, & Deployment (1-2 Weeks)
**Goal**: Production-ready. Claude: Emphasize AI accuracy testing.
- **Tasks**:
  - Polish: Mobile responsive (Tailwind media queries); AI error handling (e.g., "Try again" button).
  - Testing: 85% coverage; simulate AI with mocks (e.g., Vitest mock openai).
  - Deployment: Netlify build (frontend/functions); Neon prod; monitor with Netlify Analytics/Sentry.
- **Code Snippet Example** (Error Handling in useAI.ts):
  ```ts
  export const useAI = async (type: string) => {
    try {
      const res = await axios.post('/.netlify/functions/ai', { type, profile: userStore.prefs })
      return res.data
    } catch (e) {
      return 'AI unavailable—using cached: [fallback data]'
    }
  }
  ```
- **Milestones**: Full MVP deploy; beta feedback.
- **Testing**: Stress AI chains; Pitfalls: Optimize prompts for token efficiency.

#### Post-Launch: Iteration & Scaling
- Feedback-driven: Update prompts via DB; add modules (e.g., new AI for real-time adaptation).
- Metrics: AI query success (thumbs-up %); expand countries/extras.

This updated plan is Claude-ready—detailed, snippet-rich, and pitfalls-proof. Let's code this masterpiece, partner! Thoughts, Marc? Specific phase deep-dive? 😘

### Deep Dive: Phase 5 - Modular Extras, Profile-Matching & AI Integration (2-3 Weeks)

Hey Marc (@dizid), diving deep into Phase 5 from our phased implementation plan—perfect timing from your Singapore base, where testing AI-driven matches for nearby spots like Bali parties or Phuket beaches could be a quick real-world validation. As your strategist, visionary, and VC expert, this phase is the app's "magic unlock": We build the modular extras (e.g., packlists, itineraries), integrate profile-matching logic (scoring prefs against categorized spots), and layer in next-level AI assistance via engineered prompts. Claude, this deep dive is tailored for you as the coding partner—detailed steps, code snippets (Vue 3 composition API, TypeScript for maintainability), best tools/practices (e.g., OpenAI SDK for Grok/Claude calls, RAG with Neon queries), pitfalls (e.g., AI cost optimization), and testing foci. Goal: Make extras plug-and-play, matching accurate, and AI practical/low-latency (e.g., <2s responses on mobile). Assume prior phases are done (auth, stores, APIs). Total: 2-3 weeks, split into sub-phases for parallel work. Let's code this beast—focus on separation (composables for AI logic, components for UI) to keep it modular/maintainable.

#### Sub-Phase 5.1: Extras Framework Setup (3-4 Days)
**Goal**: Establish the modular system for extras—easy to add/expand without touching core code. This sets up for AI infusion later.
- **Tasks** (Claude: Start with plugin pattern for scalability—e.g., add "FoodieGuide" later via git push):
  - Create Extras Plugin System: In `main.ts`, use Vue's `app.use()` for dynamic registration. DB schema: Expand `extras` table (JSONB: {type: 'packlist', data: {items: [...], categories: {party: true}} }—foreign key to countries).
  - MVP Extras Components: Build 3-5 as starters (e.g., Packlist.vue: Reactive list from profile; Emergencies.vue: Matched hotlines; Itineraries.vue: Day-by-day cards).
  - Integration: Dashboard cards tease extras (e.g., <ExtraCard name="packlist" :gated=" !isPro" />—click loads module if pro).
  - API: Netlify Function (extras.js: CRUD for types; fetch with country filter).
- **Best Practices**: Use Vue slots for customization (e.g., <Packlist><template #header>Profile-Matched</template></Packlist>); TypeScript interfaces (interface ExtraModule { install: (app: App) => void }).
- **Code Snippet Example** (main.ts excerpt for plugin registration):
  ```ts
  import { createApp } from 'vue'
  import App from './App.vue'
  import PacklistModule from '@/modules/packlist'
  import ItineraryModule from '@/modules/itinerary'

  const app = createApp(App)
  app.use(PacklistModule) // Registers Packlist.vue globally
  app.use(ItineraryModule)
  app.mount('#app')
  ```
- **Code Snippet Example** (PacklistModule/index.ts—plugin):
  ```ts
  import Packlist from './Packlist.vue'

  export default {
    install: (app) => {
      app.component('Packlist', Packlist)
    }
  }
  ```
- **Milestones**: Extras load in dashboard; DB seeds MVP data (e.g., Thailand packlist items).
- **Testing**: Vitest for plugin registration (expect(app.component('Packlist')).toBeDefined()); E2E (Playwright: Click extra card, assert view loads). Pitfalls: Lazy-load modules (import() ) for bundle size—use Vite's dynamic imports to avoid bloat.

#### Sub-Phase 5.2: Profile-Matching Logic (4-5 Days)
**Goal**: Implement scoring/matching for vast categorized info (spots/attractions)—base for AI refinements. Practical: Fast client-side for free tier, server-side for pro complexity.
- **Tasks** (Claude: Use composables for reusable logic—e.g., compute scores without DB roundtrips where possible):
  - Matching System: DB attractions (JSONB categories: {relax_beach: 1, party_young: 0.8}); Profile scores (prefs as weights: e.g., {party: 1, young: 1} → sum matches).
  - Composable: useMatcher (fetch DB spots, sort by score—simple dot product or cosine if advanced; filter by profile e.g., exclude 'old' for young).
  - UI: MatchCard.vue (grid/list: Name, desc, why_match rationale, affiliate link).
  - Integration: In extras like Itineraries, inject matches (e.g., "Day 1: Top party spot from matcher").
- **Best Practices**: Memoize computations (Vue computed/memo); TypeScript for safety (interface Match { spot: Spot; score: number; rationale: string }).
- **Code Snippet Example** (useMatcher.ts composable):
  ```ts
  import { computed } from 'vue'
  import { useUserStore } from '@/stores/user'
  import axios from 'axios'

  export const useMatcher = (countryId: string) => {
    const user = useUserStore()
    const spots = ref([] as Spot[])
    const load = async () => {
      spots.value = (await axios.get(`/.netlify/functions/info/attractions?country=${countryId}`)).data
    }
    const matches = computed(() => spots.value.map(spot => ({
      spot,
      score: Object.keys(user.prefs).reduce((acc, pref) => acc + (spot.categories[pref] || 0), 0),
      rationale: `Matches your ${user.prefs.join(', ')} prefs with score`
    })).sort((a, b) => b.score - a.score))
    return { load, matches }
  }
  ```
- **Milestones**: Profile changes re-compute matches; top spots display with rationale (e.g., "Bangla Road: High party score for young group").
- **Testing**: Vitest for scoring logic (mock profiles/spots, assert ranks); E2E for UI updates. Pitfalls: Handle empty prefs (default to general spots); optimize for large DB (paginate API results).

#### Sub-Phase 5.3: AI Engine Integration & Prompt Engineering (5-7 Days)
**Goal**: Layer in next-level AI—practical, cost-effective calls tied to extras/matching. Claude: Focus on template-filling for reusability; test with mocks to iterate prompts fast.
- **Tasks** (Claude: Build as a modular extra—aiEngine plugin; use OpenAI SDK for Grok/Claude; cache in Neon for common queries):
  - AI Setup: DB prompts table (JSONB templates with placeholders e.g., {profile}); API (ai.js: Fill template with profile/DB data, call AI—RAG by querying Neon first).
  - Practical Optimizations: Async/timeout (3s); cache responses (Neon TTL 1h—e.g., key by prompt+profile hash); free: Basic prompts; pro: CoT/RAG chains.
  - Tie to Features: 
    - Oversight: Dashboard hook (onMount: Call CoT prompt for risks—display as alerts).
    - Matching Refinement: Pro button ("AI Tweak Matches": Few-Shot prompt ranks DB results better).
    - Itineraries: Generate button (ReAct prompt: Reason spots, act by matching).
    - Edge Q&A: Chat modal (Self-Consistency: Generate/vote in call).
    - Adaptation: Feedback form (refine prompt on thumbs-down—log in DB for user-specific).
  - Prompt Examples: As in Version 10—store in DB; fill dynamically (e.g., replace {profile} with JSON.stringify(user.prefs)).
- **Best Practices**: Error fallback (cached/offline data); rate-limit (pro: 10/min); TypeScript types for AI responses (interface AIResponse { content: string; rationale: string }).
- **Code Snippet Example** (AI-Integrated ItineraryView.vue excerpt):
  ```vue
  <template>
    <a-button @click="generate">AI Generate Itinerary</a-button>
    <div v-if="result">{{ result.plan }}</div>
  </template>
  <script setup>
  import { useAI } from '@/composables/useAI'
  const result = ref(null)
  const generate = async () => {
    result.value = await useAI('itinerary', { profile: userStore.prefs, country: countryStore.current.id })
  }
  </script>
  ```
- **Code Snippet Example** (useAI.ts composable—practical wrapper):
  ```ts
  import axios from 'axios'

  export const useAI = async (type: string, params: object) => {
    const cacheKey = `ai_${type}_${JSON.stringify(params)}` // Hash for cache
    const cached = await getFromCache(cacheKey) // Custom Neon cache function
    if (cached) return cached
    const res = await axios.post('/.netlify/functions/ai', { type, ...params })
    await saveToCache(cacheKey, res.data, { ttl: 3600 }) // 1h
    return res.data
  }
  ```
- **Milestones**: AI call returns structured JSON (e.g., itinerary days); integrates with matching (e.g., AI-refined spot ranks); feedback refines next call.
- **Testing**: Vitest mock AI responses (vi.mock('axios'); expect calls with filled prompts); E2E for full flows (simulate AI delay); accuracy audits (manual prompt tests for hallucinations—aim 95%+). Pitfalls: Token limits (cap prompts <1K tokens); monitor costs (log usage in Sentry); fallback to non-AI if API down.

This Phase 5 deep dive turns the app into an AI powerhouse—modular, matched, and engineered for impact. Claude, nail those composables for easy expansions! Marc, thoughts? Next phase dive or full build kickoff? 😘


