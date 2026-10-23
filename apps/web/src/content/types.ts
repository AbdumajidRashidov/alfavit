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
  /** `link` renders under the step's body, pointing to another page of the site. */
  steps: { heading: string; body: string; link?: { pagePath: string; label: string } }[]
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

/** Copy for /keyboard-layout. The key combinations and the displaced
 * characters are not here: the page renders them from @alfavit/layouts. */
export interface KeyboardLayoutCopy {
  title: string
  intro: string
  combosHeading: string
  displacedHeading: string
  mac: {
    heading: string
    steps: string[]
    /** Label before the layout's name as it appears in Input Sources. */
    lookFor: string
    /** What to do if the layout does not appear (the quarantine flag). */
    notListed: string
    uninstall: string
  }
  linux: { heading: string; steps: string[]; x11Note: string }
  windows: { heading: string; body: string }
  privacy: string
}
