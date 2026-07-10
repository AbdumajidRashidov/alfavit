import type { SourceScript } from './types'

const CYRILLIC = /[Ѐ-ӿԀ-ԯ]/
const LATIN = /[A-Za-zÇçŞşĞğŎŏÖöʻ']/

function classify(ch: string): SourceScript {
  if (CYRILLIC.test(ch)) return 'cyrillic'
  if (LATIN.test(ch)) return 'old-latin'
  return 'foreign'
}

export function detectScript(text: string): SourceScript {
  let cyr = 0
  let lat = 0
  for (const ch of text) {
    const c = classify(ch)
    if (c === 'cyrillic') cyr++
    else if (c === 'old-latin') lat++
  }
  if (cyr === 0 && lat === 0) return 'foreign'
  return cyr >= lat ? 'cyrillic' : 'old-latin'
}

export function segment(text: string) {
  const runs: Array<{ text: string; script: SourceScript; start: number; end: number }> = []
  let start = 0
  while (start < text.length) {
    const script = classify(text[start])
    let end = start + 1
    while (end < text.length && classify(text[end]) === script) end++
    runs.push({ text: text.slice(start, end), script, start, end })
    start = end
  }
  return runs
}
