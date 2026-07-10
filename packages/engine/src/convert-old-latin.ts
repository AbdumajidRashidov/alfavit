import { normalizeApostrophes } from './normalize'
import { applyCase } from './case'
import { OLD_LATIN_DIGRAPHS } from './mappings/old-latin'

export function convertOldLatin(text: string): string {
  const src = normalizeApostrophes(text)
  let out = ''
  let i = 0
  outer: while (i < src.length) {
    const lower = src.slice(i).toLowerCase()
    for (const [from, to] of OLD_LATIN_DIGRAPHS) {
      if (lower.startsWith(from)) {
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
