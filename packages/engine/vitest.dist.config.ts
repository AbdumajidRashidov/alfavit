import { defineConfig } from 'vitest/config'

// Runs the build-output assertions (they spawn Node against dist/).
// Kept separate from the main config, whose `exclude` intentionally drops
// these from the fast `pnpm test` unit run.
export default defineConfig({
  test: {
    include: ['src/tests/node-esm-build.test.ts'],
  },
})
