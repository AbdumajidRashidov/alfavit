import type { Plugin, ResolvedConfig } from 'vite'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { generateSitemapXml } from './config'

// Writes <outDir>/sitemap.xml after the build bundle is emitted.
export function sitemapPlugin(): Plugin {
  let config: ResolvedConfig
  return {
    name: 'alfavit-sitemap',
    apply: 'build',
    configResolved(resolved) {
      config = resolved
    },
    closeBundle() {
      writeFileSync(resolve(config.root, config.build.outDir, 'sitemap.xml'), generateSitemapXml())
    },
  }
}
