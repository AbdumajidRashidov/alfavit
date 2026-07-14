import { defineConfig } from 'vitest/config'

// Runs the build-output assertions (they readFileSync from dist/).
// Kept separate from the main config, whose `exclude` intentionally drops
// these from the fast `pnpm test` unit run.
export default defineConfig({
  test: {
    include: ['src/tests/seo-head.test.ts', 'src/tests/sitemap-build.test.ts', 'src/tests/faq-build.test.ts'],
  },
})
