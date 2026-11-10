import { ViteSSG } from 'vite-ssg'
import { createPinia } from 'pinia'
import App from './App.vue'
import routes from './router/routes'
import { SSG_STATE } from './lib/ssg-state'

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
// List pages still fetch their data in the browser. Detail pages (guide, attraction,
// festival, heritage) get their data from the prerender (src/lib/ssg-state.ts) and hydrate.
const NO_HYDRATION_ROUTES = /^\/((guides|attractions|festivals|heritage)$|visa-countdown$)/
const PERSONAL_STORAGE_KEYS = ['user-profile', 'visa-checklist', 'happyroam_visa_countdown']

function shouldHydrate(): boolean {
  if (typeof document === 'undefined') return false
  const renderedFor = document.getElementById('app')?.dataset.ssgRoute
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  if (renderedFor !== path || NO_HYDRATION_ROUTES.test(path)) return false
  try {
    return PERSONAL_STORAGE_KEYS.every(key => localStorage.getItem(key) === null)
  } catch {
    return false // storage blocked: render fresh, as before
  }
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
        return { el: to.hash, behavior: 'smooth' }
      }
      return { top: 0, behavior: 'smooth' }
    },
  },
  // Custom setup function
  ({ app, initialState }) => {
    // Pinia store
    app.use(createPinia())
    // Per-page data the prerender hands to the browser (see src/lib/ssg-state.ts)
    app.provide(SSG_STATE, initialState)
  },
  // See shouldHydrate() above
  { hydration: shouldHydrate() },
)
