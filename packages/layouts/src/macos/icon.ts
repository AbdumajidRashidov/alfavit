// The layout's menu-bar icon: "öz" cut out of a filled rounded badge, drawn
// exactly as macOS draws its own "A", "РУ" and "ЎЗ" — the same corners, font,
// weight and placement — at the 16 × 16 pt macOS allows a third-party layout
// (Apple's own badges are 22 × 16 pt). Apple draws those from text labels,
// but macOS reads labels only for input methods and its own input sources
// (KeyboardLayouts.framework keeps them in a table keyed by Apple's ids),
// never from a third-party layout bundle — so the badge ships as a template
// icon that macOS tints for light and dark menu bars.
//
// The pixels are rendered on a Mac by tools/render-icon.swift, in Apple's
// system font, and committed as src/macos/iconMasks.ts; this module only
// packs them, so every machine builds the same bytes.
import { crc32 } from '../zip.js'
import { ICON_MASKS } from './iconMasks.js'

/** Alpha 0–255 for each pixel, row by row. */
export function renderIcon(px: number): Uint8Array {
  const mask = ICON_MASKS[px]
  if (!mask) throw new Error(`no ${px} px icon: add the size to tools/render-icon.swift and run it`)
  return new Uint8Array(Buffer.from(mask, 'base64'))
}

function chunk(type: string, data: Buffer): Buffer {
  const head = Buffer.alloc(8)
  head.writeUInt32BE(data.length, 0)
  head.write(type, 4, 'latin1')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0)
  return Buffer.concat([head, data, crc])
}

/** A zlib stream of stored blocks: no compressor, so no zlib build can change
 * the bytes (the same reason as tar.ts). */
function storedZlib(data: Buffer): Buffer {
  const parts: Buffer[] = [Buffer.from([0x78, 0x01])]
  for (let at = 0; at < data.length || at === 0; at += 0xffff) {
    const block = data.subarray(at, at + 0xffff)
    const head = Buffer.alloc(5)
    head[0] = at + 0xffff >= data.length ? 1 : 0
    head.writeUInt16LE(block.length, 1)
    head.writeUInt16LE(~block.length & 0xffff, 3)
    parts.push(head, block)
  }
  let a = 1, b = 0
  for (const byte of data) { a = (a + byte) % 65521; b = (b + a) % 65521 }
  const adler = Buffer.alloc(4)
  adler.writeUInt32BE(((b << 16) | a) >>> 0, 0)
  return Buffer.concat([...parts, adler])
}

/** Black RGBA: a template image carries its shape in alpha alone. */
export function encodePng(px: number, alpha: Uint8Array): Buffer {
  const raw = Buffer.alloc(px * (px * 4 + 1))
  for (let y = 0; y < px; y++) for (let x = 0; x < px; x++) raw[y * (px * 4 + 1) + 1 + x * 4 + 3] = alpha[y * px + x]
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(px, 0)
  ihdr.writeUInt32BE(px, 4)
  ihdr.set([8, 6, 0, 0, 0], 8)
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', storedZlib(raw)), chunk('IEND', Buffer.alloc(0))])
}

/** The icns run-length code: 0x80 + n − 3 repeats the next byte n times
 * (3–130); n − 1 copies the next n bytes (1–128). */
function packBits(plane: Uint8Array): number[] {
  const out: number[] = []
  let literal: number[] = []
  const flush = () => { if (literal.length) out.push(literal.length - 1, ...literal); literal = [] }
  for (let at = 0; at < plane.length; ) {
    let run = 1
    while (at + run < plane.length && run < 130 && plane[at + run] === plane[at]) run++
    if (run >= 3) { flush(); out.push(0x80 + run - 3, plane[at]); at += run; continue }
    literal.push(plane[at++])
    if (literal.length === 128) flush()
  }
  flush()
  return out
}

/** ic04/ic05: 'ARGB', then each plane packed on its own. */
function encodeArgb(px: number, alpha: Uint8Array): Buffer {
  const black = new Uint8Array(px * px)
  return Buffer.concat([Buffer.from('ARGB', 'latin1'), ...[alpha, black, black, black].map((p) => Buffer.from(packBits(p)))])
}

/** What iconutil writes for a 16 and 32 pt icon set: ARGB at 1x, PNG at 2x. */
export const MAC_ICON_ENTRIES = [
  { type: 'ic04', px: 16, encode: encodeArgb },
  { type: 'ic05', px: 32, encode: encodeArgb },
  { type: 'ic11', px: 32, encode: encodePng },
  { type: 'ic12', px: 64, encode: encodePng },
] as const

export function encodeIcns(): Buffer {
  const entries = MAC_ICON_ENTRIES.map(({ type, px, encode }) => {
    const data = encode(px, renderIcon(px))
    const head = Buffer.alloc(8)
    head.write(type, 0, 'latin1')
    head.writeUInt32BE(data.length + 8, 4)
    return Buffer.concat([head, data])
  })
  const head = Buffer.alloc(8)
  head.write('icns', 0, 'latin1')
  head.writeUInt32BE(8 + entries.reduce((n, e) => n + e.length, 0), 4)
  return Buffer.concat([head, ...entries])
}
