import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { pathToFileURL } from 'node:url'
import { expect, test } from 'vitest'

// Build-output assertions for the *published* package: `dist/` is consumed by
// plain Node ESM (`import { transliterate } from '@alfavit/engine'`), not only
// by the bundlers the monorepo happens to use. Node's ESM resolver has no
// extension search, so every relative specifier tsc emits must carry `.js`.
// Run via `pnpm --dir packages/engine test:dist` (builds first).

const distDir = join(__dirname, '..', '..', 'dist')

/** Every `.js` / `.d.ts` file in dist, recursively. */
function distFiles(dir = distDir): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return distFiles(full)
    return /\.(js|d\.ts)$/.test(entry.name) ? [full] : []
  })
}

test('dist/index.js imports under plain Node ESM and transliterates', () => {
  const entry = pathToFileURL(join(distDir, 'index.js')).href
  const stdout = execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `import { transliterate } from ${JSON.stringify(entry)}
       process.stdout.write(transliterate('салом дунё').text)`,
    ],
    { encoding: 'utf8' },
  )
  expect(stdout).toBe('salom dunyo')
})

test('no relative specifier in dist lacks a file extension', () => {
  // Covers the .d.ts re-exports too: consumers on TypeScript's node16/nodenext
  // resolution need the extension to resolve types, same as Node needs it for
  // runtime. A bare './transliterate' breaks both.
  const offenders = distFiles().flatMap((file) => {
    const source = readFileSync(file, 'utf8')
    return [...source.matchAll(/(?:from|import\s*\(?)\s*['"](\.\.?\/[^'"]*)['"]/g)]
      .filter(([, specifier]) => !/\.(js|json|mjs|cjs)$/.test(specifier))
      .map(([, specifier]) => `${relative(distDir, file)} → ${specifier}`)
  })
  expect(offenders).toEqual([])
})
