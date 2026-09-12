import type { Plugin, ResolvedConfig } from 'vite'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { generateSitemapXml } from './config'
import { generateLlmsTxt } from './llms'

// Writes <outDir>/sitemap.xml and <outDir>/llms.txt after the bundle is emitted.
// llms.txt is generated rather than served from public/ so its legal-status
// paragraph cannot drift from content/status.ts -- the signature drill found
// the static copy contradicting /status the moment STAGE moved.
export function sitemapPlugin(): Plugin {
  let config: ResolvedConfig
  return {
    name: 'alfavit-sitemap-and-llms',
    apply: 'build',
    configResolved(resolved) {
      config = resolved
    },
    closeBundle() {
      const out = (name: string) => resolve(config.root, config.build.outDir, name)
      writeFileSync(out('sitemap.xml'), generateSitemapXml())
      writeFileSync(out('llms.txt'), generateLlmsTxt())
    },
  }
}
