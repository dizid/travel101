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
- Browse places across Thailand
- Detail views with visitor information
- Smart matching based on user preferences (Pro)

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

### Warnings & Tips
- Cultural customs and local tips
- Safety advisories

## Technical

### Authentication
- Clerk-powered user auth
- Persistent sessions with local storage backup

### Subscriptions (Stripe)
- Free and Pro tiers
- Stripe Checkout integration
- Customer billing portal
- Webhook handling for subscription events

### Backend (Netlify Functions)
- `user.mts` - User profile management
- `ai.mts` - AI chat endpoints
- `subscription.mts` - Stripe subscription handling
- `webhook-stripe.mts` - Payment webhook processing

### Database (Neon PostgreSQL)
- User preferences (JSONB)
- Saved itineraries
- AI response caching (7-day TTL)
- User activity tracking
- Affiliate click tracking with conversion metrics
