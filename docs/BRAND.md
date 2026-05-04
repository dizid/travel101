# HappyRoam — Brand System v2

Phase 1 foundation. The live style guide at `/style` (Phase 3) will supersede this as the canonical reference.

---

## 1. Wordmark + Clear Space

**Wordmark**: "HappyRoam" set in **Prompt 700**, tracked at -0.5px. Paired with the HR monogram on the left.

**HR Monogram**: The H and R share optical geometry — the R's bowl counter uses the same gold fill as the background, giving a cut-through effect. The rounded square container uses `rx="14"` (14% of width) for a refined, not-too-bubbly feel.

**Files**:
- `/public/logo.svg` — full wordmark (320×64 viewBox)
- `/public/logo-mark.svg` — monogram only (64×64) — use for social avatars, app icons
- `/public/favicon.svg` — monogram in 32×32 for browser tabs
- `/public/logo.png` — rasterized wordmark for JSON-LD / schema.org

**Clear space rule**: Minimum clear space = 1× the monogram container height on all sides. Never place other elements inside this zone.

**What not to do**:
- Do not recolor the wordmark to white-on-dark by flipping fill — use the monogram alone on dark backgrounds
- Do not stretch, condense, or add drop shadows to the wordmark
- Do not use Poppins, Arial, or system-ui as a substitute for Prompt

---

## 2. Color Tokens

### Semantic Palette (use these in code)

| Token | Hex | Intent |
|-------|-----|--------|
| `brand` / `brand-500` | `#f59e0b` | Primary actions, CTAs, brand surfaces |
| `brand-deep` | `#b45309` | Depth: headings on light, hover states, emphasis |
| `ink` | `#1c1917` | Warm black — primary text, replaces `gray-900` |
| `ink-muted` | `#57534e` | Secondary text, captions, meta — replaces `gray-500/600` |
| `ink-faint` | `#a8a29e` | Placeholder text, disabled — replaces `gray-400` |
| `surface` | `#fffbf5` | Warm off-white page background |
| `surface-raised` | `#ffffff` | Cards sitting on warm background |
| `surface-sunk` | `#f5f0e8` | Recessed sections, alternate rows, input backgrounds |
| `accent-warm` / `accent-warm-500` | `#f97316` | Festivals, energy, urgency, highlights |
| `accent-cool` / `accent-cool-500` | `#14b8a6` | Weather, info, calm, success states |
| `accent-royal` / `accent-royal-600` | `#2563eb` | Premium/Pro features, trust signals |
| `edge` | `#e7e0d4` | Warm borders — replaces `gray-200` |
| `edge-strong` | `#c9bfb0` | Stronger dividers, active states |

### Underlying Thai Scale

Keep `thai-gold`, `thai-blue`, `thai-teal`, `thai-coral` for backward compatibility. New code uses semantic tokens.

### WCAG Contrast Ratios (key pairs)

| Text color | Background | Ratio | Level |
|------------|-----------|-------|-------|
| `ink` on `surface` | `#1c1917` / `#fffbf5` | 17.8:1 | AAA |
| `ink` on `surface-raised` | `#1c1917` / `#ffffff` | 18.1:1 | AAA |
| `ink-muted` on `surface` | `#57534e` / `#fffbf5` | 7.2:1 | AAA |
| white on `brand-500` | `#fff` / `#f59e0b` | 2.6:1 | Fails (decorative only) |
| `ink` on `brand-100` | `#1c1917` / `#fef3c7` | 14.8:1 | AAA |
| white on `brand-deep` | `#fff` / `#b45309` | 4.6:1 | AA |
| white on `accent-royal-600` | `#fff` / `#2563eb` | 5.9:1 | AA |

**Note**: Never put white text directly on `brand-500` gold — contrast fails. Use `brand-deep` (#b45309) or `accent-royal-600` for text on buttons with white labels.

The `.btn-thai` class uses white text on a gradient from `brand-500` to `brand-600` — acceptable for UI buttons (WCAG Large Text), but do not use `brand-500` alone for small white text.

---

## 3. Type System

### Font Stack

| Role | Family | Weights loaded | Use for |
|------|--------|---------------|---------|
| `font-display` | Prompt | 600, 700 | Hero display text, landing H1, editorial large type |
| `font-heading` | Inter Tight | 500, 600, 700 | Section headings, card titles, nav labels |
| `font-sans` | Inter | 400, 500, 600, 700 | Body copy, UI, form labels |
| `font-mono` | JetBrains Mono | 400, 500 | Data labels, code, coordinates, stats |
| `font-thai` | Sarabun | 400, 500 | Thai script text, phrase book |

### Type Scale

| Token | Size | Line-height | Letter-spacing | Use |
|-------|------|------------|----------------|-----|
| `text-display-2xl` | 96px | 0.95 | -0.03em | Landing hero only — single line |
| `text-display-xl` | 72px | 1.0 | -0.02em | Large editorial headings |
| `text-display-lg` | 56px | 1.05 | -0.01em | Section hero titles |
| `text-heading-xl` | 36px | 1.15 | -0.01em | Page headings, major section titles |
| `text-heading-lg` | 28px | 1.2 | -0.005em | Card headings, sub-section titles |
| `text-heading-md` | 22px | 1.3 | 0 | Small headings, sidebar titles |
| `text-body-lg` | 18px | 1.6 | 0 | Long-form guide body text |
| `text-body` | 16px | 1.55 | 0 | Standard body text |
| `text-body-sm` | 14px | 1.5 | 0 | Captions, meta, labels |

### Sample — Section heading with subtext

```html
<h2 class="font-heading text-heading-xl text-ink">
  Discover hidden Thailand
</h2>
<p class="text-body-lg text-ink-muted mt-3">
  400+ destinations matched to how you actually travel.
</p>
```

---

## 4. Radius Scale

| Token | Value | Use |
|-------|-------|-----|
| `rounded-sm` | 6px | Tight UI — badges, chips, tags |
| `rounded-md` | 12px | Inputs, small buttons, tooltips |
| `rounded-lg` | 20px | Cards (new standard — was `rounded-thai` 16px) |
| `rounded-xl` | 28px | Modal sheets, large cards |
| `rounded-pill` | 999px | Pills, CTAs, floating actions |
| `rounded-thai` | 16px | Legacy — keep while migrating existing components |
| `rounded-thai-lg` | 24px | Legacy — keep while migrating |

---

## 5. Shadow Scale

| Token | Use |
|-------|-----|
| `shadow-xs` | Subtle depth — dropdown items, tooltip |
| `shadow-sm` | Resting card state |
| `shadow-md` | Raised interactive elements |
| `shadow-lg` | Modal, drawer |
| `shadow-glow-warm` | Brand highlight — featured cards, CTAs |
| `shadow-glow-cool` | Cool accent highlight — teal-toned features |
| `shadow-thai` | Legacy gold shadow — keep during migration |
| `shadow-soft` | Legacy neutral shadow |

---

## 6. Iconography

### Sticker Set (12 SVGs — replace emoji on primary surfaces)

Location: `src/assets/stickers/`

| File | Use instead of emoji |
|------|---------------------|
| `tuktuk.svg` | Instead of 🛺 in transport sections |
| `longtail-boat.svg` | Instead of ⛵ or 🚤 |
| `songthaew.svg` | Instead of 🚌 in regional transport |
| `motorbike.svg` | Instead of 🏍️ |
| `padthai.svg` | Instead of 🍜 in food sections |
| `mango-sticky-rice.svg` | Instead of 🍚 + 🥭 |
| `coconut.svg` | Instead of 🥥 |
| `durian.svg` | Instead of 🍈 (closest emoji) |
| `wat.svg` | Instead of ⛩️ or 🛕 in attraction headers |
| `lotus.svg` | Instead of 🌸 in Thai culture sections |
| `elephant.svg` | Instead of 🐘 |
| `monk-bowl.svg` | Instead of 🍵 in Buddhist context |

**Usage policy**: Import stickers as `<img>` or inline SVG in `src/components/ui/Sticker.vue`. Size at 24–48px for inline use, 80–160px for feature contexts. Do not use in notification toasts, badges, or loading states — emoji fallback is fine there.

**Style spec**: 2-color (brand gold + ink), thick 4–5px stroke, slightly irregular corners. Do not apply CSS `filter: invert()` — they are not icon-font glyphs.

---

## 7. Imagery Direction

**Approved treatment**:
- Warm (not orange-shifted) color grade — think early morning or late afternoon Thailand light
- Slightly reduced saturation vs "Instagram travel" aesthetic
- National Geographic editorial feel: real moments, minimal staging
- Shot on 35mm or medium format if possible — slight grain is fine, adds warmth

**Never use**:
- HDR processing
- Over-saturated "vibrance" edits
- Generic stock-photo smiles looking at camera
- Melting-architecture or AI-tell artifacts
- White-sky blown highlights

**Aspect ratios**:
- Hero: 3:2 (1200×800) or 16:9 (1920×1080)
- Cards: 16:10 or 4:3 — taller cards for portrait-first content
- OG image: 1200×630 (already generated)

**Placeholder images**: Until real photography lands, use the warm `#fde68a` → `#fbbf24` gradient as a placeholder background — it reads as "golden Thailand light" rather than generic gray.

---

## 8. Motion Language

### Timing

| Name | Duration | Easing | Use |
|------|----------|--------|-----|
| Fast | 150ms | `cubic-bezier(0.2, 0, 0, 1)` | Micro-interactions — hover state, toggle |
| Standard | 250ms | `cubic-bezier(0.2, 0, 0, 1)` | Card hover, button press, dropdown open |
| Editorial | 400–600ms | `cubic-bezier(0.4, 0, 0.2, 1)` | Page enter, hero reveal, stagger animations |

All three are available as CSS custom properties: `--duration-fast`, `--duration-base`, `--duration-slow`, `--duration-editorial`, `--ease-standard`, `--ease-editorial`.

### Hover lift

Cards and interactive elements should lift 2–4px on hover:
```css
/* Via utility class */
.hover-lift:hover { transform: translateY(-3px); }

/* Or inline in component */
transition: transform 250ms cubic-bezier(0.2, 0, 0, 1);
:hover { transform: translateY(-2px); }
```

### Stagger animations

For card grids entering the viewport, stagger by 80–100ms per item. Use `animation-delay` utilities (`.animate-delay-100`, `.animate-delay-200`, etc.) combined with `animate-fade-in` or `animate-slide-up`.

### Scroll-triggered

Reserve scroll-triggered reveals for editorial/long-form pages (guides, attraction detail). Keep homepage scroll fast and native. Never animate elements that are above the fold on mobile.

---

## 9. What's Next

**Phase 2**: Six view redesigns (HomeView, AttractionDetailView, GuideDetailView, SmartMatchView, AttractionsView, DashboardView) — visual layer only, no UX/flow changes. Each view gets its own hero type, card visual identity, and refined typography hierarchy using the tokens defined above.

**Phase 3**: `/style` route — live in-app style guide generated from real components. Color swatches rendered from token values, typography sampler, interactive component states, sticker gallery, motion demo. This page replaces `docs/BRAND.md` as the canonical visual reference once Phase 3 ships.

**Photography**: All placeholders in `/public/images/` should be filled with real photography matching the art direction in Section 7. See the full prompt set in the design plan for Midjourney/DALL-E prompts. Run `npm run optimize-images` after dropping any new JPGs — budget is ≤200KB per image.

**Ant Design removal** (Phase 2): The 4 `<a-select>` instances will be replaced with native selects using the new token classes during component redesign. No action needed in Phase 1.
