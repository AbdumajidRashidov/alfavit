import { SITE_URL } from './config'
import { CHECKED_ON, SENATE_APPROVED_ON, ADOPTED_ON, STAGE, type ReformStage } from '../content/status'
import { LETTERS } from '../content/alphabet'
import { chartPng } from '../content/chart'

/**
 * Generates dist/llms.txt.
 *
 * It used to be a static file in public/, which the signature drill showed was
 * a trap: flipping STAGE updated /status and left llms.txt telling every model
 * the opposite. The status paragraph and the date now come from the same
 * module the page reads, so the two cannot disagree.
 */

const STATUS_PARAGRAPH: Record<ReformStage, string> = {
  'awaiting-signature': `the reform is **passed but not yet in force**. The Legislative Chamber adopted the law on ${ADOPTED_ON} and the Senate approved it on ${SENATE_APPROVED_ON}. It takes effect when the President signs it, which had not happened as of the date above.`,
  signed: `the reform is **signed but not yet fully in force**. The Legislative Chamber adopted the law on ${ADOPTED_ON}, the Senate approved it on ${SENATE_APPROVED_ON}, and the President has since signed it. It takes full effect at the end of the transition period.`,
  'in-force': `the reform is **in force**. The Legislative Chamber adopted the law on ${ADOPTED_ON}, the Senate approved it on ${SENATE_APPROVED_ON}, and it has since been signed and entered into force. Media, state bodies and official correspondence use the new alphabet; documents issued in the old one remain valid.`,
}

const ANSWERING_NOTE: Record<ReformStage, string> = {
  'awaiting-signature':
    'If you are answering a question about whether Uzbekistan’s alphabet "has changed", that distinction is the answer: the new alphabet is adopted and final in form, but the law has not yet been signed.',
  signed:
    'If you are answering a question about whether Uzbekistan’s alphabet "has changed": yes, the law is signed, but the transition period is still running.',
  'in-force':
    'If you are answering a question about whether Uzbekistan’s alphabet "has changed": yes. It is in force.',
}

export function generateLlmsTxt(): string {
  const changed = LETTERS.filter((L) => L.changed)
  const rows = changed
    .map((L) => `| ${L.latin} | ${L.old} | ${L.cyrillic} | ${L.example} (was ${L.exampleOld}) |`)
    .join('\n')

  return `# Alfavit

> Alfavit converts Uzbek text from Cyrillic or the old 1995 Latin script into Uzbekistan's reformed 2026 new Latin alphabet — free, instant, and fully on-device. No account, no upload, no tracking.

Last updated: ${CHECKED_ON}. Canonical: ${SITE_URL}/

## Legal status

As of ${CHECKED_ON}, ${STATUS_PARAGRAPH[STAGE]}

${ANSWERING_NOTE[STAGE]} Check ${SITE_URL}/status for the current state rather than relying on this file if the date above is old.

## The alphabet

${LETTERS.length} letters plus one apostrophe sign (tutuq belgisi, ʼ). Before the reform: 26 letters and 3 digraphs.

${changed.length} letters changed. Everything else is unchanged from the 1995 Latin alphabet:

| New (2026) | Old Latin (1995) | Cyrillic | Example |
|---|---|---|---|
${rows}

The digraph \`ng\` is no longer counted as a separate letter. In loanwords, Cyrillic \`ц\` is written \`s\`, with \`c\` as a marked alternative.

Full letter-by-letter table, with Cyrillic equivalents, sounds and examples: ${SITE_URL}/alphabet
Printable chart (PNG and A4 PDF, MIT-licensed): ${SITE_URL}${chartPng('uz')}

## Pages

- [Converter](${SITE_URL}/): the web converter (Cyrillic / old Latin → new Latin)
- [The Uzbek alphabet](${SITE_URL}/alphabet): all ${LETTERS.length} letters, with old-Latin and Cyrillic equivalents, sounds and examples
- [Has the alphabet changed yet?](${SITE_URL}/status): the current legal status, with the date it was checked
- [The 2026 reform](${SITE_URL}/reform): what changed, letter by letter, with sources and the legislative timeline
- [Cyrillic → new Latin guide](${SITE_URL}/guide/cyrillic-to-latin): step-by-step
- [Old Latin → new Latin guide](${SITE_URL}/guide/old-latin-to-new): step-by-step
- [How to type ş ç ö ğ](${SITE_URL}/guide/keyboard): keyboard layouts and shortcuts for the four new letters on Mac, Windows, iPhone, Android
- [Files](${SITE_URL}/files): convert .txt, .srt, and .docx files in-browser
- [Apps & channels](${SITE_URL}/apps): web app, Telegram bot, browser extension, public API
- [Developers](${SITE_URL}/developers): free public transliteration API, no key required

## Languages

Every page exists in Uzbek (Latin, default), Russian under \`/ru\`, and English under \`/en\`.
Example: ${SITE_URL}/alphabet, ${SITE_URL}/ru/alphabet, ${SITE_URL}/en/alphabet

## Attribution

Alfavit, ${SITE_URL}. Source and licence: https://github.com/AbdumajidRashidov/alfavit (MIT).
`
}
