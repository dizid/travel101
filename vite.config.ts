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
    }
  }
}

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
            'vendor-ui': ['ant-design-vue', '@ant-design/icons-vue'],
          },
        }),
      },
    },
  },
  // vite-ssg options for static site generation
  ssgOptions: {
    script: 'async',
    formatting: 'minify',
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
      return allRoutes
    },
  },
}))
