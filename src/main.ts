import { ViteSSG } from 'vite-ssg'
import { createPinia } from 'pinia'
import App from './App.vue'
import routes from './router/routes'
import { SSG_STATE } from './lib/ssg-state'
import { reloadOnStaleChunks } from './lib/stale-chunk-reload'

// Fonts, served from our own domain (was Google Fonts: a render-blocking request to
// another server). Same families and weights as before; each file only downloads
// for the scripts on the page (unicode-range), so Thai/Sarabun loads only on Thai text.
import '@fontsource/inter/300.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/inter-tight/500.css'
import '@fontsource/inter-tight/600.css'
import '@fontsource/inter-tight/700.css'
import '@fontsource/prompt/600.css'
import '@fontsource/prompt/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/sarabun/300.css'
import '@fontsource/sarabun/400.css'
import '@fontsource/sarabun/500.css'
import '@fontsource/sarabun/600.css'

// Styles
import './styles/main.css'

// Ant Design Vue is NOT registered globally: only 3 views use it (a-select, a-slider,
// a-date-picker) and import it locally, so the home and other pages don't download it.

// Hydrate (reuse the prerendered HTML) instead of vite-ssg's default of throwing it away
// and rendering again, which draws the page twice and replays the hero animation ~2 s
// after the page first shows on phones. Only when:
// - this HTML was prerendered for this exact path (Netlify serves the home HTML as SPA
//   fallback for routes that aren't prerendered, e.g. /dashboard), and
// - the page's content is fixed at build time. Guides, attractions, festivals and heritage
//   pages fetch their data again in the browser, and the visa countdown page uses today's
//   date in its form, so their first client render can't match the prerendered HTML, and
// - the visitor has no saved profile/checklist/countdown in this browser (those change the
//   first render: personalised header, home and visa checklist).
// Everything else keeps rendering fresh, exactly as before.
// /guides still fetches its list in the browser. Detail pages (guide, attraction, festival,
// heritage) and the /attractions, /festivals and /heritage lists get their data from the
// prerender (src/lib/ssg-state.ts) and hydrate.
const NO_HYDRATION_ROUTES = /^\/(guides$|visa-countdown$)/
const PERSONAL_STORAGE_KEYS = ['user-profile', 'visa-checklist', 'happyroam_visa_countdown']

function shouldHydrate(): boolean {
  if (typeof document === 'undefined') return false
  const renderedFor = document.getElementById('app')?.dataset.ssgRoute
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  if (renderedFor !== path || NO_HYDRATION_ROUTES.test(path)) return false
  // Query strings can change the first render (e.g. /attractions?hidden=true filters the
  // list); only tracking tags are safe.
  const params = [...new URLSearchParams(window.location.search).keys()]
  if (params.some(key => !/^(utm_|fbclid$|gclid$|ref$)/.test(key))) return false
  try {
    return PERSONAL_STORAGE_KEYS.every(key => localStorage.getItem(key) === null)
  } catch {
    return false // storage blocked: render fresh, as before
  }
}

/** Resolves true once an element matching the URL hash exists (max ~1.5 s), false otherwise. */
function waitForHashTarget(hash: string, timeoutMs = 1500): Promise<boolean> {
  const exists = () => {
    try {
      return document.querySelector(hash) !== null
    } catch {
      return false // not a valid selector (e.g. '#/'): nothing to scroll to
    }
  }
  return new Promise(resolve => {
    const started = Date.now()
    const check = () => {
      if (exists()) return resolve(true)
      if (Date.now() - started >= timeoutMs) return resolve(false)
      setTimeout(check, 50)
    }
    check()
  })
}

export const createApp = ViteSSG(
  App,
  // Vue Router options
  {
    routes,
    scrollBehavior(to, _from, savedPosition) {
      if (savedPosition) {
        return savedPosition
      }
      if (to.hash) {
        // Lazy pages (e.g. the dashboard's #pro card behind every 'Go Pro' link) draw the target
        // after this runs; scrolling to a missing element did nothing and left the page where it
        // was (from the footer: still at the bottom). Wait for it briefly, else go to the top.
        return waitForHashTarget(to.hash).then(found =>
          // top: keep the target clear of the fixed header (~64 px)
          found ? { el: to.hash, top: 80, behavior: 'smooth' } : { top: 0 },
        )
      }
      return { top: 0, behavior: 'smooth' }
    },
  },
  // Custom setup function
  ({ app, router, initialState, isClient }) => {
    // Pinia store
    app.use(createPinia())
    // Per-page data the prerender hands to the browser (see src/lib/ssg-state.ts)
    app.provide(SSG_STATE, initialState)
    // Tabs still open from before a deploy: reload the target page instead of a dead tap
    if (isClient) reloadOnStaleChunks(router)
  },
  // See shouldHydrate() above
  { hydration: shouldHydrate() },
)
