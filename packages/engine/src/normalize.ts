// oʻ and gʻ use the turned comma ʻ (U+02BB). People — and Word/Pages autocorrect —
// substitute other apostrophe-like marks (straight quote, curly quotes, modifier
// letters, backtick, acute). Treat them all as that apostrophe. Exported so
// detect.ts includes the same set in its Latin class — the two must not drift
// (a mismatch splits words on the apostrophe before conversion runs).
export const APOSTROPHE_VARIANTS = "'‘’ʼʹ`´"

const RE = new RegExp(`[${APOSTROPHE_VARIANTS}]`, 'g')

export function normalizeApostrophes(text: string): string {
  return text.replace(RE, 'ʻ')
}
