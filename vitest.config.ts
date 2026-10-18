import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.spec.ts'],
    environment: 'node',
    pool: 'forks',
    // Removes the audio-export temp directories this run created: vitest
    // terminates its fork workers without running their own exit handlers.
    globalSetup: ['./tests/global-setup.ts'],
  },
})
