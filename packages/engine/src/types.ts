export type SourceScript = 'cyrillic' | 'old-latin' | 'foreign'

export interface Segment {
  source: string
  output: string
  script: SourceScript
  start: number
  end: number
}

export interface AmbiguityFlag {
  start: number
  end: number
  chosen: string
  alternatives: string[]
  reason: string
}

export interface TransliterateResult {
  text: string
  segments: Segment[]
  flags: AmbiguityFlag[]
}

export interface TransliterateOptions {
  source?: 'auto' | 'cyrillic' | 'old-latin'
  onAmbiguity?: 'first' | 'flag'
}

export function emptyResult(): TransliterateResult {
  return { text: '', segments: [], flags: [] }
}
