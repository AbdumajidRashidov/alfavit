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

// Endings that make "word.word" an address on their own. With a "/path"
// after it any ending counts (bit.ly/…, youtu.be/…): word.word/… is not prose.
const TLDS = new Set(['uz', 'ru', 'com', 'org', 'net', 'io', 'dev', 'app', 'info', 'me', 'tv', 'co', 'gov', 'edu', 'kz', 'tj', 'kg', 'ly', 'be', 'asia', 'su', 'by'])

// Each starts at a literal ("http", "www.", "@"), so a scan never restarts mid-run.
const URL_PATTERNS: RegExp[] = [/\b(?:https?|ftp):\/\/[^\s<>"]+/gi, /\bwww\.[^\s<>"]+/gi]
const HANDLE = /(?<![A-Za-z0-9._%+-])@[A-Za-z0-9_]{3,32}\b/g

// Checked against one bounded candidate at a time, anchored at both ends.
const EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/
const LOCAL_CHAR = /[A-Za-z0-9._%+-]/
const DOMAIN_CHAR = /[A-Za-z0-9.-]/
const MAX_LOCAL = 64 // RFC 5321 limits
const MAX_DOMAIN = 253
const MAX_PATH = 2048

// Each ".ending" not followed by another host character. Bounded, so a long
// run of dots can't make one candidate expensive.
const ENDING = /\.([A-Za-z]{2,24})(?![A-Za-z0-9-])/g
const HOST_CHAR = /[A-Za-z0-9.-]/
const PATH_END = /[\s<>"]/

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

// Anchored on the ending, like emails() on the @: find ".uz", walk left over
// the host, then right over a path. Whatever glues to either side (a colon,
// an emoji, an Uzbek suffix such as ’ning or -da) stays outside the span.
function bareDomains(text: string, found: Span[]): void {
  let covered = 0 // end of the last span found here; later endings inside it are skipped
  for (const m of text.matchAll(ENDING)) {
    const dot = m.index
    let end = dot + m[0].length
    if (dot < covered) continue
    const hasPath = text[end] === '/'
    if (!hasPath && !TLDS.has(m[1].toLowerCase())) continue

    let start = dot
    while (start > 0 && dot - start < MAX_DOMAIN && HOST_CHAR.test(text[start - 1])) start--
    while (start < dot && /[.-]/.test(text[start])) start++ // a leading "." or "-" is punctuation
    if (start === dot || text[start - 1] === '@') continue // no host, or an email (emails() has it)

    if (hasPath) {
      while (end < text.length && end - dot < MAX_PATH && !PATH_END.test(text[end])) end++
      end = trimEnd(text, start, end)
    }
    found.push({ start, end })
    covered = end
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
