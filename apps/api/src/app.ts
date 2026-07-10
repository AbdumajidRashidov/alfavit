import { Hono } from 'hono'
import { cors } from 'hono/cors'

export interface Bindings {
  RATE_LIMITER?: { limit: (o: { key: string }) => Promise<{ success: boolean }> }
}

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
  app.get('/', (c) => c.json(API_INFO))
  return app
}
