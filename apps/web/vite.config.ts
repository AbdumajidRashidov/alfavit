import { defineConfig, configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { sitemapPlugin } from './src/seo/sitemapPlugin'

export default defineConfig({
  plugins: [react(), sitemapPlugin()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: [...configDefaults.exclude, 'src/tests/seo-head.test.ts', 'src/tests/sitemap-build.test.ts'],
  },
})
