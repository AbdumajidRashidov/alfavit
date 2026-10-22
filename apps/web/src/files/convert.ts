import { transliterate, type Segment } from '@alfavit/engine'

export function convertPlainText(text: string): string {
  return transliterate(text).text
}

// One pass over the markup in document order picks out the <w:t> text runs and
// what decides how they join: paragraph tags, and run content that ends a word.
// The `(?<!\/)` excludes self-closing `<w:t/>` runs from the open-tag match —
// otherwise the lazy inner match would swallow markup up to the next </w:t> and
// corrupt the document (empty <w:t/> runs are common in real Word output).
// `<w:p\b` leaves out <w:pPr>, <w:pict> and the like; a self-closing <w:p/> is
// an empty paragraph and is skipped below.
const TOKEN_RE =
  /(<w:t\b[^>]*(?<!\/)>)([\s\S]*?)(<\/w:t>)|<w:p\b[^>]*>|<\/w:p>|<w:(tab|ptab|br|cr|noBreakHyphen|sym|drawing|pict|object|footnoteReference|endnoteReference)\b[^>]*>/g

// Run content that sits between words, not inside one. Each stands in as one
// character the engine reads as a word break, and is dropped again when the
// text goes back into the runs. Everything else between runs (spellcheck and
// bookmark marks, rsid and formatting changes, field codes, soft hyphens)
// joins the runs on either side into one text.
const BREAKS: Record<string, string> = {
  tab: '\t',
  ptab: '\t',
  br: '\n',
  cr: '\n',
  noBreakHyphen: '‑',
  sym: ' ',
  drawing: ' ',
  pict: ' ',
  object: ' ',
  footnoteReference: ' ',
  endnoteReference: ' ',
}

const NAMED_REFS: Record<string, string> = { lt: '<', gt: '>', quot: '"', apos: "'", amp: '&' }

// Reads text the way an XML parser does. Some generators write every non-ASCII
// letter as a numeric reference (&#1058; or &#x422; for Т), so those are read
// too. One pass, so &amp;#1058; stays the text "&#1058;". A raw CR or CR LF
// reads as LF; only &#13; is a real CR.
function xmlUnescape(s: string): string {
  return s
    .replace(/\r\n?/g, '\n')
    .replace(/&(?:(lt|gt|quot|apos|amp)|#(\d+)|#x([0-9a-fA-F]+));/g, (ref, name?: string, dec?: string, hex?: string) => {
      if (name !== undefined) return NAMED_REFS[name]
      const code = dec !== undefined ? parseInt(dec, 10) : parseInt(hex!, 16)
      return code <= 0x10ffff ? String.fromCodePoint(code) : ref // out of range: not XML, left alone
    })
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;') // must be first
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r/g, '&#13;') // written raw, a CR would read back as LF
}

/** A run's text, or a word break (no `run`), within one paragraph. */
interface Part {
  text: string
  run?: number
}

/** How a segment's output divides among the pieces of its source, one piece
 * per run it spans. Unchanged text (spaces, addresses, foreign words) stays
 * where it was. A converted word keeps its run boundaries when each piece
 * converts on its own to the same text (a bold Т + ошкент gives T + oşkent);
 * otherwise the whole converted word goes in the run where it starts and the
 * rest of its runs give up their part of it (ТОШК + ЕНТ gives TOŞKENT + ""). */
function splitOutput(segment: Segment, pieces: string[]): string[] {
  if (pieces.length === 1) return [segment.output]
  if (segment.output === segment.source) return pieces
  const each = pieces.map((piece) => transliterate(piece).text)
  if (each.join('') === segment.output) return each
  return pieces.map((_, i) => (i === 0 ? segment.output : ''))
}

/** Converts a paragraph's runs as one text, so the engine sees whole words,
 * and adds each run's share of the output to out[run]. */
function convertParagraph(parts: Part[], out: string[]): void {
  if (!parts.some((part) => part.run !== undefined)) return
  const starts: number[] = []
  let length = 0
  for (const part of parts) {
    starts.push(length)
    length += part.text.length
  }
  const { segments } = transliterate(parts.map((part) => part.text).join(''))

  let first = 0 // the first part that can still overlap a segment
  for (const segment of segments) {
    while (starts[first] + parts[first].text.length <= segment.start) first++
    const spanned: number[] = []
    const pieces: string[] = []
    for (let i = first; i < parts.length && starts[i] < segment.end; i++) {
      const from = Math.max(segment.start, starts[i]) - starts[i]
      const to = Math.min(segment.end, starts[i] + parts[i].text.length) - starts[i]
      if (to > from) {
        spanned.push(i)
        pieces.push(parts[i].text.slice(from, to))
      }
    }
    // A converted segment is letters only, so the run it starts in is a run,
    // never a break.
    splitOutput(segment, pieces).forEach((output, k) => {
      const run = parts[spanned[k]].run
      if (run !== undefined) out[run] += output
    })
  }
}

export function transliterateDocxXml(xml: string): string {
  const runs: Array<{ start: number; end: number; open: string; close: string }> = []
  const out: string[] = []
  // Paragraphs open at this point, innermost last; a text box nests its own
  // paragraphs inside a run. The first holds any runs outside a paragraph.
  const open: Part[][] = [[]]

  for (const m of xml.matchAll(TOKEN_RE)) {
    const [tag, openTag, inner, closeTag, breakName] = m
    const paragraph = open[open.length - 1]
    if (openTag !== undefined) {
      paragraph.push({ text: xmlUnescape(inner), run: runs.length })
      runs.push({ start: m.index!, end: m.index! + tag.length, open: openTag, close: closeTag })
      out.push('')
    } else if (breakName !== undefined) {
      paragraph.push({ text: BREAKS[breakName] })
    } else if (tag === '</w:p>') {
      if (open.length > 1) convertParagraph(open.pop()!, out)
    } else if (!tag.endsWith('/>')) {
      open.push([])
    }
  }
  for (const paragraph of open) convertParagraph(paragraph, out)

  let result = ''
  let cursor = 0
  runs.forEach((run, i) => {
    result += xml.slice(cursor, run.start) + run.open + xmlEscape(out[i]) + run.close
    cursor = run.end
  })
  return result + xml.slice(cursor)
}
