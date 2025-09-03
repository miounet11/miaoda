import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup-main.ts'],
    include: [
      'src/main/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}',
    ],
    exclude: [
      'node_modules',
      'dist',
      'out',
      'src/renderer/**/*',
      'src/preload/**/*'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/main/**/*.ts'],
      exclude: [
        'src/main/**/*.d.ts',
        'src/main/**/*.test.ts',
        'src/main/**/*.spec.ts',
        'src/main/index.ts'
      ]
    },
    testTimeout: 15000,
    hookTimeout: 15000
  },
  resolve: {
    alias: {
      '@main': resolve(__dirname, 'src/main'),
      '@shared': resolve(__dirname, 'src/shared'),
      '@test': resolve(__dirname, 'src/test')
    }
  },
  esbuild: {
    target: 'node18'
  }
})