import { expect, test } from 'vitest'
import { faqPageLd, howToLd, articleLd } from '../seo/jsonld'

test('faqPageLd builds a FAQPage with one Question per item', () => {
  const ld = faqPageLd([{ q: 'A?', a: 'B.' }, { q: 'C?', a: 'D.' }]) as any
  expect(ld['@type']).toBe('FAQPage')
  expect(ld.mainEntity).toHaveLength(2)
  expect(ld.mainEntity[0]).toMatchObject({ '@type': 'Question', name: 'A?', acceptedAnswer: { '@type': 'Answer', text: 'B.' } })
})

test('howToLd builds a HowTo with positioned steps', () => {
  const ld = howToLd('Do it', [{ heading: 'One', body: 'first' }]) as any
  expect(ld['@type']).toBe('HowTo')
  expect(ld.step[0]).toMatchObject({ '@type': 'HowToStep', position: 1, name: 'One', text: 'first' })
})

test('articleLd builds an Article', () => {
  const ld = articleLd('H', 'D', 'https://alfavit.uz/reform') as any
  expect(ld['@type']).toBe('Article')
  expect(ld).toMatchObject({ headline: 'H', description: 'D', url: 'https://alfavit.uz/reform' })
})
