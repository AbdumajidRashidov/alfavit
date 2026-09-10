export interface FaqItem {
  q: string
  a: string
}

export interface ReformSpotlight {
  id: string
  from: string
  to: string
  body: string
  examples: [string, string][]
}

export interface GuideLetter {
  upper: string
  lower: string
  codePoint: string
}

export interface Guide {
  title: string
  intro: string
  steps: { heading: string; body: string }[]
  examples: [string, string][]
  /** Optional strip of copyable letters rendered above the steps. */
  letters?: GuideLetter[]
  /** Optional muted note rendered after the steps. */
  note?: string
}

export interface TimelineItem {
  date: string
  body: string
}
