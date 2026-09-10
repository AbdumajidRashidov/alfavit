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
  // MUST STAY LAST. Normalization folds every apostrophe-like mark to the
  // turned comma ʻ (U+02BB) so oʻ/gʻ match above regardless of how the user
  // typed them. Whatever turned comma is left over was NOT part of oʻ/gʻ, so it
  // is a tutuq belgisi — emit it as ʼ (U+02BC), the reformed alphabet's one and
  // only apostrophe sign. U+02BB never appears in new-Latin output; matching
  // the Cyrillic side, where ъ → ʼ (U+02BC).
  ['ʻ', 'ʼ'],
]
