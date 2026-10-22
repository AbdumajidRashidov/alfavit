import { expect, test } from 'vitest'
import { generateLlmsFullTxt } from '../seo/llmsFull'
import { LETTERS } from '../content/alphabet'
import { STAGE, WHEN_IN_FORCE } from '../content/status'
import { keyboard } from '../content/guides/keyboard'
import { faq } from '../content/faq'
import { translations } from '../i18n/translations'

const txt = generateLlmsFullTxt()

test('carries all 28 letters in the order of the law', () => {
  const at = LETTERS.map((L) => txt.indexOf(`| ${L.latin} |`))
  expect(at.every((i) => i > 0)).toBe(true)
  expect([...at].sort((a, b) => a - b)).toEqual(at)
})

test('answers "when" once the law is signed, and cites the official text', () => {
  if (STAGE !== 'awaiting-signature') expect(txt).toContain(WHEN_IN_FORCE.en.a)
  expect(txt).toContain('https://lex.uz/uz/docs/8548754')
})

test('includes the keyboard guide and the FAQ in all three languages', () => {
  expect(txt).toContain(keyboard.en.intro)
  for (const locale of ['en', 'uz', 'ru'] as const) expect(txt).toContain(faq[locale][0].q)
})

test('stays small enough to fetch in one request', () => {
  expect(txt.length).toBeLessThan(100_000)
})

// Final review of week 3: llms.txt calls this the full text of /alphabet, and
// /alphabet now answers when the alphabet was adopted, what came before and how to type Ö.
test.each(['adopted', 'old', 'typeO'] as const)('carries the /alphabet answer "%s"', (id) => {
  expect(txt).toContain(`### ${translations.en[`alphabet.qa.${id}.q`]}\n\n${translations.en[`alphabet.qa.${id}.a`]}`)
})
