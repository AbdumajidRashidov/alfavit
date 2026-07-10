import { expect, test } from 'vitest'
import { createApp } from '../app'

test('GET / returns usage info', async () => {
  const res = await createApp().request('/')
  expect(res.status).toBe(200)
  const body = (await res.json()) as { endpoint: string }
  expect(body.endpoint).toBe('POST /v1/transliterate')
})

test('CORS is enabled', async () => {
  const res = await createApp().request('/', { method: 'OPTIONS', headers: { origin: 'https://x.dev' } })
  expect(res.headers.get('access-control-allow-origin')).toBe('*')
})

async function post(body: unknown, raw?: string) {
  return createApp().request('/v1/transliterate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: raw ?? JSON.stringify(body),
  })
}

test('POST converts Cyrillic', async () => {
  const res = await post({ text: 'салом дунё' })
  expect(res.status).toBe(200)
  const b = (await res.json()) as { text: string; detectedScript: string; flags: unknown[] }
  expect(b.text).toBe('salom dunyo')
  expect(b.detectedScript).toBe('cyrillic')
})

test('POST honors source and returns flags for ambiguous input', async () => {
  const res = await post({ text: 'ер' })
  const b = (await res.json()) as { text: string; flags: unknown[] }
  expect(b.text).toBe('yer')
  expect(b.flags.length).toBeGreaterThan(0)
})

test('POST validation: missing text → 400', async () => {
  expect((await post({})).status).toBe(400)
})

test('POST validation: bad JSON → 400', async () => {
  expect((await post(null, '{not json')).status).toBe(400)
})

test('POST validation: oversized text → 413', async () => {
  expect((await post({ text: 'а'.repeat(100001) })).status).toBe(413)
})

test('POST validation: invalid source → 400', async () => {
  expect((await post({ text: 'салом', source: 'klingon' })).status).toBe(400)
})

test('rate limit: 429 when the limiter denies', async () => {
  const env = { RATE_LIMITER: { limit: async () => ({ success: false }) } }
  const res = await createApp().request(
    '/v1/transliterate',
    { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: 'салом' }) },
    env,
  )
  expect(res.status).toBe(429)
})

test('rate limit: allowed when no limiter binding', async () => {
  const res = await createApp().request(
    '/v1/transliterate',
    { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: 'салом' }) },
    {},
  )
  expect(res.status).toBe(200)
})
