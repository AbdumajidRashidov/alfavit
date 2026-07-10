// Longest source sequences first so 'oʻ' matches before 'o'.
// GROUNDED against the 2026-07-07 reform law: oʻ→ŏ, gʻ→ğ, sh→ş, ch→ç.
export const OLD_LATIN_DIGRAPHS: Array<[string, string]> = [
  ['oʻ', 'ŏ'],
  ['gʻ', 'ğ'],
  ['sh', 'ş'],
  ['ch', 'ç'],
]
