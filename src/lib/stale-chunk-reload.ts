import type { Router } from 'vue-router'

// After a new deploy, the old hashed JS files are gone from the server. A visitor who
// already had HappyRoam open then asks for a page file that no longer exists (Netlify's
// SPA fallback answers with HTML), the import fails, and a tap on a link silently does
// nothing. Fix: load the target page fully once, which fetches the new HTML and files.
// A short guard stops a reload loop if a file is missing for another reason.

const RELOAD_KEY = 'happyroam:stale-chunk-reload-at'
const RELOAD_GUARD_MS = 10_000

// Error texts for a failed dynamic import: Chrome/Edge, Safari, Firefox; plus Vite's own
// message when a page's CSS can't be preloaded.
const CHUNK_ERROR_PATTERN =
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i

export function isChunkLoadError(error: unknown): boolean {
  const message = typeof error === 'string' ? error : (error as { message?: string } | null)?.message ?? ''
  return CHUNK_ERROR_PATTERN.test(message)
}

// Returns true when a reload was started, false when the guard stopped it.
export function reloadOnce(
  url: string,
  storage: Pick<Storage, 'getItem' | 'setItem'> = window.sessionStorage,
  now: number = Date.now(),
  navigate: (url: string) => void = (target) => window.location.assign(target),
): boolean {
  try {
    const lastReload = Number(storage.getItem(RELOAD_KEY) || 0)
    if (now - lastReload < RELOAD_GUARD_MS) return false
    storage.setItem(RELOAD_KEY, String(now))
  } catch {
    // sessionStorage can be blocked (strict privacy modes): reload anyway; the fresh HTML
    // then references files that exist, so this can't loop on a stale deploy.
  }
  navigate(url)
  return true
}

// Browser only: call from main.ts with the app's router.
export function reloadOnStaleChunks(router: Router): void {
  router.onError((error, to) => {
    if (isChunkLoadError(error)) reloadOnce(to?.fullPath || window.location.href)
  })
}
