// The layout's menu-bar icon: "ÖZ" cut out of a filled rounded badge, the
// style of Apple's own "A", "РУ" and "ЎЗ". Apple draws those from text labels
// (TISIconLabels), but macOS reads labels only for input methods and its own
// layouts, never from a third-party layout bundle — so the badge is drawn
// here, as a template icon that macOS tints for light and dark menu bars.
//
// Drawn from geometry rather than a font: no font licence question, and the
// same bytes on every machine. Only + - * / and sqrt, which IEEE 754 fixes
// exactly; no trigonometry, whose last bit may vary between engines.
import { crc32 } from '../zip.js'

/** Point coordinates on the 16 × 16 pt canvas, y downwards. Apple's badges
 * are 16 pt tall with 11 pt semibold text; an .icns is square, so this one is
 * as tall and as heavy, and narrower. */
const BADGE_RADIUS = 4
const CAP_TOP = 5.4
const BASELINE = 13
const O = { cx: 4.7, cy: (CAP_TOP + BASELINE) / 2, rx: 3.35, ry: (BASELINE - CAP_TOP) / 2 + 0.1, stemX: 1.5, stemY: 1.3 }
const DOTS = { dx: 1.45, cy: 3.55, r: 0.8 }
const Z = { left: 8.95, right: 14.65, bar: 1.25, diagonal: 1.85 }

function inBadge(x: number, y: number): boolean {
  const dx = x - Math.min(Math.max(x, BADGE_RADIUS), 16 - BADGE_RADIUS)
  const dy = y - Math.min(Math.max(y, BADGE_RADIUS), 16 - BADGE_RADIUS)
  return x >= 0 && x <= 16 && y >= 0 && y <= 16 && dx * dx + dy * dy <= BADGE_RADIUS * BADGE_RADIUS
}

function inO(x: number, y: number): boolean {
  const ex = (x - O.cx) / O.rx, ey = (y - O.cy) / O.ry
  const ix = (x - O.cx) / (O.rx - O.stemX), iy = (y - O.cy) / (O.ry - O.stemY)
  return ex * ex + ey * ey <= 1 && ix * ix + iy * iy > 1
}

function inDots(x: number, y: number): boolean {
  const near = (cx: number) => (x - cx) * (x - cx) + (y - DOTS.cy) * (y - DOTS.cy) <= DOTS.r * DOTS.r
  return near(O.cx - DOTS.dx) || near(O.cx + DOTS.dx)
}

function inZ(x: number, y: number): boolean {
  if (x < Z.left || x > Z.right || y < CAP_TOP || y > BASELINE) return false
  if (y <= CAP_TOP + Z.bar || y >= BASELINE - Z.bar) return true
  // The diagonal runs from the top bar's right end to the bottom bar's left end.
  const from = Z.right - Z.diagonal - ((y - CAP_TOP) / (BASELINE - CAP_TOP)) * (Z.right - Z.diagonal - Z.left)
  return x >= from && x <= from + Z.diagonal
}

const inIcon = (x: number, y: number) => inBadge(x, y) && !inO(x, y) && !inDots(x, y) && !inZ(x, y)

/** Coverage of each pixel, 8 × 8 samples, as alpha 0–255, row by row. */
export function renderIcon(px: number): Uint8Array {
  const S = 8, scale = 16 / px
  const alpha = new Uint8Array(px * px)
  for (let py = 0; py < px; py++)
    for (let qx = 0; qx < px; qx++) {
      let hits = 0
      for (let j = 0; j < S; j++)
        for (let i = 0; i < S; i++) if (inIcon((qx + (i + 0.5) / S) * scale, (py + (j + 0.5) / S) * scale)) hits++
      alpha[py * px + qx] = Math.round((hits * 255) / (S * S))
    }
  return alpha
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
