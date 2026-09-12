import { Hono } from 'hono'
import { parseBeacon, type ParsedEvent } from './event'
import { sessionHash, utcDay } from './hash'

export interface Bindings {
  ANALYTICS?: AnalyticsEngineDataset
  SESSION_SECRET?: string
}

/** Coarse enough to be useful, coarse enough not to be identifying. */
export function deviceClass(ua: string): string {
  if (/iPad|Tablet/i.test(ua)) return 'tablet'
  if (/Mobi|Android|iPhone/i.test(ua)) return 'mobile'
  return 'desktop'
}

async function write(
  c: { env: Bindings; req: { header: (n: string) => string | undefined } },
  parsed: ParsedEvent,
  country: string,
) {
  const dataset = c.env?.ANALYTICS
  if (!dataset) return // local dev and tests without a binding: silently no-op

  const ip = c.req.header('cf-connecting-ip') ?? ''
  const ua = c.req.header('user-agent') ?? ''
  const session = await sessionHash(ip, ua, utcDay(new Date()), c.env.SESSION_SECRET ?? '')

  dataset.writeDataPoint({
    indexes: [parsed.event],
    blobs: [
      parsed.path,          // blob1
      parsed.locale,        // blob2
      parsed.referrerHost,  // blob3
      parsed.utmSource,     // blob4
      parsed.utmMedium,     // blob5
      parsed.utmCampaign,   // blob6
      country,              // blob7
      deviceClass(ua),      // blob8
      session,              // blob9
      parsed.detail,        // blob10
    ],
    doubles: [1],
  })
}

/** The only two redirect targets. A map, not string interpolation, so a crafted
 * platform value cannot become an open redirect. */
export const INSTALLERS: Record<string, string> = {
  mac: '/download/Alfavit.dmg',
  win: '/download/Alfavit-Setup.exe',
}

export function createApp() {
  const app = new Hono<{ Bindings: Bindings }>()

  app.post('/e', async (c) => {
    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      return c.text('', 400)
    }
    const parsed = parseBeacon(body)
    if (!parsed) return c.text('', 400)

    const country = (c.req.raw as Request & { cf?: { country?: string } }).cf?.country ?? 'XX'
    await write(c, parsed, country)
    return c.body(null, 204)
  })

  app.all('/e', (c) => c.text('', 405))

  app.get('/dl/:platform', async (c) => {
    const platform = c.req.param('platform')
    const target = INSTALLERS[platform]
    if (!target) return c.text('', 404)

    const parsed = parseBeacon({ e: 'download', u: c.req.url, r: c.req.header('referer') ?? '', d: platform })
    if (parsed) {
      const country = (c.req.raw as Request & { cf?: { country?: string } }).cf?.country ?? 'XX'
      await write(c, parsed, country)
    }
    return c.redirect(target, 302)
  })

  return app
}
