// Builds the Chrome Web Store zip from dist/ and checks it before anyone uploads it.
//
// A zip committed on a branch freezes that branch's engine (review of 0092b76:
// it would have shipped "0.2.0" without the old-Latin speed fix). So the zip is
// built on main, here, and never committed:
//
//   pnpm --filter @alfavit/engine build && pnpm --filter @alfavit/extension pack:store
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'

const fail = (msg) => {
  console.error(`pack:store refused: ${msg}`)
  process.exit(1)
}

const manifest = JSON.parse(readFileSync('dist/manifest.json', 'utf8'))
const bundle = ['popup.js', 'background.js'].map((f) => readFileSync(`dist/${f}`, 'utf8')).join('\n')

if (!bundle.includes('foreign-word')) fail('the bundled engine predates 0.2.0 (no foreign-word flag). Build @alfavit/engine first.')
if (bundle.includes('lower.startsWith(from, i)'))
  fail('the bundled engine lacks the old-Latin speed fix (ad7de6e). Merge it into main, rebuild the engine, then pack again.')

mkdirSync('release', { recursive: true })
const out = resolve('release', `alfavit-extension-v${manifest.version}.zip`)
rmSync(out, { force: true })
execFileSync('zip', ['-qrX', out, '.', '-x', '.DS_Store', '*/.DS_Store'], { cwd: 'dist' })

const files = execFileSync('unzip', ['-Z1', out]).toString().split('\n').filter(Boolean)
if (!files.includes('manifest.json')) fail('manifest.json is not at the zip root')
// The manifest's name and description are __MSG_…__ lookups: Chrome rejects a zip without them.
for (const locale of readdirSync('public/_locales'))
  if (!files.includes(`_locales/${locale}/messages.json`)) fail(`_locales/${locale}/messages.json is not in the zip`)

const sha = createHash('sha256').update(readFileSync(out)).digest('hex')
console.log(`${out}\n  version ${manifest.version}, ${files.length} files\n  sha256 ${sha}`)
