import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { transliterate, detectScript } from '@alfavit/engine'

export interface Bindings {
  RATE_LIMITER?: { limit: (o: { key: string }) => Promise<{ success: boolean }> }
}

const SOURCES = ['auto', 'cyrillic', 'old-latin'] as const
const MAX_TEXT = 100000

export const API_INFO = {
  name: 'Alfavit API',
  version: '1',
  endpoint: 'POST /v1/transliterate',
  example: {
    request: { text: 'салом' },
    response: { text: 'salom', detectedScript: 'cyrillic', flags: [] },
  },
  limits: { rateLimit: '60 requests / 60s per IP', maxTextLength: 100000 },
}

export function createApp() {
  const app = new Hono<{ Bindings: Bindings }>()
  app.use('*', cors())

  app.use('/v1/*', async (c, next) => {
    const limiter = c.env?.RATE_LIMITER
    if (limiter) {
      const key = c.req.header('cf-connecting-ip') ?? 'anon'
      const { success } = await limiter.limit({ key })
      if (!success) return c.json({ error: 'Rate limit exceeded' }, 429)
    }
    await next()
  })

  app.get('/', (c) => c.json(API_INFO))

  app.post('/v1/transliterate', async (c) => {
    let body: Record<string, unknown>
    try {
      body = (await c.req.json()) as Record<string, unknown>
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400)
    }
    const text = body.text
    if (typeof text !== 'string' || text.trim() === '') {
      return c.json({ error: 'Field "text" is required' }, 400)
    }
    if (text.length > MAX_TEXT) {
      return c.json({ error: `Text too large (max ${MAX_TEXT} chars)` }, 413)
    }
    const source = body.source
    if (source !== undefined && !(SOURCES as readonly unknown[]).includes(source)) {
      return c.json({ error: 'Invalid "source"' }, 400)
    }
    const result = transliterate(text, source ? { source: source as (typeof SOURCES)[number] } : undefined)
    return c.json({ text: result.text, detectedScript: detectScript(text), flags: result.flags })
  })

  return app
}
