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
    // Fetch all routes including dynamic slugs from DB
    async includedRoutes(_paths: string[]) {
      // Dynamic import to avoid bundling DB client into the frontend
      const { getAllRoutes } = await import('./scripts/fetch-routes')
      return getAllRoutes()
    },
  },
}))
