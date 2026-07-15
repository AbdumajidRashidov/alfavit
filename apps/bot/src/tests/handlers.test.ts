import { expect, test } from 'vitest'
import { handleMessage, buildInlineResults, MAX_INPUT } from '../handlers'

test('handleMessage converts Cyrillic', () => {
  expect(handleMessage('салом дунё', 'uz')).toBe('salom dunyo')
})

test('handleMessage converts old-Latin', () => {
  expect(handleMessage("o'zbek", 'uz')).toBe('özbek')
})

test('handleMessage returns the hint for empty input', () => {
  expect(handleMessage('   ', 'en')).toBe('Send Uzbek text and I will convert it to the new Latin script.')
})

test('handleMessage caps very long input', () => {
  const out = handleMessage('а'.repeat(MAX_INPUT + 500), 'uz')
  expect(out.length).toBeLessThanOrEqual(MAX_INPUT)
})

test('buildInlineResults converts the query into the sent message', () => {
  const results = buildInlineResults('чой', 'uz')
  expect(results).toHaveLength(1)
  expect((results[0] as { input_message_content: { message_text: string } }).input_message_content.message_text).toBe('çoy')
})

test('buildInlineResults returns a single hint for an empty query', () => {
  const results = buildInlineResults('', 'en')
  expect(results).toHaveLength(1)
  expect((results[0] as { title: string }).title).toBe('Type text to convert')
})

test('buildInlineResults sets the thumbnail when a logo URL is given', () => {
  const url = 'https://alfavit.uz/logo.png'
  expect((buildInlineResults('чой', 'uz', url)[0] as { thumbnail_url?: string }).thumbnail_url).toBe(url)
  expect((buildInlineResults('', 'uz', url)[0] as { thumbnail_url?: string }).thumbnail_url).toBe(url)
})

test('buildInlineResults omits the thumbnail when no logo URL is given', () => {
  expect((buildInlineResults('чой', 'uz')[0] as { thumbnail_url?: string }).thumbnail_url).toBeUndefined()
})
