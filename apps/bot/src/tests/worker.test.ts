import { expect, test } from 'vitest'
import worker from '../worker'

const env = { BOT_TOKEN: '123456:dummy-token-for-construction' }

test('non-POST requests are answered 405 without reaching grammY', async () => {
  const res = await worker.fetch(new Request('https://bot.example/', { method: 'GET' }), env)
  expect(res.status).toBe(405)
  expect(res.headers.get('allow')).toBe('POST')
})

test('a POST with a non-JSON body is answered 400 instead of throwing', async () => {
  const res = await worker.fetch(new Request('https://bot.example/', { method: 'POST', body: 'not json' }), env)
  expect(res.status).toBe(400)
})

test('a missing token is reported as 500 for POSTs', async () => {
  const res = await worker.fetch(new Request('https://bot.example/', { method: 'POST', body: '{}' }), { BOT_TOKEN: '' })
  expect(res.status).toBe(500)
})
