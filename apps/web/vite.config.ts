import { defineConfig, configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { sitemapPlugin } from './src/seo/sitemapPlugin'
import { statusFreshnessPlugin } from './src/seo/statusFreshnessPlugin'

export default defineConfig({
  plugins: [react(), sitemapPlugin(), statusFreshnessPlugin()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: [...configDefaults.exclude, 'src/tests/seo-head.test.ts', 'src/tests/sitemap-build.test.ts', 'src/tests/reform-build.test.ts', 'src/tests/guides-build.test.ts'],
  },
})
