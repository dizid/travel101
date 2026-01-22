# Feature Ideas

Future enhancements to differentiate the app and delight users.

---

## Photo Spots Intelligence

**What**: Exact GPS coordinates and timing for the best photo angles at each site.

**Features**:
- Pin markers for recommended photo spots
- Time-of-day recommendations (golden hour, blue hour)
- Example photos from each angle
- Crowd-free timing suggestions
- Equipment tips (wide lens, tripod needed, etc.)

**Implementation**:
- Add `photo_spots` JSONB field to attractions metadata
- Spots array: `{ lat, lng, name, bestTime, exampleUrl, tips }`
- Map integration showing spot pins

---

## Cultural Decoder

**What**: Tap-to-learn feature explaining temple elements, Buddha poses, and iconography.

**Features**:
- Visual guide to Naga, Garuda, Yaksha figures
- Buddha mudras (hand positions) and meanings
- Architectural element glossary (chedi, prang, viharn, bot)
- Temple etiquette reminders by context
- Thai script pronunciation for site names

**Implementation**:
- Static content library of ~50 cultural elements
- Image recognition for common statues (stretch goal)
- Contextual popups on heritage detail pages

---

## Audio Tours / Time Travel

**What**: AI-generated audio guides and historical visualizations.

**Features**:
- Walking tour narration as you explore
- "In 50 meters, look left for..." location triggers
- Historical reconstructions showing original appearance
- Timeline slider on photos (before/after restoration)
- Ambient soundscapes (temple bells, chanting)

**Implementation**:
- TTS audio generation from existing descriptions
- Historical images collection for key sites
- GPS-triggered audio playback

---

## Crowd Predictions

**What**: Real-time and predicted busyness data.

**Features**:
- Current crowd level indicator (Quiet / Moderate / Busy / Very Busy)
- Historical patterns by hour/day
- "Best time to visit" optimization
- Alert: "Crowds drop 60% in 2 hours"
- Special event warnings (holidays, ceremonies)

**Implementation**:
- Google Popular Times API integration
- Store historical patterns for offline prediction
- Combine with festival calendar data

---

## Visitor Journey Tracking

**What**: Personal achievement and memory system.

**Features**:
- "Sites visited" progress tracking
- Achievement badges (UNESCO Explorer, Temple Master, etc.)
- Photo journal auto-organized by location
- Shareable "My Thailand Journey" map
- Statistics: temples visited, provinces explored, km traveled

**Implementation**:
- User activity logging (already partial in `user_profiles`)
- Badge system with unlock conditions
- Social sharing cards generation

---

## Accessibility Information

**What**: Detailed accessibility data for each site.

**Features**:
- Wheelchair accessibility rating
- Step counts and elevation
- Mobility difficulty level (easy/moderate/challenging)
- Rest stop locations
- Quiet/sensory-friendly visiting times

**Implementation**:
- Add `accessibility` JSONB to attraction metadata
- Community-contributed updates
- Filter by accessibility needs

---

## Budget Planner

**What**: Cost estimation and money-saving features.

**Features**:
- Entrance fees (Thai vs foreign pricing)
- Combo ticket savings (e.g., Ayutthaya 6-temple pass)
- "Free days" calendar
- Typical daily budget by destination
- Tipping guide

**Implementation**:
- Price fields already in heritage metadata
- Aggregate into daily/trip cost estimates
- Alert for upcoming free admission days

---

## Comparison Tool

**What**: Side-by-side comparison of similar sites.

**Features**:
- "If you liked Wat Pho, you'll love..."
- Compare two temples (era, style, crowd level, cost)
- "Why visit this one vs that one" summary
- Category-based recommendations

**Implementation**:
- Similarity scoring based on categories, era, province
- AI-generated comparison summaries
- "Similar sites" section on detail pages

---

## Priority Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Crowd Predictions | High | Medium | 1 |
| Photo Spots | High | Low | 2 |
| Cultural Decoder | High | Medium | 3 |
| Budget Planner | Medium | Low | 4 |
| Visitor Journey | Medium | Medium | 5 |
| Comparison Tool | Medium | Low | 6 |
| Audio Tours | High | High | 7 |
| Accessibility | Medium | Medium | 8 |
