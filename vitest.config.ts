import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: [
      'src/**/*.{test,spec}.ts',
      'netlify/functions/**/*.{test,spec}.ts',
    ],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/composables/**/*.ts',
        'src/stores/**/*.ts',
        'src/utils/**/*.ts',
        'netlify/functions/**/*.mts',
        'netlify/functions/lib/**/*.mts',
      ],
      exclude: [
        'src/**/*.d.ts',
        'src/test/**/*',
        '**/*.test.ts',
        '**/*.spec.ts',
        'netlify/functions/__tests__/**/*',
        'netlify/functions/__mocks__/**/*',
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
    mockReset: true,
    restoreMocks: true,
    testTimeout: 10000,
  },
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
})
