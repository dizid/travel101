# Global Smart Traveler - MVP Plan

A personalized travel webapp for tourists, expats, and digital nomads. Delivers hyper-relevant info bridging official rules with real-world realities.

## MVP Scope

**Country**: Thailand (expand to China, Japan, Malaysia, Vietnam post-MVP)
**Core Value**: Visa/TDAC guidance + AI-powered personalization

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vue 3 + Vite + TypeScript |
| UI | Tailwind CSS + Ant Design Vue |
| State | Pinia |
| Database | Neon (PostgreSQL) |
| Backend | Netlify Functions |
| Auth | Clerk |
| Payments | Stripe |
| AI | Claude API |

## Thai-Friendly UX Philosophy

### Apply Everywhere
Not just warnings - the entire app should feel welcoming and respectful of Thai culture.

### UI/UX Principles
- **Colors**: Warm golds, soft blues, Thai-inspired accents
- **Imagery**: Welcoming scenes, smiling faces, beautiful landscapes
- **Language**: Friendly, helpful, never condescending
- **Icons**: Thai-inspired motifs where appropriate

### Tone Examples by Section

| Section | ❌ Don't | ✓ Do |
|---------|----------|------|
| Homepage | "Navigate Thailand's complex visa system" | "Your friendly guide to visiting the Land of Smiles" |
| Visa Info | "Requirements you MUST meet" | "Here's what you'll need for a smooth arrival" |
| Warnings | "DANGER: Severe penalties" | "Good to know: Thai customs to respect" |
| Errors | "Invalid input" | "Oops! Let's try that again" |

### Thai Touches
- "Sawasdee" (Welcome) on homepage
- "Khob khun" (Thank you) on completion screens
- Subtle Thai script accents in design

## Database Schema

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  prefs JSONB DEFAULT '{}',
  is_pro BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  theme JSONB DEFAULT '{}'
);

CREATE TABLE infos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id UUID REFERENCES countries(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  severity INTEGER,
  categories JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT UNIQUE NOT NULL,
  template TEXT NOT NULL,
  model TEXT DEFAULT 'claude-sonnet-4-20250514',
  tokens_estimate INTEGER
);

CREATE TABLE ai_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  prompt_hash TEXT NOT NULL,
  response JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE TABLE user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  partner TEXT NOT NULL,
  context TEXT,
  destination_url TEXT,
  converted BOOLEAN DEFAULT false,
  commission_amount DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## User Profile Schema

```json
{
  "travel_style": ["party", "adventure", "relaxation", "culture"],
  "age_group": "young|middle|senior",
  "group_type": "solo|couple|family|friends",
  "budget": "budget|mid|luxury",
  "interests": ["beach", "nightlife", "temples", "food", "shopping"],
  "nationality": "US",
  "trip_type": "holiday|expat|digital_nomad"
}
```

## Thailand Content Structure

### Visa Types (with wizard flows)
- **Tourist Visa (TR)** - 60 days, extendable
- **Visa Exemption** - 30/45 days depending on nationality
- **Special Tourist Visa (STV)** - 90 days, for long-stay tourists
- **Non-Immigrant B** - Business/Work permit holders
- **Non-Immigrant O** - Family/Retirement (50+ years)
- **Non-Immigrant ED** - Education/Study
- **Thailand Elite Visa** - 5-20 year premium visa
- **Digital Nomad Visa (DTV)** - New 2024, 180 days for remote workers

### Warning Categories (Thai-Friendly Tone)
- Royal Family (respectful guidance)
- Drug Laws (clear facts)
- Common Scams (helpful awareness)
- Traffic & Transport (practical tips)
- Beach Safety (seasonal info)
- Nightlife (responsible enjoyment)

## TDAC (Thai Digital Arrival Card) - Complete Guide

### What It Is
The TM6 paper arrival card was replaced by the digital TDAC in 2024. All travelers must complete this online before arriving in Thailand.

### Quick Summary
- Submit online at: tdac.immigration.go.th
- Complete within 72 hours before arrival
- Free of charge
- Receive QR code confirmation via email

### All Fields Explained

**Personal Information**
| Field | Description | Tips |
|-------|-------------|------|
| Passport Number | Exactly as shown on passport | No spaces |
| Full Name | Must match passport exactly | Include middle name if on passport |
| Date of Birth | DD/MM/YYYY format | Thai format, not US |
| Nationality | Country of passport | Not country of birth |
| Gender | As shown on passport | |

**Travel Details**
| Field | Description | Tips |
|-------|-------------|------|
| Flight Number | e.g., TG401 | Include airline code |
| Departure Airport | 3-letter code (e.g., SIN) | Where you're flying from |
| Arrival Airport | BKK, DMK, HKT, CNX, etc. | Thai airport code |
| Arrival Date | DD/MM/YYYY | Must match flight |

**Accommodation**
| Field | Description | Tips |
|-------|-------------|------|
| Hotel/Address | Where you're staying first night | Can be hotel name or Airbnb address |
| Province | Thai province (e.g., Bangkok, Phuket) | Select from dropdown |
| Phone | Contact number in Thailand | Hotel number works |

**Purpose & Duration**
| Field | Description | Tips |
|-------|-------------|------|
| Purpose of Visit | Holiday/Business/Transit/Other | Match your visa type |
| Length of Stay | Number of days | Don't exceed visa allowance |
| Previous Visits | Yes/No, how many | Be honest |

### Common Mistakes to Avoid
- Name doesn't match passport exactly
- Wrong date format (use DD/MM/YYYY)
- Forgetting to save/screenshot QR code
- Submitting too early (>72 hours)

### Profile Prefill Feature
If logged in with profile completed, we auto-fill:
- Nationality → from profile
- Purpose → from trip_type
- Typical duration → from travel history

User reviews and confirms before submitting externally.

## Attractions by Profile Match

### Popular Destinations
| Category | Destinations |
|----------|--------------|
| Beaches | Phuket, Krabi, Koh Samui, Koh Phangan, Hua Hin |
| Culture | Bangkok temples, Chiang Mai, Ayutthaya, Sukhothai |
| Nightlife | Bangla Road, Khao San, Thonglor, RCA Bangkok |
| Nature | Khao Sok, Pai, Chiang Rai, Doi Inthanon |
| Islands | Phi Phi, Koh Tao, Koh Lipe, Koh Chang |

### Hidden Gems (Raw Diamonds)
| Category | Off-the-beaten-path |
|----------|---------------------|
| Secret Beaches | Koh Kood, Koh Mak, Koh Yao Noi, Koh Bulon |
| Authentic Culture | Nan Province, Loei, Phrae, Lampang |
| Local Nightlife | Ekamai, Ari, Nimman (Chiang Mai) |
| Untouched Nature | Khao Luang, Phu Kradueng, Umphang |
| Remote Islands | Koh Tarutao, Koh Adang, Koh Kradan |

### Lifestyle Categories
| Category | Destinations |
|----------|--------------|
| Foodie Heaven | Yaowarat (Bangkok), Chiang Mai Old City, Isan region |
| Digital Nomad Hubs | Chiang Mai, Koh Lanta, Bangkok (Ari/Ekkamai) |
| Wellness & Retreat | Koh Samui spas, Chiang Mai meditation, Pai yoga |
| Adventure Sports | Koh Tao diving, Chiang Mai trekking, Railay climbing |
| Family Friendly | Hua Hin, Pattaya (family areas), Khao Yai |
| Romantic Escapes | Koh Yao Noi, Koh Lipe, Pai, Railay |
| Budget Backpacker | Koh Phangan, Pai, Chiang Mai, Koh Tao |
| Luxury Experience | Phuket villas, Koh Samui resorts, Bangkok 5-star |

## Visa Wizard Flow

### Step 1: Your Situation
Prefilled from profile (if completed):
- Nationality: dropdown, prefill from profile
- Current location: in Thailand / outside
- Trip purpose: holiday / work / study / retire / nomad
- Planned duration: days slider

### Step 2: AI Analysis (FREE - teaser for pro)
- System checks: nationality + purpose + duration
- Returns: recommended visa type + requirements
- Shows: "Get personalized itinerary with Pro" CTA

**Long Stay Guidance**
If planned duration exceeds visa-free allowance, display:

"Planning to stay over 30 days? Here are your options:"
1. **Extend at Immigration** - 1,900 THB for 30 more days
2. **Apply for Tourist Visa** - 60 days from embassy
3. **Border run** - Current status and recommendations

**Border Run Reality Check** (AI-generated, kept current):
- Current enforcement level (strict/normal/relaxed)
- Which borders are easiest
- Risk assessment based on previous visits
- "Thailand is tightening rules on repeated border runs. For stays over 90 days, consider a proper visa."

**For Digital Nomads** (detected from profile):
- Highlight DTV visa option
- Compare: border runs vs. DTV vs. Elite visa
- Cost/benefit analysis

### Step 3: Document Checklist
Dynamic checklist based on visa type. Users can check off documents as they prepare:

☐ Valid passport (6+ months validity)
☐ Return/onward flight booking
☐ Hotel reservation for first night
☐ Proof of funds (20,000 THB or equivalent)
☐ TDAC completed
☐ Travel insurance (recommended)

**How it works:**
- Progress saved to user's account
- Can return later and continue
- Shows completion percentage
- Optional email reminder: "You're 60% ready for Thailand!"
- Links to official sources for each document

## Warning System Approach

### Tone Guidelines
- Informative, not alarmist
- "Good to know" vs "DANGER!"
- Cultural respect emphasis
- Practical actionable advice

### Severity Levels
| Level | Icon | Meaning |
|-------|------|---------|
| 1 | 💡 | Tip - Nice to know |
| 2 | 📋 | Note - Important info |
| 3 | ⚠️ | Heads Up - Pay attention |
| 4 | 🚨 | Critical - Legal/safety essential |

### Example Tone
**Royal Family**: "Thai people deeply revere their Royal Family. Showing respect is appreciated and keeps you on the right side of local customs and laws."

**Drug Laws**: "Thailand has strict drug laws with serious consequences. The safest approach is complete avoidance - this keeps your trip worry-free."

## Monetization: Affiliate Integration

### Affiliate Partners (Priority Order)
1. **Agoda** - Hotels (strongest SE Asia coverage)
2. **Klook** - Activities/tours
3. **SafetyWing** - Travel insurance (nomad-focused)
4. **Wise** - Money transfers
5. **GetYourGuide** - Experiences
6. **12Go** - Transport bookings

### Integration Points
| Location | Affiliate | Trigger |
|----------|-----------|---------|
| Visa page | SafetyWing | After visa type selected |
| Attractions | Klook/GYG | On attraction detail view |
| Itinerary | Agoda | Hotel in generated plan |
| TDAC page | Wise | "Need Thai Baht?" sidebar |
| Dashboard | Mixed | Personalized recommendations |

### Implementation Principles
- Contextual placement (not spammy)
- User value first: "Book this temple tour" vs banner ad

### Tracking Approach

**Google Analytics** - For general metrics:
- Page views, user flows
- Demographics, devices
- Bounce rates, session duration

**Custom DB Tracking** - For business-critical data:
Why not GA alone?
- Affiliate attribution needs precise click→conversion tracking
- GA doesn't track individual user journeys well
- Need to correlate user profiles with conversions
- Commission disputes require our own records

What we track in `affiliate_clicks` table:
- Which user clicked
- From which page context
- To which partner
- Whether they converted (webhook from affiliate)
- Commission earned

Both GA and custom tracking complement each other.

## Free vs Pro Features

| Feature | Free | Pro ($10/mo) |
|---------|:----:|:------------:|
| Browse visa/warning info | ✓ | ✓ |
| Profile creation | ✓ | ✓ |
| Basic search/filter | ✓ | ✓ |
| Visa wizard with AI advice | ✓ (teaser) | ✓ (full) |
| AI-generated itineraries | ✗ | ✓ |
| AI-driven matching | ✗ | ✓ |
| Personalized oversight alerts | ✗ | ✓ |
| Edge-case Q&A chat | ✗ | ✓ |

## Dashboard Sections

### For All Users
- Profile summary (edit link)
- Saved country: Thailand
- Quick links: Visa, Warnings, Attractions

### For Logged-In Users

**Subscription Status**
- Free tier / Pro ($10/mo)
- "Upgrade to Pro" or "Manage subscription"
- Next billing date (if pro)

**Activity History**
- Visa wizard: completed/in-progress
- AI queries used (pro)
- Saved itineraries
- Affiliate bookings made

**Personalized Recommendations**
- Based on profile + history
- Affiliate-linked suggestions

## AI Prompt Templates System

### How It Works
1. Templates stored in `prompts` table with placeholders
2. Netlify function fills placeholders with user context
3. Cached responses reduce API costs
4. Templates versioned for A/B testing later

### Template: Visa Advisor (FREE - teaser)
```
Type: visa_advisor

You are a Thailand visa expert. Based on this traveler's profile:
- Nationality: {nationality}
- Trip purpose: {trip_type}
- Duration: {duration} days
- Age group: {age_group}

Recommend the best visa option in 2-3 sentences. Be helpful and concise.
End with: "Want a detailed preparation checklist? Upgrade to Pro for personalized guidance."
```

### Template: Itinerary Generator (PRO)
```
Type: itinerary_generator

Create a {duration}-day Thailand itinerary for this traveler:
- Travel style: {travel_style}
- Interests: {interests}
- Budget: {budget}
- Group: {group_type}

Format as JSON:
{
  "days": [
    {
      "day": 1,
      "location": "Bangkok",
      "activities": ["activity1", "activity2"],
      "accommodation_area": "Sukhumvit",
      "estimated_budget": "$50-80"
    }
  ],
  "tips": ["tip1", "tip2"],
  "warnings": ["relevant warning"]
}
```

### Template: Smart Matching (PRO)
```
Type: attraction_matcher

Given this traveler profile:
{full_profile_json}

And these Thailand attractions from our database:
{attractions_json}

Rank the top 5 attractions with match scores (0-100) and explain why each matches.
Return JSON array sorted by score descending.
```

### Caching Strategy
- Hash: type + profile subset relevant to query
- TTL: 24 hours for itineraries, 1 hour for matching
- Invalidate on profile change

## AI-Driven Features (Pro)

### Smart Matching Algorithm
1. User profile → extract relevant traits
2. Query DB for attractions with category scores
3. AI ranks matches with explanations
4. Return top 10 with "why this matches you"

**Example output:**
```json
{
  "matches": [
    {
      "name": "Phi Phi Islands",
      "score": 92,
      "reason": "Perfect for your beach + adventure combo. Young crowd, great snorkeling.",
      "affiliate_link": "klook.com/phi-phi-tour"
    }
  ]
}
```

### Itinerary Generation
1. User selects: duration, base city, must-sees
2. AI generates day-by-day plan
3. Each day includes:
   - Morning/afternoon/evening activities
   - Recommended area to stay
   - Budget estimate
   - Transport tips
4. Affiliate links embedded naturally
5. Save to user history

### Oversight Alerts (Pro Dashboard)
Proactive AI checks on profile:
- Visa expiring soon? → Reminder
- Traveling during monsoon? → Weather warning
- Budget traveler going to expensive area? → Alternatives

## Architecture

```
src/
├── components/
│   ├── WarningCard.vue
│   ├── VisaStepper.vue
│   ├── ProfileForm.vue
│   ├── ProGate.vue
│   └── AffiliateLink.vue
├── composables/
│   ├── useAuth.ts
│   ├── useAI.ts
│   └── useProfile.ts
├── stores/
│   ├── userStore.ts
│   ├── countryStore.ts
│   └── subscriptionStore.ts
├── views/
│   ├── HomeView.vue
│   ├── DashboardView.vue
│   ├── VisaWizardView.vue
│   ├── TDACGuideView.vue
│   └── WarningsView.vue
└── modules/
    ├── packlist/
    └── itinerary/

functions/
├── user.js
├── countries.js
├── info.js
├── ai.js
├── affiliate.js
└── stripe-webhook.js
```

## Implementation Phases

### Phase 1: Foundation
- Vue/Vite project setup with TypeScript
- Tailwind + Ant Design Vue configuration (Thai-friendly theme)
- Clerk auth integration
- Neon DB setup with schema migration
- Basic routing (Home, Dashboard, Visa, Warnings)
- Netlify Functions scaffolding

### Phase 2: Content (Thailand)
- Country data seeding (extensive Thailand content)
- TDAC complete guide with field explanations
- Visa wizard with profile prefill + border run info
- Thai-friendly warning system
- Attractions with hidden gems + lifestyle categories
- Affiliate integration (Agoda, Klook, SafetyWing, Wise)

### Phase 3: Personalization
- Profile wizard (onboarding flow)
- Pinia stores for user/country state
- Free content browsing (no login required)
- Document checklist with progress tracking
- Dashboard with subscription status & activity history

### Phase 4: AI & Pro Tier
- Claude API integration via Netlify Function
- Prompt templates in database
- Response caching with TTL
- Stripe subscription integration ($10/mo)
- Pro feature gating (AI features)
- AI-driven matching and itineraries
- Oversight alerts system

## Key User Flows

1. **First Visit**: Browse Thailand visa info → See warning cards → Optional signup
2. **Visa Wizard**: Select situation → Get free AI advice → See pro teaser → Track checklist progress
3. **Signup**: Clerk auth → Profile wizard → Dashboard with personalized view
4. **Pro Upgrade**: Hit AI feature → See pro gate → Stripe checkout → Access AI
5. **AI Query**: Select itinerary type → AI generates → Display with affiliate links → Save to history

## Post-MVP Roadmap

- Additional countries (China, Japan, Malaysia, Vietnam)
- PWA offline mode
- Real-time data updates via cron
- User feedback loop for AI refinement
- Mobile app wrapper (Capacitor)
