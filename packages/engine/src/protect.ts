// Spans the converter must pass through untouched: rewriting shahar.uz to
// şahar.uz breaks the link, and an email or @handle stops reaching anyone.
//
// Every pass here is linear in the input. The public API accepts 100,000
// characters, and a pattern that rescans from every position (an unanchored
// email or domain regex over "a.a.a.a…") turns one request into seconds of CPU.

export interface Span {
  start: number
  end: number
}

// Endings that make "word.word" an address rather than two words.
const TLDS = 'uz|ru|com|org|net|io|dev|app|info|me|tv|co|gov|edu|kz|tj|kg'

// Each starts at a literal ("http", "www.", "@"), so a scan never restarts mid-run.
const URL_PATTERNS: RegExp[] = [/\b(?:https?|ftp):\/\/[^\s<>"]+/gi, /\bwww\.[^\s<>"]+/gi]
const HANDLE = /(?<![A-Za-z0-9._%+-])@[A-Za-z0-9_]{3,32}\b/g

// Checked against one bounded candidate at a time, anchored at both ends.
const EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/
const DOMAIN = new RegExp(`^[A-Za-z0-9-]+(?:\\.[A-Za-z0-9-]+)*\\.(?:${TLDS})(?:\\/\\S*)?$`, 'i')
const LOCAL_CHAR = /[A-Za-z0-9._%+-]/
const DOMAIN_CHAR = /[A-Za-z0-9.-]/
const MAX_LOCAL = 64 // RFC 5321 limits
const MAX_DOMAIN = 253
const MAX_TOKEN = 300 // a bare domain with a short path; anything longer is not one

// Words for the bare-domain check: split on whitespace and on the punctuation
// that brackets or ends an address in running text.
const TOKEN = /[^\s()[\]<>"'«»,;!?]+/g

/** Drops sentence punctuation, and a closing bracket the address never opened. */
function trimEnd(text: string, start: number, end: number): number {
  const span = text.slice(start, end)
  // Only closers are ever stripped, so whether an opener exists can't change.
  const hasParen = span.includes('(')
  const hasBracket = span.includes('[')
  while (end > start) {
    const last = text[end - 1]
    if (/[.,;:!?]/.test(last) || (last === ')' && !hasParen) || (last === ']' && !hasBracket)) end--
    else break
  }
  return end
}

function emails(text: string, found: Span[]): void {
  for (let at = text.indexOf('@'); at !== -1; at = text.indexOf('@', at + 1)) {
    let start = at
    while (start > 0 && at - start < MAX_LOCAL && LOCAL_CHAR.test(text[start - 1])) start--
    let end = at + 1
    while (end < text.length && end - at <= MAX_DOMAIN && DOMAIN_CHAR.test(text[end])) end++
    while (end > at + 1 && /[.-]/.test(text[end - 1])) end-- // sentence full stop
    if (start < at && EMAIL.test(text.slice(start, end))) found.push({ start, end })
  }
}

function bareDomains(text: string, found: Span[]): void {
  for (const m of text.matchAll(TOKEN)) {
    if (m[0].length > MAX_TOKEN || !m[0].includes('.')) continue
    const start = m.index
    const end = trimEnd(text, start, start + m[0].length)
    if (end > start && DOMAIN.test(text.slice(start, end))) found.push({ start, end })
  }
}

export function findProtectedSpans(text: string): Span[] {
  const found: Span[] = []
  for (const pattern of URL_PATTERNS) {
    for (const m of text.matchAll(pattern)) {
      const end = trimEnd(text, m.index, m.index + m[0].length)
      if (end > m.index) found.push({ start: m.index, end })
    }
  }
  emails(text, found)
  bareDomains(text, found)
  for (const m of text.matchAll(HANDLE)) found.push({ start: m.index, end: m.index + m[0].length })

  found.sort((a, b) => a.start - b.start)
  const merged: Span[] = []
  for (const span of found) {
    const last = merged[merged.length - 1]
    if (last && span.start <= last.end) last.end = Math.max(last.end, span.end)
    else merged.push({ ...span })
  }
  return merged
}
