# TODO: Smart Traveler Thailand

---

## Pro Features Development 🚀

### Test Mode
```
http://localhost:3000/dashboard?test=test123
```
- Persists in sessionStorage until browser closes
- Bypasses backend auth & rate limits
- To disable: `sessionStorage.removeItem('testMode')`

### Completed ✅
- [x] Test backdoor with sessionStorage persistence
- [x] Frontend sends `x-test-mode: test123` header
- [x] Backend auth/rate limit bypass for test mode
- [x] Routes: `/90-day`, `/medical`, `/cost-calculator`, `/setup-guide`
- [x] Dashboard shows 8 pro features (4 new with NEW badges)
- [x] Placeholder views for Thailand-specific pro features

### Sprint 2: AI & Offline (Next)
- [x] Enhanced multi-day itinerary generator (budget mode, travel pace, trip focus)
- [ ] Offline mode (Service Worker + IndexedDB)

### Sprint 3: Thailand Tools
- [ ] 90-Day Reporting (database, API, functional UI)
- [ ] Visa Extension Tracker enhancements
- [ ] Push notification system

### Sprint 4: Guides & Directories
- [x] Medical Tourism Hub with seed data (17 real hospitals + editorial intro)
- [x] Travel Guides system (8 guides, 74k+ chars, markdown rendering, TOC, related guides)
- [ ] More cities in Cost Calculator
- [ ] More providers in Setup Guide

---

https://partners.agoda.com/profile/personaldetails
https://safetywing.com/
last.fm (?) API?


Airalo uses Impact platform for affiliates - sign up at partners.airalo.com to get proper tracking links
Once you have Impact affiliate link, update the Airalo URL format in affiliates.ts



## Affiliate Program Status

| Partner | Status | ID | Dashboard |
|---------|--------|-----|-----------|
| 12Go Asia | ✅ Active | 14551206 | https://agent.12go.asia |
| Klook | ✅ Active | 108922 | https://affiliate.klook.com |
| Viator | ✅ Active | P00284724 | https://partners.viator.com |
| Booking.com | ❌ Rejected by CJ — quality upgrade done, reapply | - | https://www.booking.com/affiliate-program/v2/index.html |
| GetYourGuide | ⏳ Apply now | - | https://partner.getyourguide.com |
| SafetyWing | ⏳ Applying | - | https://safetywing.com/partners |
| NordVPN | ⏳ Applying | - | https://nordvpn.com/affiliate |
| Skyscanner | 🔜 Later (need 5K/mo traffic) | - | https://www.partners.skyscanner.net |
| Agoda | ❌ Rejected | Site ID: 1956706 | Re-apply when site is more developed |
| Airalo | ❌ Declined | - | - |

### Affiliate Game Plan

**Next steps — apply to these (copy-paste text in plans/nifty-moseying-puddle.md):**

1. [ ] **Booking.com** — Reapply via CJ (rejected 2026-03-01, quality upgrade completed)
2. [ ] **GetYourGuide** — Apply as affiliate partner, ~2-5 days approval
3. [ ] **SafetyWing** — Follow up on application if no response
4. [ ] **NordVPN** — Follow up on application if no response

**Once IDs are obtained:**

5. [ ] Add Viator (P00284724) affiliate links to attraction detail pages
6. [ ] Add Booking.com affiliate links to hotel recommendations
7. [ ] Add GetYourGuide affiliate links to tour/activity recommendations
8. [ ] Update `src/utils/affiliates.ts` with new partner IDs
9. [ ] Update `.env.local` with new affiliate IDs
10. [ ] Add affiliate disclosure to footer (FTC compliance)

**Later:**

11. [ ] Apply to Skyscanner when monthly traffic reaches 5K+
12. [ ] Re-apply to Agoda when site is more established
13. [ ] A/B test affiliate button placements
14. [ ] Build commission tracking dashboard

## How to Get Affiliate IDs / API Keys

### Booking Partners

#### Klook
1. Go to https://affiliate.klook.com
2. Click "Join Now" and create account
3. Fill in website details (HappyRoam.travel)
4. Wait 1-3 days for approval email
5. Once approved: Dashboard → Account Settings → find **Affiliate ID**
6. Add to `.env.local`: `VITE_KLOOK_AFFILIATE_ID=your_id`
- **Commission**: 3-5% per booking

#### Agoda
1. Go to https://partners.agoda.com
2. Click "Sign Up" → Choose "Affiliate Partner"
3. Provide website URL and monthly traffic estimates
4. Wait 3-5 days for approval
5. Find **CID** (Campaign ID) in Partner Dashboard
6. Add to `.env.local`: `VITE_AGODA_AFFILIATE_ID=your_cid`
- **Commission**: 5-7% per booking

#### 12Go Asia
1. Go to https://12go.asia/affiliate
2. Register with email and website info
3. Quick approval (usually same day)
4. Get **Referer ID** from affiliate dashboard
5. Add to `.env.local`: `VITE_12GO_AFFILIATE_ID=your_referer`
- **Commission**: 50% of their commission (varies by route)

#### GetYourGuide
1. Go to https://partner.getyourguide.com
2. Apply as "Affiliate Partner"
3. Describe your traffic source (travel website)
4. Wait 2-5 days for approval
5. Get **Partner ID** from dashboard
6. Add to `.env.local`: `VITE_GETYOURGUIDE_AFFILIATE_ID=your_partner_id`
- **Commission**: 8% per booking

### Travel Essentials Partners

#### SafetyWing (Travel Insurance)
1. Go to https://safetywing.com/partners
2. Click "Become a Partner"
3. Fill application (mention travel/nomad audience)
4. Approval within 48 hours
5. Get **Reference ID** from ambassador dashboard
6. Add to `.env.local`: `VITE_SAFETYWING_AFFILIATE_ID=your_ref_id`
- **Commission**: ~10% recurring monthly

#### NordVPN
1. Go to https://nordvpn.com/affiliate
2. Apply through their affiliate program (or via CJ Affiliate)
3. May require traffic proof for approval
4. Get **Affiliate Link/ID** from dashboard
5. Add to `.env.local`: `VITE_NORDVPN_AFFILIATE_ID=your_id`
- **Commission**: 40-100% on first payment

### .env.local Template

```bash
# Booking Partners
VITE_KLOOK_AFFILIATE_ID=108922
VITE_AGODA_AFFILIATE_ID=1956706
VITE_12GO_AFFILIATE_ID=14551206
VITE_GETYOURGUIDE_AFFILIATE_ID=

# Travel Essentials
VITE_SAFETYWING_AFFILIATE_ID=
VITE_NORDVPN_AFFILIATE_ID=
```

### Priority Order (by conversion potential)
1. **Klook + Agoda** - Highest conversion for Thailand travel
2. **12Go** - Fast approval, good for transport bookings
3. **SafetyWing** - Easy approval, recurring commissions, nomad audience
4. **GetYourGuide** - Good for guided tours
5. **NordVPN** - Lower volume but high margins

---

## MAGA Improvements (Make App Great Again)

### Completed ✅
- [x] **SEO Foundation** - OG tags, Twitter Cards, JSON-LD structured data, dynamic sitemap
- [x] **Pro Conversion Boost** - Blurred secrets, urgency badges, compelling CTAs
- [x] **Favorites System** - Heart icons on cards, /saved page, synced to profile
- [x] **Social Sharing** - WhatsApp, Facebook, X, Pinterest, Copy Link (native Web Share on mobile)
- [x] **Email Capture** - Newsletter signup in footer, database storage
- [x] **New Affiliates** - SafetyWing (insurance), NordVPN added
- [x] **OG Image** - SVG social sharing preview at `/public/og-image.svg`
- [x] **Exit-intent Popup** - Email capture with Thailand Packing Checklist lead magnet
- [x] **Shareable Match Cards** - Click match score to share "I'm 94% Koh Lanta!"

### Pending
- [ ] Convert OG image to PNG/JPG (better platform support)
- [ ] Add annual pricing option to Stripe (20% discount)
- [ ] A/B test affiliate button colors/placement
- [ ] PWA: Add to homescreen prompt, offline viewing
- [ ] User reviews on attractions (Pro users only)
- [ ] Export itinerary to Google/Apple Calendar
- [ ] PDF export for offline itineraries

### Environment Variables (New Affiliates)
```
VITE_SAFETYWING_AFFILIATE_ID   # SafetyWing referral ID
VITE_NORDVPN_AFFILIATE_ID      # NordVPN affiliate ref
```

---

# Scale to 1000s of Places

## Goal
Expand from 15 attractions to 1000s of places (attractions, courses, tours, activities, co-working, restaurants, events) with AI-powered categorization for accurate profile matching.

---

## Progress

### Phase 1: Database Evolution ✅ DONE
- [x] Add `place_type` column (attraction, course, tour, activity, coworking, restaurant, event)
- [x] Add `metadata` JSONB for type-specific fields
- [x] Add `external_ids` JSONB for deduplication
- [x] Add `verification_status` for AI pipeline tracking
- [x] Add `data_source` and `ai_enriched_at` columns
- [x] Create indexes for efficient querying

### Phase 2: AI Enrichment Pipeline ✅ DONE
- [x] Create `/api/enrich-place` function
- [x] AI scoring against 30+ category dimensions
- [x] Validation rules (co-working needs nomad score, etc.)
- [x] Support for `enrich_single`, `enrich_batch`, `get_pending` actions

### Phase 3: Google Places Ingestion ⏳ NEEDS API KEY
- [x] Create `/api/google-places` ingestion function
- [ ] Set up Google Places API key (https://console.cloud.google.com → Enable Places API)
- [ ] Ingest top Thailand attractions (temples, parks, landmarks)
- [ ] Ingest restaurants in major cities
- [ ] Run AI enrichment on ingested places

### Phase 4: Viator Integration ⏳ NEEDS API KEY
- [x] Create ingest-places.mts function
- [x] Add sample data (5 courses, 4 tours, 3 activities, 3 coworking) - 29 total places
- [ ] Apply for Viator affiliate (https://viator.com/affiliates) - takes 1-3 days
- [ ] Ingest Viator tours, courses, activities
- [ ] Map Viator categories to our taxonomy
- [ ] Add affiliate booking links

### API Keys Status 🔑
| Key | Status | Action |
|-----|--------|--------|
| ANTHROPIC_API_KEY | ✅ Configured | AI enrichment ready |
| GOOGLE_PLACES_API_KEY | ✅ Configured | Ready for Google Places ingestion |
| VIATOR_API_KEY | ✅ Configured | Ready for Viator integration |

### Phase 5: Matching Algorithm Updates ⏳ PENDING
- [ ] Add type-specific weight modifiers
- [ ] Add courseInterests, dietaryRestrictions to profile
- [ ] Co-working only for digital_nomad trip type

---

## Data Sources

| Place Type | API | Status | Est. Count |
|------------|-----|--------|------------|
| Attractions | Google Places | Needs API key | 200+ |
| Tours | Viator | In progress | 500+ |
| Courses | Viator/GYG | In progress | 100+ |
| Activities | Viator | In progress | 200+ |
| Co-working | Manual/Coworker | Pending | 50+ |
| Restaurants | Google Places | Needs API key | 300+ |

---

## API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/api/attractions` | List/filter places |
| `/api/attractions/:slug` | Place detail with tips/secrets |
| `/api/enrich-place` | AI category scoring pipeline |
| `/api/attraction-ai` | Personalized AI features |

---

## Environment Variables Needed

```
DATABASE_URL          - Neon PostgreSQL (configured)
ANTHROPIC_API_KEY     - For AI features (configured)
GOOGLE_PLACES_API_KEY - For place ingestion (needed)
VIATOR_API_KEY        - For tours/activities (free affiliate)
```

---

## Revenue Optimization

### Current Revenue Streams
- Pro subscription ($X/month) via Stripe
- Affiliate commissions (Klook, Agoda, 12Go, GetYourGuide, SafetyWing, Airalo, NordVPN)

### Future Opportunities
- [ ] Sponsored placements (hotels pay for featured spots)
- [ ] Tour operator partnerships (white-label booking)
- [ ] Price comparison widget (Klook vs GetYourGuide)
- [ ] Commission tracking dashboard
- [ ] Push notifications for saved trip reminders

---

## Quick Reference

### Key Files
| Feature | File |
|---------|------|
| SEO utils | `src/utils/seo.ts` |
| SEO composable | `src/composables/useSeo.ts` |
| Favorites | `src/composables/useFavorites.ts` |
| Share button | `src/components/ui/ShareButton.vue` |
| Match score card | `src/components/ui/MatchScoreCard.vue` |
| Exit-intent popup | `src/components/ui/ExitIntentPopup.vue` |
| Newsletter | `src/components/ui/NewsletterSignup.vue` |
| Saved places | `src/views/SavedPlacesView.vue` |
| Affiliates | `src/utils/affiliates.ts` |
| Sitemap | `netlify/functions/sitemap.mts` |
| Newsletter API | `netlify/functions/newsletter.mts` |
| OG image | `public/og-image.svg` |

### Verify Deployment
1. **SEO**: https://metatags.io - verify OG tags
2. **Structured Data**: Google Rich Results Test
3. **Sitemap**: https://happyroam.travel/sitemap.xml
4. **Favorites**: Save a place → refresh → verify persistence
5. **Sharing**: Test WhatsApp/Facebook on mobile
