import { SITE_URL } from './config'
import { CHECKED_ON, STAGE, STATUS_COPY, WHEN_IN_FORCE } from '../content/status'
import { timeline } from '../content/timeline'
import { SOURCES } from '../content/sources'
import { LETTERS, SOUNDS } from '../content/alphabet'
import { spotlights } from '../content/reform'
import { keyboard } from '../content/guides/keyboard'
import { faq } from '../content/faq'
import type { FaqItem } from '../content/types'
import { translations } from '../i18n/translations'

/**
 * Generates dist/llms-full.txt: the full text of the pages language models
 * quote, so a model can answer from one fetch instead of four rendered pages.
 *
 * Built from the same modules the pages render, like llms.txt, so the two
 * cannot disagree with the site. Crawlers were already asking for this file
 * and getting a 404.
 */

const faqSection = (items: FaqItem[]) => items.map(({ q, a }) => `**${q}**\n${a}`).join('\n\n')

export function generateLlmsFullTxt(): string {
  const status = STATUS_COPY[STAGE].en
  const when = STAGE === 'awaiting-signature' ? '' : `\n### ${WHEN_IN_FORCE.en.q}\n\n${WHEN_IN_FORCE.en.a}\n`

  const steps = timeline.en.map(({ date, body }) => `- ${date}: ${body}`).join('\n')
  const sources = SOURCES.map(([label, url]) => `- ${label} — ${url}`).join('\n')

  const rows = LETTERS.map(
    (L) => `| ${L.latin} | ${L.old} | ${L.cyrillic} | ${SOUNDS.en[L.id] ?? ''} | ${L.example}${L.exampleOld ? ` (was ${L.exampleOld})` : ''} |`,
  ).join('\n')

  const changes = spotlights.en
    .map((s) => `### ${s.from} → ${s.to}\n\n${s.body}\n\n${s.examples.map(([from, to]) => `- ${from} → ${to}`).join('\n')}`)
    .join('\n\n')

  // The three questions /alphabet answers under its table, as on the page.
  const en = translations.en
  const answers = (['adopted', 'old', 'typeO'] as const)
    .map((id) => `### ${en[`alphabet.qa.${id}.q`]}\n\n${en[`alphabet.qa.${id}.a`]}`)
    .join('\n\n')

  const guide = keyboard.en
  const typing = `${guide.intro}\n\n${guide.steps.map((s, i) => `${i + 1}. **${s.heading}.** ${s.body}`).join('\n')}${guide.note ? `\n\n${guide.note}` : ''}`

  return `# Alfavit — full text

> The full text of the pages on ${SITE_URL} that answer questions about Uzbekistan's 2026 alphabet. The short index with links to every page and tool is ${SITE_URL}/llms.txt.

Last updated: ${CHECKED_ON}.

## Legal status

${status.headline}

${status.body}
${when}
### Timeline

${steps}

### Sources

${sources}

## The alphabet (${LETTERS.length} letters)

${LETTERS.length} letters and one apostrophe sign (tutuq belgisi, ʼ), in the order of the law. Before the reform: 26 letters and 3 letter combinations.

| Latin (2026) | Old Latin (1995) | Cyrillic | Sound | Example |
|---|---|---|---|---|
${rows}

${answers}

## What changed

${changes}

## ${guide.title}

${typing}

## FAQ

### English

${faqSection(faq.en)}

### Oʻzbekcha

${faqSection(faq.uz)}

### Русский

${faqSection(faq.ru)}
`
}
