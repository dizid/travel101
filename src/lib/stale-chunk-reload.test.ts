import { describe, expect, it, vi } from 'vitest'
import { isChunkLoadError, reloadOnce } from './stale-chunk-reload'

function memoryStorage() {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  }
}

describe('isChunkLoadError', () => {
  it('recognises the Chrome, Safari, Firefox and Vite CSS messages', () => {
    expect(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module: https://x/assets/A-1.js'))).toBe(true)
    expect(isChunkLoadError(new TypeError('Importing a module script failed.'))).toBe(true)
    expect(isChunkLoadError(new TypeError('error loading dynamically imported module: https://x/assets/A-1.js'))).toBe(true)
    expect(isChunkLoadError(new Error('Unable to preload CSS for /assets/A-1.css'))).toBe(true)
  })

  it('ignores other errors', () => {
    expect(isChunkLoadError(new Error('Network request failed'))).toBe(false)
    expect(isChunkLoadError(undefined)).toBe(false)
    expect(isChunkLoadError(null)).toBe(false)
  })
})

describe('reloadOnce', () => {
  it('navigates once, then the guard blocks a second reload within 10 s', () => {
    const storage = memoryStorage()
    const navigate = vi.fn()
    expect(reloadOnce('/visa', storage, 1_000_000, navigate)).toBe(true)
    expect(reloadOnce('/visa', storage, 1_005_000, navigate)).toBe(false)
    expect(navigate).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith('/visa')
  })

  it('allows a new reload after the guard window', () => {
    const storage = memoryStorage()
    const navigate = vi.fn()
    reloadOnce('/a', storage, 1_000_000, navigate)
    expect(reloadOnce('/b', storage, 1_011_000, navigate)).toBe(true)
    expect(navigate).toHaveBeenCalledTimes(2)
  })

  it('still reloads when storage is blocked', () => {
    const blocked = {
      getItem: () => { throw new Error('blocked') },
      setItem: () => { throw new Error('blocked') },
    }
    const navigate = vi.fn()
    expect(reloadOnce('/visa', blocked, 1_000_000, navigate)).toBe(true)
    expect(navigate).toHaveBeenCalledOnce()
  })
})
