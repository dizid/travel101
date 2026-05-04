# HappyRoam.travel — Discoverability Plan

> **Status**: In Progress (2026-03-28)
> **Priority**: Discoverability > Features — content quality is proven, distribution is the bottleneck

## The Problem

GA4 data (30-day, property 520220665):
- ~880 sessions, 99% direct, **0% organic search**, 92% bounce rate
- Best engaged pages: dashboard (29s), TDAC guide (20s), visa (10s), onward-ticket (8.7s), heritage (8.5s)
- 1,201 prerendered pages but **zero Google-indexed pages**

### Root Cause: SSG Pipeline is Broken

| # | Issue | Impact |
|---|---|---|
| 1 | All dynamic pages prerender as "Place not found" — `onMounted()` never fires during SSG | 1,100+ pages are thin/duplicate |
| 2 | All dynamic pages carry homepage canonical + title — Google sees 1,200 duplicates | Zero indexable unique pages |
| 3 | Sitemap returns 502 — function crashes in production | No URL discovery for Google |
| 4 | Festival/heritage/guide detail pages don't exist in dist/ | 103+ pages missing entirely |
| 5 | List pages prerender with "No items found" | Empty content for crawlers |
| 6 | og-image.png doesn't exist (only SVG) — social sharing broken | No social previews |
| 7 | robots.txt blocks /onward-ticket — one of stickiest pages (8.7s) | High-value page invisible |
| 8 | 7 high-value pages in skipRoutes not prerendered | /safety, /medical, /90-day, etc. invisible |

---

## Phase 1: Fix the Foundation (Week 1) — BLOCKS EVERYTHING

- [ ] Fix SSG data fetching — replace `onMounted()` with SSR-compatible pattern in all detail + list views
- [ ] Fix sitemap 502 — debug function or generate static sitemap at build time
- [ ] Fix canonical/meta tags — ensure `usePageHead()` resolves during SSG
- [ ] Remove /onward-ticket from robots.txt
- [ ] Remove 7 pages from skipRoutes in fetch-routes.ts
- [ ] Create og-image.png (1200x630 PNG) from existing SVG
- [ ] Remove hardcoded hreflang tags (single-language site)

### Files to Change
- `src/views/AttractionDetailView.vue` — data fetching pattern
- `src/views/FestivalDetailView.vue` — data fetching pattern
- `src/views/HeritageDetailView.vue` — data fetching pattern
- `src/views/GuideDetailView.vue` — data fetching pattern
- `src/views/FestivalsView.vue` — list data fetching
- `src/views/HeritageView.vue` — list data fetching
- `src/views/GuidesView.vue` — list data fetching
- `src/views/AttractionsView.vue` — list data fetching
- `netlify/functions/sitemap.mts` — fix 502
- `scripts/fetch-routes.ts` — remove skipRoutes, add static sitemap generation
- `index.html` — fix og-image ref, remove hreflang
- `public/robots.txt` — unblock /onward-ticket

## Phase 2: Get Indexed (Week 2)

- [ ] Set up Google Search Console — verify via DNS TXT, submit sitemap
- [ ] Set up Bing Webmaster Tools
- [ ] Manually request indexing on top 20 pages
- [ ] Fix TDAC meta description (still references old "TM6")
- [ ] Add "2026" to festival page titles programmatically

## Phase 3: Optimize What Exists (Week 3-4)

- [ ] Optimize attraction title pattern: `[Name], [Province] — Visitor Guide 2026`
- [ ] Add FAQ schema to visa wizard, onward ticket, TDAC pages (featured snippets)
- [ ] Internal linking overhaul — "Nearby attractions" on detail pages
- [ ] Cross-link festivals to relevant attractions
- [ ] Add "Nearby" sections using province data from DB

## Phase 4: New Content That Ranks (Week 5-8)

- [ ] 5 Province Hub Pages — `/destinations/bangkok`, `/destinations/chiang-mai`, `/destinations/phuket`, `/destinations/krabi`, `/destinations/koh-samui` (10-50K searches/mo each)
- [ ] 5 Category Hubs — `/best/temples`, `/best/beaches`, `/best/islands`, `/best/markets`, `/best/parks`
- [ ] Standalone `/currency` page wrapping CurrencyCalculator (100K+ monthly searches for "Thai baht to USD")
- [ ] "Thailand vs Vietnam 2026" comparison guide (20K+ monthly, underserved)
- [ ] "DTV Visa Thailand 2026" dedicated guide (10-20K monthly)
- [ ] 12 Monthly Guides — "Thailand in January" through "Thailand in December" (5-10K each)

## Phase 5: Non-Spammy Distribution (Ongoing)

- [ ] Answer Reddit questions (r/ThailandTourism, r/digitalnomad, r/solotravel) — 30 min/week
- [ ] Directory submissions — Product Hunt, Indie Hackers, "Show HN", AI tool directories
- [ ] Wire up email delivery (Resend free tier) — exit-intent popup captures but sends nothing
- [ ] Travel blogger resource outreach — "I built a free visa wizard your readers might find useful"

---

## Keyword Opportunities

### Tier 1 — High Volume, Existing Content (fix & optimize)

| Keyword Cluster | Est. Monthly Searches | Page | Action |
|---|---|---|---|
| "Thailand visa requirements 2026" | 50-100K+ | `/visa` | Add year to title, optimize H1 |
| "TDAC Thailand" / "digital arrival card" | 20-40K | `/tdac` | Fix TM6 meta desc, add "2026" |
| "Thailand 90 day report" | 10-20K | `/90-day` | Prerender (in skipRoutes) |
| "Thailand onward ticket" | 10-20K | `/onward-ticket` | Unblock robots.txt + prerender |
| "Songkran 2026 dates" | 30-50K seasonal | `/festivals/songkran` | Add year to title |
| "Is Thailand safe 2026" | 20-40K | `/safety` | Prerender (in skipRoutes) |
| "Thailand packing list" | 5-10K | `/packing` | Prerender (in skipRoutes) |
| "Best time to visit Thailand" | 30-50K | `/guides/best-time-to-visit` | Optimize title |

### Tier 2 — Programmatic Long-Tail

| Pattern | Volume Per Query | Scale |
|---|---|---|
| "things to do in [city]" | 2-50K each | ~20 provinces (hub pages needed) |
| "best temples in [city]" | 1-5K each | ~15 cities (category hubs needed) |
| "[attraction name] Thailand" | 100-2K each | 1,081 existing pages (need title optimization) |
| "[festival] 2026 dates" | 500-5K each | 58 existing pages (need year in titles) |

### Tier 3 — Featured Snippet Targets

- "Do I need a visa for Thailand?" — visa wizard
- "How long can I stay in Thailand without a visa?" — 60 days
- "What is TDAC Thailand?" — definition
- "Do I need an onward ticket for Thailand?" — yes/no
- "When is Songkran 2026?" — April 13-15
- "How much does Thailand cost per day?" — budget table

---

## Content Gaps to Fill

| Content | Target Keyword | Volume | Competition | Effort |
|---|---|---|---|---|
| "Thailand vs Vietnam 2026" | "Thailand vs Vietnam" | 20K+ | Medium | 3 hrs |
| Province Hub Pages (5) | "things to do in [city]" | 10-50K each | High | 8 hrs |
| "DTV Visa Thailand 2026" | "DTV visa Thailand" | 10-20K | Medium | 2 hrs |
| "Best Islands in Thailand" | "best islands Thailand" | 15-25K | High | 3 hrs |
| Monthly Guides (12) | "Thailand in [month]" | 5-10K each | Medium | 6 hrs AI-assisted |
| Transport Routes (6) | "Bangkok to Chiang Mai" | 10-15K each | Medium | 4 hrs |
| "Bangkok vs Chiang Mai" | "Bangkok vs Chiang Mai" | 5-10K | Low | 2 hrs |
| Standalone /currency page | "Thai baht to USD" | 100K+ | Medium | 1 hr |

---

## What NOT to Do

- Don't post on social media — SEO compounds better, social decays in hours
- Don't build new features — product is ahead of distribution
- Don't create new content before fixing SSG — new pages will be equally invisible
- Don't buy ads — fix organic first

## The 80/20

| Action | Time | Unlocks |
|---|---|---|
| Fix SSG data fetching | 1-2 days | 1,200 pages become real HTML |
| Google Search Console + sitemap | 1 hour | Google discovers pages |
| Province hub pages | 1 day | Target highest-volume queries |
