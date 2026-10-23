// Writes every generated artefact. The only module in this package that
// touches the filesystem; never import it from index.ts.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { DOWNLOADS } from './keys.js'
import { generateKeylayout } from './macos/keylayout.js'
import { macModel } from './macos/model.js'
import { generateUzSymbols, generateEvdevXml } from './linux/xkb.js'
import { tarGz } from './linux/tar.js'

function write(path: string, content: string | Buffer): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)
}

export function writeArtefacts(repoRoot: string): void {
  const out = join(repoRoot, 'packages/layouts/out')
  const download = join(repoRoot, 'apps/web/public/download')

  const keylayout = generateKeylayout()
  write(join(out, 'macos', DOWNLOADS.mac), keylayout)
  write(join(out, 'macos/model.json'), JSON.stringify(macModel(), null, 2) + '\n')
  write(join(download, DOWNLOADS.mac), keylayout)

  const upstream = readFileSync(join(repoRoot, 'packages/layouts/src/linux/upstream/uz'), 'utf8')
  const xkb = [
    { path: 'xkb/symbols/uz', content: generateUzSymbols(upstream) },
    { path: 'xkb/rules/evdev.xml', content: generateEvdevXml() },
  ]
  for (const f of xkb) write(join(out, 'linux', f.path), f.content)
  write(join(download, DOWNLOADS.linux), tarGz(xkb))
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  // dist/cli.js → packages/layouts/dist → repo root is three levels up.
  writeArtefacts(resolve(dirname(fileURLToPath(import.meta.url)), '../../..'))
}
