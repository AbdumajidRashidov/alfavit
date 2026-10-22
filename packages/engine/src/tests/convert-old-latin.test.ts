import { expect, test } from 'vitest'
import { convertOldLatin } from '../convert-old-latin'
import { normalizeApostrophes } from '../normalize'
import { applyCase } from '../case'
import { OLD_LATIN_DIGRAPHS } from '../mappings/old-latin'

test('converts 1995 digraphs to reform letters', () => {
  expect(convertOldLatin('shamol')).toBe('şamol')
  expect(convertOldLatin('choy')).toBe('çoy')
})

test('converts apostrophe letters', () => {
  expect(convertOldLatin("o'zbek")).toBe('özbek')
  expect(convertOldLatin("g'alaba")).toBe('ğalaba')
})

test('preserves case', () => {
  expect(convertOldLatin('Shamol')).toBe('Şamol')
  expect(convertOldLatin("O'zbek")).toBe('Özbek')
})

// The public API accepts 100,000 characters per request, so the converter must
// stay linear on hostile input. Each case runs several times because the slow
// path showed up only in some JIT states (one run of 100k `g'` took ~3 s).
const LIMIT = 100_000
const RUNS = 5
const BUDGET_MS = 250

function fill(unit: string): string {
  return unit.repeat(Math.ceil(LIMIT / unit.length)).slice(0, LIMIT)
}

const PROSE = "O'zbekiston shimolida cho'l, g'alla va choyxona bor. Ma'naviyat SHAHAR o'g'il. "

const hostile: Array<[string, string, string | null]> = [
  ["g'", fill("g'"), 'ğ'.repeat(LIMIT / 2)],
  ["o'", fill("o'"), 'ö'.repeat(LIMIT / 2)],
  ['sh', fill('sh'), 'ş'.repeat(LIMIT / 2)],
  ['ch', fill('ch'), 'ç'.repeat(LIMIT / 2)],
  ['mixed prose', fill(PROSE), null],
]

for (const [name, input, expected] of hostile) {
  test(`100k chars of ${name} convert in under ${BUDGET_MS} ms, every run`, () => {
    for (let run = 0; run < RUNS; run++) {
      const t0 = performance.now()
      const out = convertOldLatin(input)
      const ms = performance.now() - t0
      expect(ms, `run ${run + 1} took ${ms.toFixed(0)} ms`).toBeLessThan(BUDGET_MS)
      if (expected !== null) expect(out).toBe(expected)
    }
  }, 30_000)
}

// İ (U+0130) lowercases to two code units (i + U+0307). The old scanner matched
// against src.toLowerCase() by source index, so everything after an İ was read
// one position off. transliterate() never sends İ here (detect.ts calls it
// foreign), but a direct call must not corrupt the rest of the text.
test('a dotted capital İ does not shift the digraphs after it', () => {
  expect(convertOldLatin('İshla')).toBe('İşla')
  expect(convertOldLatin('İ shamol choʻl')).toBe('İ şamol çöl')
})

// The pre-rewrite scanner, kept as an oracle: the rewrite must give the same
// output on every input that has no İ (see the test above for that one).
function reference(text: string): string {
  const src = normalizeApostrophes(text)
  const lower = src.toLowerCase()
  let out = ''
  let i = 0
  outer: while (i < src.length) {
    for (const [from, to] of OLD_LATIN_DIGRAPHS) {
      if (lower.startsWith(from, i)) {
        out += applyCase(to, src[i])
        i += from.length
        continue outer
      }
    }
    out += src[i]
    i++
  }
  return out
}

test('matches the pre-rewrite scanner on 3,000 random strings', () => {
  // Every table letter in both cases, every apostrophe variant, already-new
  // letters, a surrogate pair, and filler.
  const alphabet = [..."oOgGsShHcCŏŎʻ'‘’ʼʹ`´şŞçÇöÖğĞaZ .-"].concat('😀')
  let seed = 20261022
  const next = () => (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 2 ** 32
  for (let n = 0; n < 3000; n++) {
    let s = ''
    const len = Math.floor(next() * 24)
    for (let k = 0; k < len; k++) s += alphabet[Math.floor(next() * alphabet.length)]
    expect(convertOldLatin(s), JSON.stringify(s)).toBe(reference(s))
  }
})
