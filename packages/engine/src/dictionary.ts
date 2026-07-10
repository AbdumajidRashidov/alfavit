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
