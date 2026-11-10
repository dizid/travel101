/**
 * Hand data from the prerender to the browser, so a prerendered page doesn't fetch
 * (and briefly lose) the content it already shows.
 *
 * vite-ssg serialises its per-page `initialState` object into the HTML
 * (window.__INITIAL_STATE__) after rendering, and gives it back to the client app.
 * src/main.ts provides that object to every component under SSG_STATE.
 *
 * In a view's setup:
 *   const ssg = useSSGState()
 *   const initial = ssg.take<Guide>(`guide:${slug}`)  // browser: the prerendered data, once
 *   ...after loading on the server: ssg.put(`guide:${slug}`, data)
 */
import { inject, type InjectionKey } from 'vue'

export const SSG_STATE: InjectionKey<Record<string, unknown>> = Symbol('ssg-state')

export function useSSGState() {
  // Must be called during setup (inject), not inside async callbacks
  const state = inject(SSG_STATE, null)

  return {
    /** Prerender only: store data for this page so the browser can reuse it. */
    put(key: string, value: unknown): void {
      if (import.meta.env.SSR && state) state[key] = value
    },

    /**
     * Browser only: the data the prerender stored under this key, or undefined.
     * Each key is handed out once, so later client-side navigations fetch fresh data.
     */
    take<T>(key: string): T | undefined {
      if (import.meta.env.SSR || !state || !(key in state)) return undefined
      const value = state[key] as T
      delete state[key]
      return value
    },
  }
}
