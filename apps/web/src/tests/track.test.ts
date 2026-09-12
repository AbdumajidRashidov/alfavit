import { expect, test, beforeEach, vi } from 'vitest'
import { track } from '../analytics/track'

let sent: Array<{ url: string; body: string }>

beforeEach(() => {
  sent = []
  Object.defineProperty(navigator, 'sendBeacon', {
    configurable: true,
    writable: true,
    value: (url: string, body: string) => { sent.push({ url, body }); return true },
  })
})

test('posts to the same-origin collector endpoint', () => {
  track('pageview')
  expect(sent).toHaveLength(1)
  expect(sent[0].url).toBe('/e')
})

test('sends the event name, the current url and the referrer', () => {
  track('copy')
  const body = JSON.parse(sent[0].body)
  expect(body.e).toBe('copy')
  expect(typeof body.u).toBe('string')
  expect('r' in body).toBe(true)
})

test('sends a detail slug when given one', () => {
  track('transliterate', 'cyrillic-latin')
  expect(JSON.parse(sent[0].body).d).toBe('cyrillic-latin')
})

test('the payload carries exactly four keys and nothing else', () => {
  track('transliterate', 'cyrillic-latin')
  expect(Object.keys(JSON.parse(sent[0].body)).sort()).toEqual(['d', 'e', 'r', 'u'])
})

test('does not throw when sendBeacon is absent', () => {
  Object.defineProperty(navigator, 'sendBeacon', { configurable: true, writable: true, value: undefined })
  expect(() => track('pageview')).not.toThrow()
})

test('does not throw when sendBeacon returns false', () => {
  Object.defineProperty(navigator, 'sendBeacon', {
    configurable: true, writable: true, value: () => false,
  })
  expect(() => track('pageview')).not.toThrow()
})

test('does not throw when sendBeacon itself throws', () => {
  Object.defineProperty(navigator, 'sendBeacon', {
    configurable: true,
    writable: true,
    value: () => { throw new Error('blocked by extension') },
  })
  expect(() => track('pageview')).not.toThrow()
})

test('never logs to the console', () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  Object.defineProperty(navigator, 'sendBeacon', {
    configurable: true, writable: true, value: () => { throw new Error('nope') },
  })
  track('pageview')
  expect(spy).not.toHaveBeenCalled()
  spy.mockRestore()
})
