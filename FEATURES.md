# Features

## Travel Planning

### Visa Wizard
- Step-by-step visa recommendation based on nationality, trip purpose, and duration
- Supports holiday, digital nomad, and long-term stay scenarios
- Age-based recommendations (retirement visa for 50+)
- Interactive departure checklist with progress tracking

### AI Travel Advisor
- Chat-based assistant for Thailand travel questions
- Suggested prompts: visa help, best times to visit, hidden gems, safety tips
- Conversation history with clear option
- Pro members get unlimited conversations

### Itinerary Builder
- Create and save multi-day travel plans
- AI-powered itinerary generation (Pro)
- Tips and recommendations per destination

### Attractions & Destinations
- Browse places across Thailand with hero imagery
- Detail views with visitor information and related guides
- Smart matching based on user preferences (Pro)

### Travel Guides (Editorial Content)
- 8 in-depth travel guides (1,500+ words each, 74k+ chars total)
- Categories: destination, practical, budget, food, culture, safety
- Markdown rendering with table of contents
- Related guides cross-linking on guide/attraction/festival detail pages
- Article JSON-LD structured data for SEO

### Onward Ticket
- Book proof-of-onward-travel tickets
- PDF generation for immigration
- Dual pricing (standard + Pro discount)

## User Experience

### Personalized Profiles
- Travel style preferences (adventure, relaxation, culture, etc.)
- Budget level (budget, mid-range, luxury)
- Group type (solo, couple, family, friends)
- Nationality for visa recommendations
- Profile completeness indicator

### Dashboard
- Personalized greeting with Thai "Sawasdee"
- Quick links to key features
- Pro upgrade prompts with feature highlights

## Travel Resources

### TDAC Guide
- Thai Digital Arrival Card walkthrough
- Pre-departure checklist integration

### Safety & Medical
- Province-level safety ratings with 8 accordion sections (general, transport, food/water, health, embassies, solo/women travelers, weather, scams)
- Medical tourism hub with 17 real hospitals and editorial intro
- Scam reports database

### Warnings & Tips
- Cultural customs and local tips
- Safety advisories

## SEO & Trust

### Structured Data
- JSON-LD schemas: FAQPage, Article, WebSite, HowTo, BreadcrumbList
- BreadcrumbNav component on 9+ views
- Dynamic XML sitemap with all public routes + guide pages
- Hreflang tags for language targeting
- Affiliate links use `rel="nofollow noopener noreferrer"`

### Content Credibility
- About page with editorial process and team info
- "Last updated" dates on content pages
- Hero sections with real imagery on listing pages
- Real images on attraction cards with lazy loading

## Technical

### Authentication
- Neon Auth powered user authentication
- Persistent sessions with local storage backup

### Subscriptions (Stripe)
- Free and Pro tiers
- Stripe Checkout integration
- Customer billing portal
- Webhook handling for subscription events

### Backend (Netlify Functions — 26 endpoints)
- `user.mts` - User profile management
- `ai.mts` - AI chat endpoints
- `attraction-ai.mts` - Personalized attraction AI
- `attractions.mts` - Attraction queries/filtering
- `guides.mts` - Travel guides (list, get by slug, categories)
- `itinerary.mts` - AI itinerary generation
- `matches.mts` - Profile-based matching
- `onward-ticket.mts` - Onward ticket booking + PDF
- `packing.mts` - AI packing list generator
- `weather.mts` - Weather forecasts
- `alerts.mts` - Travel alerts
- `currency.mts` - Currency conversion
- `heritage.mts` - Heritage sites data
- `festivals.mts` - Thai festivals data
- `safety.mts` - Safety information by region
- `subscription.mts` - Stripe subscription handling
- `webhook-stripe.mts` - Payment webhook processing
- `newsletter.mts` - Email signups
- `sitemap.mts` - Dynamic sitemap (includes guide pages)

### Database (Neon PostgreSQL)
- User preferences (JSONB)
- Saved itineraries
- AI response caching (7-day TTL)
- User activity tracking
- Affiliate click tracking with conversion metrics
