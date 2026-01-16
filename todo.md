# TODO: Scale to 1000s of Places

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
- [ ] Set up Google Places API key
- [ ] Ingest top Thailand attractions (temples, parks, landmarks)
- [ ] Ingest restaurants in major cities
- [ ] Run AI enrichment on ingested places

### Phase 4: Viator Integration 🔄 IN PROGRESS
- [ ] Create Viator API integration (free affiliate)
- [ ] Ingest tours, courses, activities
- [ ] Map Viator categories to our taxonomy
- [ ] Add affiliate booking links

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
