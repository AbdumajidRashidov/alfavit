import { expect, test } from 'vitest'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { generateKeylayout, MAC_LAYOUT_ID, MAC_STATE_INDEX, MAC_COMBOS } from '../macos/keylayout.js'

const xml = generateKeylayout()
const mapFor = (index: number) => xml.match(new RegExp(`<keyMap index="${index}">([\\s\\S]*?)</keyMap>`))![1]
const ref = (ch: string) => `&#x${ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')};`
const DTD = '/System/Library/DTDs/KeyboardLayout.dtd'

test('names the layout and gives it a negative id', () => {
  expect(xml).toContain('name="Özbek (yangi alifbo)"')
  expect(MAC_LAYOUT_ID).toBeLessThan(-1)
})

test('the Option map carries the five letters', () => {
  const option = mapFor(MAC_STATE_INDEX.option)
  for (const [code, ch] of [[31, 'ö'], [5, 'ğ'], [1, 'ş'], [8, 'ç']] as const)
    expect(option).toContain(`<key code="${code}" output="${ref(ch)}"/>`)
})

// Review Focus 5. U+2019 is allowed elsewhere: the U.S. layout keeps ’ on ⇧⌥].
test('the tutuq key types U+02BC in every Option state, and U+02BB appears nowhere', () => {
  for (const state of ['option', 'shiftOption', 'capsOption'] as const)
    expect(mapFor(MAC_STATE_INDEX[state])).toContain('<key code="39" output="&#x02BC;"/>')
  expect(xml).not.toContain('&#x02BB;')
})

test('ISO key code 10 appears in every keyMap', () => {
  const maps = [...xml.matchAll(/<keyMap index="\d+">([\s\S]*?)<\/keyMap>/g)]
  expect(maps).toHaveLength(Object.keys(MAC_STATE_INDEX).length)
  for (const m of maps) expect(m[1]).toContain('<key code="10" ')
})

// xmllint only speaks XML 1.0, which forbids the control-character references
// (Delete, Escape, arrows, Ctrl codes) that macOS's XML 1.1 parser accepts. So
// the structure is validated on a copy with those references blanked out.
test.skipIf(!existsSync(DTD))("validates against Apple's DTD", () => {
  const tmp = join(mkdtempSync(join(tmpdir(), 'keylayout-')), 'layout.keylayout')
  const xml10 = xml
    .replace('<?xml version="1.1"', '<?xml version="1.0"')
    .replace(/&#x00(0[0-8BCEF]|1[0-9A-F]);/g, '&#x0020;')
  writeFileSync(tmp, xml10)
  expect(() => execFileSync('xmllint', ['--noout', '--dtdvalid', DTD, tmp], { stdio: 'pipe' })).not.toThrow()
})

test('the committed file is what the generator produces', () => {
  expect(readFileSync(new URL('../../out/macos/Ozbek-yangi-alifbo.keylayout', import.meta.url), 'utf8')).toBe(xml)
})

// ⌥e then j types j + U+0301: two UTF-16 units. macOS truncates any output
// longer than maxout, so maxout must cover the longest one.
test('maxout covers the longest output', () => {
  const maxout = Number(xml.match(/maxout="(\d+)"/)![1])
  const outputs = [...xml.matchAll(/output="([^"]*)"/g)].map((m) => m[1].match(/&#x[0-9A-F]+;|./g)!.length)
  expect(maxout).toBeGreaterThanOrEqual(Math.max(...outputs))
  expect(maxout).toBeGreaterThanOrEqual(2)
})

// All 32 combinations of ⌘ ⇧ ⇪ ⌥ ⌃ are listed explicitly — no wildcards —
// each under exactly one keyMap, chosen as Apple's U.S. layout does.
test('every modifier combination selects exactly one keyMap, as on the U.S. layout', () => {
  expect(MAC_COMBOS.map((c) => c.bits).sort((a, b) => a - b)).toEqual([...Array(32).keys()])
  const listed = [...xml.matchAll(/<modifier keys="([^"]*)"\/>/g)].map((m) => m[1].split(' ').filter(Boolean).sort().join(' '))
  expect(listed).toHaveLength(32)
  expect(new Set(listed).size).toBe(32)
  const stateOf = (bits: number) => MAC_COMBOS.find((c) => c.bits === bits)!.state
  expect(stateOf(1 | 8)).toBe('commandOption')       // ⌘⌥
  expect(stateOf(1 | 2 | 8)).toBe('shiftOption')     // ⌘⇧⌥
  expect(stateOf(1 | 16)).toBe('control')            // ⌘⌃
  expect(stateOf(1 | 2)).toBe('command')             // ⌘⇧
})
