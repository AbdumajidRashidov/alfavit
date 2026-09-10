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

export interface Guide {
  title: string
  intro: string
  steps: { heading: string; body: string }[]
  examples: [string, string][]
}

export interface TimelineItem {
  date: string
  body: string
}
