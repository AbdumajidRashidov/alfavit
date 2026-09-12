import { expect, test } from 'vitest'
import { parseBeacon } from '../event'

const base = { e: 'pageview', u: 'https://alfavit.uz/apps', r: 'https://t.co/abc123' }

test('parses a well-formed pageview', () => {
  const p = parseBeacon(base)
  expect(p).not.toBeNull()
  expect(p!.event).toBe('pageview')
  expect(p!.path).toBe('/apps')
  expect(p!.referrerHost).toBe('t.co')
})

test('extracts exactly the three utm parameters', () => {
  const p = parseBeacon({
    ...base,
    u: 'https://alfavit.uz/?utm_source=gazeta&utm_medium=press&utm_campaign=senate-2026-09',
  })
  expect(p!.utmSource).toBe('gazeta')
  expect(p!.utmMedium).toBe('press')
  expect(p!.utmCampaign).toBe('senate-2026-09')
})

test('drops every other query parameter and never keeps a query string in the path', () => {
  const p = parseBeacon({
    ...base,
    u: 'https://alfavit.uz/apps?utm_source=x&token=SECRET123&email=a@b.com',
  })
  expect(p!.path).toBe('/apps')
  expect(p!.utmSource).toBe('x')
  expect(JSON.stringify(p)).not.toContain('SECRET123')
  expect(JSON.stringify(p)).not.toContain('a@b.com')
})

test('derives locale from the path prefix', () => {
  expect(parseBeacon({ ...base, u: 'https://alfavit.uz/ru/alphabet' })!.locale).toBe('ru')
  expect(parseBeacon({ ...base, u: 'https://alfavit.uz/en/apps' })!.locale).toBe('en')
  expect(parseBeacon({ ...base, u: 'https://alfavit.uz/alphabet' })!.locale).toBe('uz')
})

test('an absent or same-site referrer records as direct', () => {
  expect(parseBeacon({ ...base, r: '' })!.referrerHost).toBe('direct')
  expect(parseBeacon({ ...base, r: 'not a url' })!.referrerHost).toBe('direct')
})

test('rejects an unknown event name', () => {
  expect(parseBeacon({ ...base, e: 'exfiltrate' })).toBeNull()
})

test('rejects a missing or malformed body', () => {
  expect(parseBeacon(null)).toBeNull()
  expect(parseBeacon({})).toBeNull()
  expect(parseBeacon({ e: 'pageview' })).toBeNull()
  expect(parseBeacon({ e: 'pageview', u: 'not a url' })).toBeNull()
})

test('detail is allowlisted to short slug characters', () => {
  expect(parseBeacon({ ...base, e: 'download', d: 'mac' })!.detail).toBe('mac')
  expect(parseBeacon({ ...base, e: 'transliterate', d: 'cyrillic-latin' })!.detail).toBe('cyrillic-latin')
  // Anything that is not a short slug is dropped rather than stored.
  expect(parseBeacon({ ...base, e: 'copy', d: 'салом дунё' })!.detail).toBe('')
  expect(parseBeacon({ ...base, e: 'copy', d: 'a'.repeat(100) })!.detail).toBe('')
})

test('a beacon carrying unexpected fields cannot smuggle them through', () => {
  const p = parseBeacon({ ...base, text: 'салом дунё', input: 'secret' })
  expect(JSON.stringify(p)).not.toContain('салом')
  expect(JSON.stringify(p)).not.toContain('secret')
})
