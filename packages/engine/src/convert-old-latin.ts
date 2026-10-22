import { normalizeApostrophes } from './normalize.js'
import { applyCase } from './case.js'
import { OLD_LATIN_DIGRAPHS } from './mappings/old-latin.js'

// One regex pass over the table. Alternation tries the rows in table order, so
// at each position the first row that matches wins — longest first, the ʻ → ʼ
// fallback last, same as the table promises. Each letter matches itself or its
// uppercase (the only characters that lowercase to o g s h c ŏ), and the output
// takes its case from the matched lead character.
//
// Not a hand-rolled `out += …` loop: on 100,000-character input (the public
// API's limit) V8 sometimes left that loop in a slow tier at 3–7 s per call.
// replace() copies unmatched stretches in bulk and builds the result once.
const TO = new Map(OLD_LATIN_DIGRAPHS)

function letter(ch: string): string {
  const upper = ch.toUpperCase()
  return upper.length === 1 && upper !== ch ? `[${ch}${upper}]` : ch
}

const RE = new RegExp(
  OLD_LATIN_DIGRAPHS.map(([from]) => [...from].map(letter).join('')).join('|'),
  'g',
)

export function convertOldLatin(text: string): string {
  return normalizeApostrophes(text).replace(RE, (m) => applyCase(TO.get(m.toLowerCase())!, m[0]))
}
