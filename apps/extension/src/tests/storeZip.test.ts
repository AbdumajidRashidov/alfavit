import { execFileSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from 'vitest'

// Review of 0092b76: a zip built on a branch froze the engine of that branch,
// so the store would get a "0.2.0" without the old-Latin speed fix. Store zips
// are now built on main by `pack:store`, which refuses a pre-fix engine; this
// guards against committing a stale one again.
const STORE_DIR = resolve(__dirname, '../../../../docs/chrome-web-store')

test('no committed store zip bundles the engine from before the old-Latin speed fix', () => {
  for (const name of readdirSync(STORE_DIR).filter((n) => n.endsWith('.zip'))) {
    const js = execFileSync('unzip', ['-p', resolve(STORE_DIR, name), 'popup.js', 'background.js']).toString()
    expect(js, name).not.toContain('lower.startsWith(from, i)')
  }
})
