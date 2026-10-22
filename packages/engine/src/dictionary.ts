import { convertCyrillicRun } from './convert-cyrillic.js'
import { APOSTROPHE_VARIANTS } from './normalize.js'

// Curated overrides. Keys are lowercase source words (Cyrillic or old-Latin).
// Extend this table over time; no code change needed.
export const EXCEPTIONS: Record<string, string> = {
  цирк: 'sirk',
}

export function lookupException(word: string): string | undefined {
  const hit = EXCEPTIONS[word.toLowerCase()]
  if (hit === undefined) return undefined
  const isUpper = word[0] !== word[0].toLowerCase()
  return isUpper ? hit[0].toUpperCase() + hit.slice(1) : hit
}

// Words where old-Latin "sh" is s + h, not ş. The 1995 spelling separates them
// with the tutuq (Is'hoq), which is usually left out; Cyrillic always shows
// the boundary (сҳ), so every entry carries its Cyrillic form as its source,
// and its output is whatever the Cyrillic path makes of it. Matched as the
// start of a word, so suffixes (Ishoqning, mushafni) are covered.
// Reviewed by the owner before each release; add entries, never code.
export const S_H_STEMS: ReadonlyArray<{ cyrillic: string; oldLatin: string }> = [
  { cyrillic: 'исҳоқ', oldLatin: 'ishoq' },
  { cyrillic: 'исҳол', oldLatin: 'ishol' },
  { cyrillic: 'асҳоб', oldLatin: 'ashob' },
  { cyrillic: 'мусҳаф', oldLatin: 'mushaf' },
  { cyrillic: 'тасҳиҳ', oldLatin: 'tashih' },
]

const APOSTROPHES = new Set([...APOSTROPHE_VARIANTS, 'ʻ', 'ʼ'])

// Longest first, so a longer stem wins over a shorter one it starts with.
const STEMS = S_H_STEMS.map(({ cyrillic, oldLatin }) => ({
  oldLatin,
  output: convertCyrillicRun(cyrillic, 0).output,
})).sort((a, b) => b.oldLatin.length - a.oldLatin.length)

/** How many characters of `word` spell `stem`, allowing one apostrophe
 * between s and h; undefined if `word` does not start with the stem. */
function matchedLength(word: string, stem: string): number | undefined {
  let i = 0
  for (let j = 0; j < stem.length; j++) {
    if (stem[j] === 'h' && stem[j - 1] === 's' && APOSTROPHES.has(word[i])) i++
    if (word[i]?.toLowerCase() !== stem[j]) return undefined
    i++
  }
  return i
}

function caseLike(source: string, output: string): string {
  const letters = [...source].filter((ch) => ch.toLowerCase() !== ch.toUpperCase())
  if (letters.length > 1 && letters.every((ch) => ch === ch.toUpperCase())) return output.toUpperCase()
  if (source[0] !== source[0].toLowerCase()) return output[0].toUpperCase() + output.slice(1)
  return output
}

export function matchSHStem(word: string): { sourceLength: number; output: string } | undefined {
  for (const stem of STEMS) {
    const sourceLength = matchedLength(word, stem.oldLatin)
    if (sourceLength !== undefined) {
      return { sourceLength, output: caseLike(word.slice(0, sourceLength), stem.output) }
    }
  }
  return undefined
}
