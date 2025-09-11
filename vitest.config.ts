import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/integration/test-setup.ts'],
    include: [
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'services/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      'node_modules/**/*',
      'dist/**/*',
      'build/**/*',
      'frontend/**/*'
    ],
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'services/**/*.{js,ts}',
        'tests/**/*.{js,ts}'
      ],
      exclude: [
        'services/**/*.test.{js,ts}',
        'services/**/*.spec.{js,ts}',
        'tests/**/*.test.{js,ts}',
        'tests/**/*.spec.{js,ts}',
        'services/**/node_modules/**',
        'services/**/dist/**',
        'services/**/build/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    reporters: [
      'verbose',
      'json',
      'html'
    ],
    outputFile: {
      json: './test-results/results.json',
      html: './test-results/results.html'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@services': path.resolve(__dirname, './services'),
      '@tests': path.resolve(__dirname, './tests')
    }
  }
});
