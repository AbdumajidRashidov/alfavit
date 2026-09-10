import { configDefaults, defineConfig } from 'vitest/config'
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    // Build-output assertions need a fresh dist/; they run via `test:dist`.
    exclude: [...configDefaults.exclude, 'src/tests/node-esm-build.test.ts'],
  },
})
