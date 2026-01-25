import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import netlify from '@netlify/vite-plugin'
import { resolve } from 'path'

export default defineConfig({
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
        manualChunks: {
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          'vendor-ui': ['ant-design-vue', '@ant-design/icons-vue'],
        },
      },
    },
  },
})
