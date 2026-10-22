import { segment } from './detect.js'
import { convertOldLatin } from './convert-old-latin.js'
import { convertCyrillicRun } from './convert-cyrillic.js'
import { lookupException, matchSHStem } from './dictionary.js'
import { findProtectedSpans } from './protect.js'
import { APOSTROPHE_VARIANTS } from './normalize.js'
import type { AmbiguityFlag, Segment, TransliterateOptions, TransliterateResult } from './types.js'
import { emptyResult } from './types.js'

/** True for a word Uzbek Latin can't spell: it has a w, or a c outside "ch".
 * Such a word (Washington, Chicago) is left as written and flagged, rather
 * than half-converted to Waşington. Names without those letters (Shakespeare)
 * wait for the Cabinet's spelling rules. */
export function isForeignLatinWord(word: string): boolean {
  const lower = word.toLowerCase()
  return lower.includes('w') || /c(?!h)/.test(lower)
}

const APOSTROPHES = new Set([...APOSTROPHE_VARIANTS, 'ʻ', 'ʼ'])

/** Index of the first apostrophe variant in `word`, or its length if none. */
function firstApostrophe(word: string): number {
  for (let i = 0; i < word.length; i++) if (APOSTROPHES.has(word[i])) return i
  return word.length
}

/** Converts text that holds no protected span, run by run. `offset` is where
 * `text` starts in the original input, so segments and flags index into that. */
function convertText(text: string, offset: number, segments: Segment[], flags: AmbiguityFlag[]): void {
  for (const local of segment(text)) {
    const run = { ...local, start: local.start + offset, end: local.end + offset }

    if (run.script === 'foreign') {
      segments.push({ ...run, source: run.text, output: run.text })
      continue
    }

    const exception = lookupException(run.text)
    if (exception !== undefined) {
      segments.push({ source: run.text, output: exception, script: run.script, start: run.start, end: run.end })
      continue
    }

    if (run.script === 'old-latin') {
      // s + h, not ş, for listed words (Ishoq, mushaf); the rest of the word converts as usual.
      const stem = matchSHStem(run.text)
      if (stem) {
        const output = stem.output + convertOldLatin(run.text.slice(stem.sourceLength))
        segments.push({ source: run.text, output, script: run.script, start: run.start, end: run.end })
        continue
      }
      // Only the word before an apostrophe is judged: in Facebook’da the "’da"
      // is an Uzbek suffix, and its apostrophe still has to become the tutuq.
      const head = run.text.slice(0, firstApostrophe(run.text))
      if (isForeignLatinWord(head)) {
        const converted = convertOldLatin(head)
        if (converted !== head) {
          flags.push({ start: run.start, end: run.start + head.length, chosen: head, alternatives: [converted], reason: 'foreign-word' })
        }
        const output = head + convertOldLatin(run.text.slice(head.length))
        segments.push({ source: run.text, output, script: run.script, start: run.start, end: run.end })
        continue
      }
      const output = convertOldLatin(run.text)
      segments.push({ source: run.text, output, script: run.script, start: run.start, end: run.end })
    } else {
      const { output, flags: runFlags } = convertCyrillicRun(run.text, run.start)
      flags.push(...runFlags)
      segments.push({ source: run.text, output, script: run.script, start: run.start, end: run.end })
    }
  }
}

export function transliterate(
  input: string,
  _options: TransliterateOptions = {},
): TransliterateResult {
  if (input.length === 0) return emptyResult()

  const segments: Segment[] = []
  const flags: AmbiguityFlag[] = []

  // Addresses pass through whole; only the text between them is converted.
  let cursor = 0
  for (const span of findProtectedSpans(input)) {
    if (span.start > cursor) convertText(input.slice(cursor, span.start), cursor, segments, flags)
    const source = input.slice(span.start, span.end)
    segments.push({ source, output: source, script: 'foreign', start: span.start, end: span.end })
    cursor = span.end
  }
  if (cursor < input.length) convertText(input.slice(cursor), cursor, segments, flags)

  return { text: segments.map((s) => s.output).join(''), segments, flags }
}
