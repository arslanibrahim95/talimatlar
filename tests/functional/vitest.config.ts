import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test-setup.ts'],
    include: [
      '**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      'node_modules/**/*',
      'dist/**/*',
      'build/**/*'
    ],
    testTimeout: 60000, // 60 seconds for functional tests
    hookTimeout: 60000,
    teardownTimeout: 60000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        '**/*.{js,ts}'
      ],
      exclude: [
        '**/*.test.{js,ts}',
        '**/*.spec.{js,ts}',
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
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
    },
    retry: 2,
    bail: 0
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@tests': path.resolve(__dirname, './'),
      '@services': path.resolve(__dirname, '../../services')
    }
  }
});
