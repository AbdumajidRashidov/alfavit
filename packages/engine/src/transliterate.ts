import { segment } from './detect.js'
import { convertOldLatin } from './convert-old-latin.js'
import { convertCyrillicRun } from './convert-cyrillic.js'
import { lookupException } from './dictionary.js'
import type { Segment, TransliterateOptions, TransliterateResult } from './types.js'
import { emptyResult } from './types.js'

export function transliterate(
  input: string,
  _options: TransliterateOptions = {},
): TransliterateResult {
  if (input.length === 0) return emptyResult()

  const segments: Segment[] = []
  const flags = []

  for (const run of segment(input)) {
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
      const output = convertOldLatin(run.text)
      segments.push({ source: run.text, output, script: run.script, start: run.start, end: run.end })
    } else {
      const { output, flags: runFlags } = convertCyrillicRun(run.text, run.start)
      flags.push(...runFlags)
      segments.push({ source: run.text, output, script: run.script, start: run.start, end: run.end })
    }
  }

  return { text: segments.map((s) => s.output).join(''), segments, flags }
}
