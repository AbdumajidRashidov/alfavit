// Longest source sequences first so 'oʻ' matches before 'o'.
// GROUNDED against the 2026-07-07 reform law: oʻ→ö, gʻ→ğ, sh→ş, ch→ç.
// The reform replaces oʻ with Ö/ö (diaeresis, U+00F6) — aligning with the
// Turkic Latin alphabets (Turkish/Azerbaijani/Turkmen), NOT the breve ŏ that
// the 2021 draft proposed. `ŏ`→`ö` self-heals text mis-converted with the breve.
export const OLD_LATIN_DIGRAPHS: Array<[string, string]> = [
  ['oʻ', 'ö'],
  ['gʻ', 'ğ'],
  ['sh', 'ş'],
  ['ch', 'ç'],
  ['ŏ', 'ö'],
]
