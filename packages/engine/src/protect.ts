// Spans the converter must pass through untouched: rewriting shahar.uz to
// şahar.uz breaks the link, and an email or @handle stops reaching anyone.

export interface Span {
  start: number
  end: number
}

// Endings that make "word.word" an address rather than two words.
const TLDS = 'uz|ru|com|org|net|io|dev|app|info|me|tv|co|gov|edu|kz|tj|kg'

const PATTERNS: RegExp[] = [
  /\b(?:https?|ftp):\/\/[^\s<>"]+/gi,
  /\bwww\.[^\s<>"]+/gi,
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g,
  new RegExp(`\\b[A-Za-z0-9-]+(?:\\.[A-Za-z0-9-]+)*\\.(?:${TLDS})\\b(?:\\/[^\\s<>"]*)?`, 'gi'),
  /(?<![A-Za-z0-9._%+-])@[A-Za-z0-9_]{3,32}\b/g,
]

/** Drops sentence punctuation, and a closing bracket the address never opened. */
function trimEnd(text: string, start: number, end: number): number {
  for (;;) {
    const last = text[end - 1]
    if (/[.,;:!?]/.test(last)) {
      end--
      continue
    }
    const opener = last === ')' ? '(' : last === ']' ? '[' : undefined
    if (opener !== undefined && !text.slice(start, end - 1).includes(opener)) {
      end--
      continue
    }
    return end
  }
}

export function findProtectedSpans(text: string): Span[] {
  const found: Span[] = []
  for (const pattern of PATTERNS) {
    for (const m of text.matchAll(pattern)) {
      const start = m.index
      const end = trimEnd(text, start, start + m[0].length)
      if (end > start) found.push({ start, end })
    }
  }
  found.sort((a, b) => a.start - b.start)

  const merged: Span[] = []
  for (const span of found) {
    const last = merged[merged.length - 1]
    if (last && span.start <= last.end) last.end = Math.max(last.end, span.end)
    else merged.push({ ...span })
  }
  return merged
}
