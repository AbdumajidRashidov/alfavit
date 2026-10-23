import { expect, test } from 'vitest'
import { readFileSync } from 'node:fs'
import { generateAlfavitVariant, generateUzSymbols, generateEvdevXml, linuxFiles } from '../linux/xkb.js'
import { tarGz } from '../linux/tar.js'

const upstream = readFileSync(new URL('../linux/upstream/uz', import.meta.url), 'utf8')

// Review Focus 5
test('the variant inherits us(basic) and uses U02BC', () => {
  const v = generateAlfavitVariant()
  expect(v).toContain('include "us(basic)"')
  expect(v).toContain('include "level3(ralt_switch)"')
  expect(v).toContain('key <AC11> { [ apostrophe, quotedbl, U02BC, U02BC ] };')
  expect(v).not.toMatch(/U02BB|rightsinglequotemark/)
})

test('the variant carries the four letters on the third and fourth levels', () => {
  const v = generateAlfavitVariant()
  expect(v).toContain('key <AD09> { [ o, O, odiaeresis, Odiaeresis ] };')
  expect(v).toContain('key <AC05> { [ g, G, gbreve, Gbreve ] };')
  expect(v).toContain('key <AC02> { [ s, S, scedilla, Scedilla ] };')
  expect(v).toContain('key <AB03> { [ c, C, ccedilla, Ccedilla ] };')
  expect(v).toContain('name[Group1]= "Uzbek (Alfavit, AltGr)";')
  expect(v).not.toMatch(/^default/m)
})

test('the full uz file keeps every upstream variant and adds alfavit once', () => {
  const out = generateUzSymbols(upstream)
  expect(out.startsWith(upstream)).toBe(true)
  expect(out.match(/xkb_symbols "alfavit"/g)).toHaveLength(1)
  expect(out).toContain('xkb_symbols "latin"')
  expect(out).toContain('xkb_symbols "cyrillic"')
})

test('the registry adds the variant under uz', () => {
  const xml = generateEvdevXml()
  expect(xml).toMatch(/<name>uz<\/name>[\s\S]*<variant>[\s\S]*<name>alfavit<\/name>[\s\S]*<description>Uzbek \(Alfavit, AltGr\)<\/description>/)
})

test('the tarball is byte-identical across runs', () => {
  const files = [{ path: 'xkb/symbols/uz', content: 'a' }, { path: 'xkb/rules/evdev.xml', content: 'b' }]
  expect(tarGz(files).equals(tarGz(files))).toBe(true)
})

// MIT/X11 terms: the notice travels with the copied symbols/uz.
test('the drop-in carries the xkeyboard-config licence next to the copied file', () => {
  const copying = readFileSync(new URL('../linux/upstream/COPYING', import.meta.url), 'utf8')
  expect(copying).toContain('Permission to use, copy, modify, distribute, and sell this software')
  const files = linuxFiles(upstream, copying)
  expect(files.map((f) => f.path)).toEqual(['xkb/symbols/uz', 'xkb/rules/evdev.xml', 'xkb/COPYING.xkeyboard-config'])
  expect(files[2].content).toBe(copying)
  expect(files[0].content).toContain('COPYING.xkeyboard-config')
})
