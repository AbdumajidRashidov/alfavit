import { expect, test, vi } from 'vitest'
import { createClient } from '../index'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

test('transliterate POSTs to the API and returns the parsed result', async () => {
  const fetchMock = vi.fn(async () => jsonResponse({ text: 'salom', detectedScript: 'cyrillic', flags: [] }))
  const client = createClient({ baseUrl: 'https://api.alfavit.uz/', fetch: fetchMock })
  const out = await client.transliterate('салом', { source: 'cyrillic' })

  expect(out.text).toBe('salom')
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
  expect(url).toBe('https://api.alfavit.uz/v1/transliterate')
  expect(init.method).toBe('POST')
  expect(JSON.parse(init.body as string)).toEqual({ text: 'салом', source: 'cyrillic' })
})

test('transliterate throws the API error message on non-2xx', async () => {
  const fetchMock = vi.fn(async () => jsonResponse({ error: 'Field "text" is required' }, 400))
  const client = createClient({ baseUrl: 'https://api.alfavit.uz', fetch: fetchMock })
  await expect(client.transliterate('')).rejects.toThrow('Field "text" is required')
})
