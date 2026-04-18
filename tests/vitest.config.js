import { defineConfig } from 'vitest/config'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      mongoose: path.resolve(__dirname, '../backend/node_modules/mongoose'),
    },
  },
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
