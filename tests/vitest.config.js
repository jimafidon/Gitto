import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./setup.js'],
    testTimeout: 15000,
    env: {
      NODE_ENV: 'test',
    },
  },
})
