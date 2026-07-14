import type { Plugin } from 'vite'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { generateSitemapXml } from './config'

// Writes dist/sitemap.xml after the build bundle is emitted.
export function sitemapPlugin(): Plugin {
  return {
    name: 'alfavit-sitemap',
    apply: 'build',
    closeBundle() {
      const out = process.cwd().endsWith('apps/web') ? 'dist/sitemap.xml' : 'apps/web/dist/sitemap.xml'
      writeFileSync(resolve(out), generateSitemapXml())
    },
  }
}
