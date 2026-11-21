import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import netlify from '@netlify/vite-plugin'
import { resolve } from 'path'

// Extend Vite config type for vite-ssg options
declare module 'vite' {
  interface UserConfig {
    ssgOptions?: {
      script?: 'async' | 'defer' | 'async defer'
      formatting?: 'minify' | 'prettify' | 'none'
      concurrency?: number
      includedRoutes?: (paths: string[]) => string[] | Promise<string[]>
      onPageRendered?: (route: string, renderedHTML: string) => string | Promise<string>
    }
  }
}

// Prerendered as dist/404.html: the page Netlify shows (status 404) for unknown paths
const NOT_FOUND_ROUTE = '/404'

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [vue(), netlify()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@composables': resolve(__dirname, 'src/composables'),
      '@stores': resolve(__dirname, 'src/stores'),
      '@views': resolve(__dirname, 'src/views'),
      '@types': resolve(__dirname, 'src/types'),
    },
  },
  server: {
    port: 3000,
    strictPort: false,
  },
  build: {
    rollupOptions: {
      output: {
        // manualChunks only for client build — SSR externalizes these
        ...(isSsrBuild ? {} : {
          manualChunks: {
            'vendor-vue': ['vue', 'vue-router', 'pinia'],
            // Icons only: ant-design-vue is left out so it lands in the chunks of the 3 views
            // that import it, instead of loading on every page (home was 243 KB heavier)
            'vendor-ui': ['@ant-design/icons-vue'],
          },
        }),
      },
    },
  },
  // vite-ssg options for static site generation
  ssgOptions: {
    script: 'async',
    // No HTML minifying: it strips Vue's comment markers and whitespace, which breaks hydration
    formatting: 'none',
    concurrency: 5,
    // Fetch all routes and pre-fetch content data for SSR rendering
    async includedRoutes(_paths: string[]) {
      const { prefetchSSGData } = await import('./scripts/prefetch-ssg-data')
      // Pre-fetch all content data from DB → .ssg-data/ JSON files
      // Also returns slugs so we don't need a second DB connection for routes
      const slugs = await prefetchSSGData()

      // Auth-only routes to skip during prerendering
      const skipRoutes = new Set(['/dashboard', '/profile', '/saved', '/alerts', '/smart-match'])

      // Static routes
      const staticRoutes = [
        '/', '/visa', '/tdac', '/warnings', '/attractions', '/heritage',
        '/festivals', '/guides', '/emergency', '/phrasebook', '/visa-countdown',
        '/about', '/people', '/privacy', '/terms', '/contact',
        '/onward-ticket', '/itinerary', '/packing', '/safety', '/90-day',
        '/medical', '/cost-calculator', '/setup-guide',
        '/ai-trip-planner-app-thailand',
      ]

      // Dynamic routes from pre-fetched data
      const dynamicRoutes = [
        ...slugs.attractionSlugs.map(s => `/attractions/${s}`),
        ...slugs.heritageSlugs.map(s => `/heritage/${s}`),
        ...slugs.festivalSlugs.map(s => `/festivals/${s}`),
        ...slugs.guideSlugs.map(s => `/guides/${s}`),
      ]

      const allRoutes = [...staticRoutes, ...dynamicRoutes].filter(r => !skipRoutes.has(r))
      console.log(`[vite-ssg] ${staticRoutes.length} static + ${dynamicRoutes.length} dynamic = ${allRoutes.length} total routes`)
      // NOT_FOUND_ROUTE matches the router's catch-all, so this writes dist/404.html with the
      // NotFoundView. Netlify serves that file with a real 404 status for every path that is
      // neither a prerendered page nor an app route in netlify.toml (T-0636, Nov 21 2026).
      return [...allRoutes, NOT_FOUND_ROUTE]
    },
    // Stamp each prerendered page with the route it was rendered for. src/main.ts only
    // hydrates when this matches the URL; Netlify's SPA fallback serves the home HTML for
    // routes that aren't prerendered (/dashboard, /profile, ...), and those must render fresh.
    // The 404 page is served for any unknown path, so it gets no canonical or og:url
    // (index.html's defaults name the home page) and is marked noindex.
    onPageRendered(route: string, renderedHTML: string) {
      const stamped = renderedHTML.replace(
        '<div id="app" data-server-rendered="true">',
        `<div id="app" data-server-rendered="true" data-ssg-route="${route.replace(/"/g, '&quot;')}">`,
      )
      if (route !== NOT_FOUND_ROUTE) return stamped
      return stamped
        .replace(/<link rel="canonical"[^>]*>\n?/g, '')
        .replace(/<meta property="og:url"[^>]*>\n?/g, '')
    },
  },
}))
