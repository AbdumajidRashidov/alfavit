import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { version } from '../index'

test('exports a version string', () => {
  expect(typeof version).toBe('string')
})

// `version` is public API: it is re-exported from dist/index.js, so an npm
// consumer reading it reports which engine it thinks it is running. A stale
// constant misreports the released package. package.json is read here rather
// than imported so the published output is untouched — tsconfig excludes
// `**/*.test.ts`, and `resolveJsonModule` stays off.
test('exported version matches package.json', () => {
  const pkg = JSON.parse(
    readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf8'),
  ) as { version: string }
  expect(version).toBe(pkg.version)
})
