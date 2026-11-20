import { describe, it, expect } from 'vitest'
import { DUPLICATE_PAGE_CANONICALS, canonicalPathFor, isDuplicatePage } from './duplicatePages'

const PATH = /^\/(attractions|heritage|festivals|guides)\/[a-z0-9-]+$/

describe('duplicate page map (T-0636)', () => {
  const entries = Object.entries(DUPLICATE_PAGE_CANONICALS)

  it('only holds well-formed site paths (no domain, no trailing slash)', () => {
    expect(entries.length).toBeGreaterThan(0)
    for (const [copy, main] of entries) {
      expect(copy, copy).toMatch(PATH)
      expect(main, main).toMatch(PATH)
    }
  })

  it('never points a page at itself or at another copy (no chains)', () => {
    for (const [copy, main] of entries) {
      expect(main, copy).not.toBe(copy)
      expect(isDuplicatePage(main), `${main} is itself a copy`).toBe(false)
    }
  })

  it('maps a copy to its main page and leaves other pages alone', () => {
    expect(canonicalPathFor('/attractions/phuket-attraction')).toBe('/attractions/phuket')
    expect(canonicalPathFor('/attractions/grand-palace-attraction')).toBe('/heritage/grand-palace-bangkok')
    expect(canonicalPathFor('/attractions/phuket')).toBe('/attractions/phuket')
    expect(canonicalPathFor('/about')).toBe('/about')
    expect(isDuplicatePage('/attractions/phuket-attraction')).toBe(true)
    expect(isDuplicatePage('/attractions/phuket')).toBe(false)
    // Object prototype keys are not pages
    expect(isDuplicatePage('constructor')).toBe(false)
    expect(canonicalPathFor('toString')).toBe('toString')
  })
})
