// Two apostrophes, two jobs. INPUT: oʻ and gʻ use the turned comma ʻ (U+02BB),
// but people — and Word/Pages autocorrect — substitute other apostrophe-like
// marks (straight quote, curly quotes, modifier letters, backtick, acute), so
// fold them all to U+02BB and match oʻ/gʻ against that single form.
// OUTPUT: the reformed alphabet has exactly one apostrophe sign, the tutuq
// belgisi ʼ (U+02BC). U+02BB is an input-matching form only — it must never
// reach the output, so any turned comma left after oʻ/gʻ are consumed becomes
// U+02BC (see the last row of OLD_LATIN_DIGRAPHS).
// Exported so detect.ts includes the same set in its Latin class — the two must
// not drift (a mismatch splits words on the apostrophe before conversion runs).
export const APOSTROPHE_VARIANTS = "'‘’ʼʹ`´"

const RE = new RegExp(`[${APOSTROPHE_VARIANTS}]`, 'g')

export function normalizeApostrophes(text: string): string {
  return text.replace(RE, 'ʻ')
}
