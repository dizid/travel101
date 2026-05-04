/**
 * optimize-images.ts
 *
 * Sharp-based pipeline that optimizes images in /public/images/ to ≤200KB.
 * Converts JPGs to progressive JPEG with quality tuning.
 * Converts PNGs to optimized PNG.
 * Skips files already under the size budget.
 *
 * Usage:
 *   npm run optimize-images
 *
 * Requires: sharp (npm install -D sharp)
 */

import { readdirSync, statSync, mkdirSync, copyFileSync } from 'fs'
import { resolve, extname, basename, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT      = resolve(__dirname, '..')
const INPUT_DIR = resolve(ROOT, 'public', 'images')

const SIZE_BUDGET_BYTES = 200 * 1024  // 200 KB
const JPEG_QUALITY_START = 85
const JPEG_QUALITY_MIN   = 55

interface OptResult {
  file: string
  originalKB: number
  finalKB: number
  skipped: boolean
}

async function main() {
  let sharp: typeof import('sharp')
  try {
    sharp = (await import('sharp')).default as unknown as typeof import('sharp')
  } catch {
    console.error(
      '\nsharp is not installed. Run: npm install -D sharp\n' +
      'Then re-run: npm run optimize-images\n'
    )
    process.exit(1)
  }

  // Ensure the images directory exists
  try { mkdirSync(INPUT_DIR, { recursive: true }) } catch {}

  const results: OptResult[] = []
  const files = collectImageFiles(INPUT_DIR)

  if (files.length === 0) {
    console.log(`No image files found in ${INPUT_DIR}`)
    console.log('Drop JPG/PNG files into public/images/ (and subdirectories) and re-run.\n')
    return
  }

  console.log(`Processing ${files.length} image(s) in ${INPUT_DIR}...\n`)

  for (const filePath of files) {
    const stat = statSync(filePath)
    const originalKB = stat.size / 1024
    const ext = extname(filePath).toLowerCase()
    const rel = filePath.replace(INPUT_DIR, '')

    if (stat.size <= SIZE_BUDGET_BYTES) {
      results.push({ file: rel, originalKB, finalKB: originalKB, skipped: true })
      continue
    }

    // Optimize in-place — sharp writes to a temp path then we overwrite
    const tmpPath = filePath + '.tmp'

    try {
      if (ext === '.jpg' || ext === '.jpeg') {
        // Try reducing quality in steps until we're under budget
        let quality = JPEG_QUALITY_START
        let success = false

        while (quality >= JPEG_QUALITY_MIN) {
          await (sharp as any)(filePath)
            .jpeg({ quality, progressive: true, mozjpeg: true })
            .toFile(tmpPath)

          const newSize = statSync(tmpPath).size
          if (newSize <= SIZE_BUDGET_BYTES) {
            success = true
            break
          }
          quality -= 5
        }

        if (!success) {
          // Use minimum quality as last resort
          await (sharp as any)(filePath)
            .jpeg({ quality: JPEG_QUALITY_MIN, progressive: true, mozjpeg: true })
            .toFile(tmpPath)
        }

      } else if (ext === '.png') {
        await (sharp as any)(filePath)
          .png({ quality: 85, compressionLevel: 9, progressive: true })
          .toFile(tmpPath)
      } else {
        // Unsupported format — skip
        results.push({ file: rel, originalKB, finalKB: originalKB, skipped: true })
        continue
      }

      // Overwrite original with optimized version
      const finalStat = statSync(tmpPath)
      copyFileSync(tmpPath, filePath)
      // Cleanup temp file
      try { require('fs').unlinkSync(tmpPath) } catch {}

      results.push({ file: rel, originalKB, finalKB: finalStat.size / 1024, skipped: false })

    } catch (err) {
      console.warn(`  WARN: Failed to process ${rel}:`, err)
      try { require('fs').unlinkSync(tmpPath) } catch {}
      results.push({ file: rel, originalKB, finalKB: originalKB, skipped: true })
    }
  }

  // Report
  console.log('Result:')
  for (const r of results) {
    if (r.skipped) {
      console.log(`  SKIP  ${r.file.padEnd(50)} ${r.originalKB.toFixed(0).padStart(6)} KB  (already ≤200KB)`)
    } else {
      const saving = ((r.originalKB - r.finalKB) / r.originalKB * 100).toFixed(0)
      const flag = r.finalKB > 200 ? ' ⚠ still over budget' : ''
      console.log(`  OPT   ${r.file.padEnd(50)} ${r.originalKB.toFixed(0).padStart(6)} → ${r.finalKB.toFixed(0)} KB  (-${saving}%)${flag}`)
    }
  }

  const overBudget = results.filter(r => !r.skipped && r.finalKB > 200)
  if (overBudget.length > 0) {
    console.warn('\nWarning: Some files remain over 200KB. Consider resizing dimensions before optimizing.')
  }

  console.log('\nDone.\n')
}

/**
 * Recursively collect all JPG and PNG files under a directory.
 */
function collectImageFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const full = resolve(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectImageFiles(full))
    } else if (entry.isFile()) {
      const ext = extname(entry.name).toLowerCase()
      if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
        files.push(full)
      }
    }
  }

  return files
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
