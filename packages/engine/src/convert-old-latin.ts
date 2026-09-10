import { normalizeApostrophes } from './normalize.js'
import { applyCase } from './case.js'
import { OLD_LATIN_DIGRAPHS } from './mappings/old-latin.js'

export function convertOldLatin(text: string): string {
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
