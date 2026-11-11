import { describe, it, expect } from 'vitest'
import { toolIntros, type IntroSegment } from './toolPageIntros'

const segmentText = (segment: IntroSegment) => (typeof segment === 'string' ? segment : segment.text)

describe('toolPageIntros', () => {
  const entries = Object.entries(toolIntros)

  it('covers the six tool pages', () => {
    expect(Object.keys(toolIntros).sort()).toEqual(
      ['costCalculator', 'ninetyDay', 'packing', 'safety', 'setupGuide', 'visa'],
    )
  })

  it.each(entries)('%s has a sensible length', (_key, intro) => {
    const words = intro.paragraphs.flat().map(segmentText).join(' ').split(/\s+/).length
    expect(words).toBeGreaterThan(60)
    expect(words).toBeLessThan(400)
  })

  it.each(entries)('%s links only to https sources or internal paths', (_key, intro) => {
    const links = intro.paragraphs.flat().filter((s): s is { text: string; href: string } => typeof s !== 'string')
    for (const { text, href } of links) {
      expect(text.length).toBeGreaterThan(0)
      expect(href.startsWith('https://') || href.startsWith('/')).toBe(true)
    }
  })

  it.each(entries)('%s is free of dated or personal text (hydration safety)', (_key, intro) => {
    expect(intro.paragraphs.length).toBeGreaterThan(0)
    expect(JSON.stringify(intro)).not.toMatch(/\{\{|Date\.now/)
  })
})
