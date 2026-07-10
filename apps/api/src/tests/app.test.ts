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
