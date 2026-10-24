import { expect, test } from 'vitest'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DOWNLOADS, MAC_BUNDLE } from '../keys.js'
import { generateKeylayout } from '../macos/keylayout.js'
import { encodeIcns } from '../macos/icon.js'
import { generateInfoPlist, macBundleFiles, macBundleZip, MAC_INPUT_SOURCE_ID } from '../macos/bundle.js'
import { crc32 } from '../zip.js'

const plist = generateInfoPlist()
const layoutName = generateKeylayout().match(/<keyboard [^>]*name="([^"]+)"/)![1]

/** The plist as JSON, through Apple's own parser (macOS only). */
function plistJson(): Record<string, unknown> {
  const file = join(mkdtempSync(join(tmpdir(), 'plist-')), 'Info.plist')
  writeFileSync(file, plist)
  return JSON.parse(execFileSync('plutil', ['-convert', 'json', '-o', '-', file], { encoding: 'utf8' }))
}

/** Entries of a zip, read from its central directory. */
function readZip(zip: Buffer) {
  const end = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]))
  const count = zip.readUInt16LE(end + 10)
  const entries = []
  for (let at = zip.readUInt32LE(end + 16), i = 0; i < count; i++) {
    expect(zip.readUInt32LE(at)).toBe(0x02014b50)
    const nameLength = zip.readUInt16LE(at + 28), extraLength = zip.readUInt16LE(at + 30), commentLength = zip.readUInt16LE(at + 32)
    const local = zip.readUInt32LE(at + 42)
    const size = zip.readUInt32LE(at + 20)
    const dataAt = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28)
    entries.push({
      name: zip.toString('utf8', at + 46, at + 46 + nameLength),
      method: zip.readUInt16LE(at + 10),
      crc: zip.readUInt32LE(at + 16),
      mode: zip.readUInt32LE(at + 38) >>> 16,
      data: zip.subarray(dataAt, dataAt + size),
    })
    at += 46 + nameLength + extraLength + commentLength
  }
  return entries
}

// macOS looks the layout's settings up as "KLInfo_" + the name inside the
// .keylayout (HIToolbox, islPopulateKLPropertiesFromBundle).
test('Info.plist keys the layout settings by the name inside the .keylayout', () => {
  expect(layoutName).toBe('Özbek (yangi alifbo)')
  expect(plist).toContain(`<key>KLInfo_${layoutName}</key>`)
})

test('Info.plist sets the input source id, Uzbek Latin, and a template icon', () => {
  expect(MAC_INPUT_SOURCE_ID).toBe('uz.alfavit.keylayout.Ozbek-yangi-alifbo')
  const klinfo = plist.slice(plist.indexOf(`<key>KLInfo_${layoutName}</key>`))
  expect(klinfo).toMatch(/<key>TISInputSourceID<\/key>\s*<string>uz\.alfavit\.keylayout\.Ozbek-yangi-alifbo<\/string>/)
  expect(klinfo).toMatch(/<key>TISIntendedLanguage<\/key>\s*<string>uz-Latn<\/string>/)
  expect(klinfo).toMatch(/<key>TISIconIsTemplate<\/key>\s*<true\/>/)
  expect(plist).toMatch(/<key>CFBundleIdentifier<\/key>\s*<string>uz\.alfavit\.keyboardlayout\.Ozbek-yangi-alifbo<\/string>/)
})

test.skipIf(!existsSync('/usr/bin/plutil'))('Info.plist parses with plutil into exactly the expected keys', () => {
  expect(plistJson()).toEqual({
    CFBundleIdentifier: 'uz.alfavit.keyboardlayout.Ozbek-yangi-alifbo',
    CFBundleName: 'Özbek (yangi alifbo)',
    CFBundlePackageType: 'BNDL',
    CFBundleShortVersionString: '1.0',
    CFBundleVersion: '1',
    [`KLInfo_${layoutName}`]: {
      TISInputSourceID: 'uz.alfavit.keylayout.Ozbek-yangi-alifbo',
      TISIntendedLanguage: 'uz-Latn',
      TISIconIsTemplate: true,
    },
  })
})

test('the bundle holds the plist, the unchanged layout, and an icon named after it', () => {
  const files = macBundleFiles()
  expect(files.map((f) => f.path)).toEqual([
    'Ozbek-yangi-alifbo.bundle/Contents/Info.plist',
    'Ozbek-yangi-alifbo.bundle/Contents/Resources/Ozbek-yangi-alifbo.icns',
    'Ozbek-yangi-alifbo.bundle/Contents/Resources/Ozbek-yangi-alifbo.keylayout',
  ])
  expect(files[0].content.toString()).toBe(plist)
  expect(Buffer.from(files[1].content).equals(encodeIcns())).toBe(true)
  expect(files[2].content.toString()).toBe(generateKeylayout())
})

test('the zip holds the bundle at its root, and nothing else', () => {
  const entries = readZip(macBundleZip())
  expect(entries.map((e) => e.name)).toEqual([
    'Ozbek-yangi-alifbo.bundle/',
    'Ozbek-yangi-alifbo.bundle/Contents/',
    'Ozbek-yangi-alifbo.bundle/Contents/Info.plist',
    'Ozbek-yangi-alifbo.bundle/Contents/Resources/',
    'Ozbek-yangi-alifbo.bundle/Contents/Resources/Ozbek-yangi-alifbo.icns',
    'Ozbek-yangi-alifbo.bundle/Contents/Resources/Ozbek-yangi-alifbo.keylayout',
  ])
  expect(MAC_BUNDLE).toBe('Ozbek-yangi-alifbo.bundle')
  for (const f of macBundleFiles()) {
    const entry = entries.find((e) => e.name === f.path)!
    expect(entry.data.equals(Buffer.from(f.content)), f.path).toBe(true)
    expect(entry.crc, f.path).toBe(crc32(Buffer.from(f.content)))
  }
  // Stored, with Unix modes, so every unzipper restores folders and files alike.
  for (const e of entries) {
    expect(e.method).toBe(0)
    expect(e.mode).toBe(e.name.endsWith('/') ? 0o40755 : 0o100644)
  }
})

test('crc32 matches the standard check value', () => {
  expect(crc32(Buffer.from('123456789'))).toBe(0xcbf43926)
})

test('the zip is byte-identical across runs', () => {
  expect(macBundleZip().equals(macBundleZip())).toBe(true)
})

test('the committed download and bundle are what the generator produces', () => {
  const download = new URL(`../../../../apps/web/public/download/${DOWNLOADS.mac}`, import.meta.url)
  expect(DOWNLOADS.mac).toBe('Ozbek-yangi-alifbo.zip')
  expect(readFileSync(download).equals(macBundleZip())).toBe(true)
  for (const f of macBundleFiles())
    expect(readFileSync(new URL(`../../out/macos/${f.path}`, import.meta.url)).equals(Buffer.from(f.content)), f.path).toBe(true)
})

// The old single-file URL keeps working: it serves the same layout, without the icon.
test('the bare .keylayout download is still generated, identical to the one in the bundle', () => {
  expect(DOWNLOADS.macKeylayout).toBe('Ozbek-yangi-alifbo.keylayout')
  const legacy = new URL(`../../../../apps/web/public/download/${DOWNLOADS.macKeylayout}`, import.meta.url)
  expect(readFileSync(legacy, 'utf8')).toBe(generateKeylayout())
})

// ditto is what Archive Utility and Safari's auto-unzip use.
test.skipIf(!existsSync('/usr/bin/ditto'))('ditto unpacks the bundle with its files and modes', () => {
  const dir = mkdtempSync(join(tmpdir(), 'zip-'))
  writeFileSync(join(dir, 'a.zip'), macBundleZip())
  execFileSync('ditto', ['-x', '-k', join(dir, 'a.zip'), join(dir, 'out')], { stdio: 'pipe' })
  for (const f of macBundleFiles()) {
    expect(readFileSync(join(dir, 'out', f.path)).equals(Buffer.from(f.content)), f.path).toBe(true)
    expect(statSync(join(dir, 'out', f.path)).mode & 0o777, f.path).toBe(0o644)
  }
  expect(statSync(join(dir, 'out', MAC_BUNDLE, 'Contents/Resources')).mode & 0o777).toBe(0o755)
})

test.skipIf(!existsSync('/usr/bin/unzip'))('unzip -t finds no errors', () => {
  const file = join(mkdtempSync(join(tmpdir(), 'zip-')), 'a.zip')
  writeFileSync(file, macBundleZip())
  expect(execFileSync('unzip', ['-t', file], { encoding: 'utf8' })).toMatch(/No errors detected/)
})
