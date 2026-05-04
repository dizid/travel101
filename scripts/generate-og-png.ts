/**
 * generate-og-png.ts
 *
 * Converts brand SVG assets to PNG using sharp.
 * Produces:
 *   - public/og-image.png     (1200×630 — social share OG image)
 *   - public/logo.png         (512×120 — JSON-LD / schema.org logo)
 *   - public/icon-192.png     (192×192 — PWA icon)
 *   - public/icon-512.png     (512×512 — PWA icon splash)
 *
 * Usage:
 *   npm run generate-og
 *
 * Requires: sharp (npm install -D sharp)
 *   sharp handles SVG rasterization via librsvg — system fonts in SVG
 *   <text> elements will fall back to generic serif/sans. For pixel-perfect
 *   Prompt font rendering, export from Figma or use a headless Chrome renderer.
 *   For social OG purposes this output is production-ready.
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const PUBLIC = resolve(ROOT, 'public')

async function main() {
  // Dynamically import sharp to give a clear error if not installed
  let sharp: typeof import('sharp')
  try {
    sharp = (await import('sharp')).default as unknown as typeof import('sharp')
  } catch {
    console.error(
      '\nsharp is not installed. Run: npm install -D sharp\n' +
      'Then re-run: npm run generate-og\n'
    )
    process.exit(1)
  }

  console.log('Generating PNG assets from SVG sources...\n')

  // ── OG image: 1200×630 ───────────────────────────────────────────────
  const ogSvg = readFileSync(resolve(PUBLIC, 'og-image.svg'))
  await (sharp as any)(ogSvg)
    .resize(1200, 630)
    .png({ quality: 90, compressionLevel: 9 })
    .toFile(resolve(PUBLIC, 'og-image.png'))
  console.log('✓  public/og-image.png  (1200×630)')

  // ── Logo PNG: 512×120 for JSON-LD (schema.org recommends landscape PNG) ──
  const logoSvg = readFileSync(resolve(PUBLIC, 'logo.svg'))
  await (sharp as any)(logoSvg)
    .resize(512, null)   // preserve aspect ratio from 320×64 viewBox
    .png({ quality: 90, compressionLevel: 9 })
    .toFile(resolve(PUBLIC, 'logo.png'))
  console.log('✓  public/logo.png      (512×auto)')

  // ── PWA icon 192×192 — from logo-mark ────────────────────────────────
  const markSvg = readFileSync(resolve(PUBLIC, 'logo-mark.svg'))
  await (sharp as any)(markSvg)
    .resize(192, 192)
    .png({ quality: 90, compressionLevel: 9 })
    .toFile(resolve(PUBLIC, 'icon-192.png'))
  console.log('✓  public/icon-192.png  (192×192)')

  // ── PWA icon 512×512 ─────────────────────────────────────────────────
  await (sharp as any)(markSvg)
    .resize(512, 512)
    .png({ quality: 90, compressionLevel: 9 })
    .toFile(resolve(PUBLIC, 'icon-512.png'))
  console.log('✓  public/icon-512.png  (512×512)')

  console.log('\nAll assets generated. Verify visually before deploying.')
  console.log('Note: SVG <text> elements render with system fonts.')
  console.log('For pixel-perfect Prompt typeface, export from Figma.')
}

main().catch((err) => {
  console.error('Error generating PNG assets:', err)
  process.exit(1)
})
