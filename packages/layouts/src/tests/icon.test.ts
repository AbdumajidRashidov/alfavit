import { expect, test } from 'vitest'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { inflateSync } from 'node:zlib'
import { encodeIcns, MAC_ICON_ENTRIES } from '../macos/icon.js'

/** type → payload, in file order. */
function readIcns(icns: Buffer): [string, Buffer][] {
  expect(icns.toString('latin1', 0, 4)).toBe('icns')
  expect(icns.readUInt32BE(4)).toBe(icns.length)
  const entries: [string, Buffer][] = []
  for (let at = 8; at < icns.length; ) {
    const length = icns.readUInt32BE(at + 4)
    entries.push([icns.toString('latin1', at, at + 4), icns.subarray(at + 8, at + length)])
    at += length
  }
  return entries
}

/** RGBA pixels of an 8-bit RGBA PNG whose rows all use filter 0. */
function decodePng(png: Buffer): { size: number; rgba: Buffer } {
  expect(png.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  let size = 0
  const idat: Buffer[] = []
  for (let at = 8; at < png.length; ) {
    const length = png.readUInt32BE(at), type = png.toString('latin1', at + 4, at + 8)
    const data = png.subarray(at + 8, at + 8 + length)
    if (type === 'IHDR') {
      size = data.readUInt32BE(0)
      expect(data.readUInt32BE(4)).toBe(size)
      expect([...data.subarray(8, 13)]).toEqual([8, 6, 0, 0, 0]) // 8-bit RGBA, no interlace
    }
    if (type === 'IDAT') idat.push(data)
    at += length + 12
  }
  const raw = inflateSync(Buffer.concat(idat))
  const rows = Array.from({ length: size }, (_, y) => {
    const row = raw.subarray(y * (size * 4 + 1), (y + 1) * (size * 4 + 1))
    expect(row[0]).toBe(0)
    return row.subarray(1)
  })
  return { size, rgba: Buffer.concat(rows) }
}

/** The ARGB payload of ic04/ic05: 'ARGB', then the A, R, G and B planes
 * PackBits-compressed in one stream. */
function decodeArgb(data: Buffer, size: number): Buffer {
  expect(data.toString('latin1', 0, 4)).toBe('ARGB')
  const out: number[] = []
  for (let at = 4; at < data.length; ) {
    const c = data[at++]
    if (c < 0x80) for (let i = 0; i <= c; i++) out.push(data[at++])
    else { const n = c - 0x80 + 3, v = data[at++]; for (let i = 0; i < n; i++) out.push(v) }
  }
  expect(out).toHaveLength(size * size * 4)
  const n = size * size, rgba = Buffer.alloc(n * 4)
  for (let i = 0; i < n; i++) {
    rgba[i * 4] = out[n + i]
    rgba[i * 4 + 1] = out[2 * n + i]
    rgba[i * 4 + 2] = out[3 * n + i]
    rgba[i * 4 + 3] = out[i]
  }
  return rgba
}

const icns = encodeIcns()
const images = readIcns(icns).map(([type, data]) => {
  const px = MAC_ICON_ENTRIES.find((e) => e.type === type)!.px
  return { type, px, rgba: type === 'ic04' || type === 'ic05' ? decodeArgb(data, px) : decodePng(data).rgba }
})

test('carries the four sizes iconutil writes for a 16 and 32 point icon', () => {
  expect(readIcns(icns).map(([type]) => type)).toEqual(['ic04', 'ic05', 'ic11', 'ic12'])
  expect(MAC_ICON_ENTRIES.map((e) => [e.type, e.px])).toEqual([['ic04', 16], ['ic05', 32], ['ic11', 32], ['ic12', 64]])
  for (const [type, data] of readIcns(icns))
    if (type === 'ic11' || type === 'ic12') expect(decodePng(data).size).toBe(MAC_ICON_ENTRIES.find((e) => e.type === type)!.px)
})

// A template image is black plus alpha: macOS keeps the alpha and paints the
// colour, white on a dark menu bar and black on a light one.
test('every pixel of every size is black: the icon is a template', () => {
  for (const { rgba } of images)
    for (let i = 0; i < rgba.length; i += 4) expect(rgba[i] | rgba[i + 1] | rgba[i + 2]).toBe(0)
})

// The system badges ("A", "РУ", "ЎЗ") are a filled rounded rectangle with the
// letters cut out of it.
test('draws a filled badge with rounded corners and the letters cut out', () => {
  for (const { type, px, rgba } of images) {
    const alpha = (x: number, y: number) => rgba[(y * px + x) * 4 + 3]
    expect(alpha(0, 0), `${type} corner`).toBe(0)
    expect(alpha(px - 1, px - 1), `${type} corner`).toBe(0)
    expect(alpha(0, px / 2), `${type} left edge`).toBe(255)
    expect(alpha(px / 2, px - 1), `${type} bottom edge`).toBe(255)
    // Inside the badge, the letters are holes. At 16 px a 1.3 pt stroke rarely
    // clears a whole pixel, so transparency is summed, not counted.
    let holes = 0
    for (let y = px / 4; y < (px * 3) / 4; y++) for (let x = px / 8; x < (px * 7) / 8; x++) holes += (255 - alpha(x, y)) / 255
    expect(holes, type).toBeGreaterThan(px * px * 0.12)
  }
})

test('the committed icon is what the generator produces', () => {
  const committed = new URL('../../out/macos/Ozbek-yangi-alifbo.bundle/Contents/Resources/Ozbek-yangi-alifbo.icns', import.meta.url)
  expect(readFileSync(committed).equals(icns)).toBe(true)
})

// Apple's own reader. iconutil only exists on macOS.
test.skipIf(!existsSync('/usr/bin/iconutil'))('iconutil reads every size back', () => {
  const dir = mkdtempSync(join(tmpdir(), 'icns-'))
  writeFileSync(join(dir, 'icon.icns'), icns)
  execFileSync('iconutil', ['-c', 'iconset', join(dir, 'icon.icns'), '-o', join(dir, 'icon.iconset')], { stdio: 'pipe' })
  const files = readdirSync(join(dir, 'icon.iconset')).sort()
  expect(files).toEqual(['icon_16x16.png', 'icon_16x16@2x.png', 'icon_32x32.png', 'icon_32x32@2x.png'])
  const width = (f: string) => execFileSync('sips', ['-g', 'pixelWidth', join(dir, 'icon.iconset', f)], { encoding: 'utf8' }).match(/pixelWidth: (\d+)/)![1]
  expect(files.map(width)).toEqual(['16', '32', '32', '64'])
})
