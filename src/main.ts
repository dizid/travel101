import { ViteSSG } from 'vite-ssg'
import { createPinia } from 'pinia'
import App from './App.vue'
import routes from './router/routes'

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
  ({ app }) => {
    // Pinia store
    app.use(createPinia())
  },
)
