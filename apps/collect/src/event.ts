export const EVENTS = [
  'pageview',
  'transliterate',
  'file_convert',
  'copy',
  'download',
  'outbound',
] as const

export type EventName = (typeof EVENTS)[number]

export interface ParsedEvent {
  event: EventName
  path: string
  locale: string
  referrerHost: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
  detail: string
}

/** Short, lowercase slugs only. Anything else is dropped, not truncated —
 * truncating invites the assumption that longer values are merely trimmed. */
const DETAIL = /^[a-z0-9_-]{1,32}$/

function slug(v: unknown): string {
  return typeof v === 'string' && DETAIL.test(v) ? v : ''
}

function utmValue(params: URLSearchParams, key: string): string {
  return slug(params.get(key)?.toLowerCase() ?? '')
}

function localeOf(pathname: string): string {
  const first = pathname.split('/').filter(Boolean)[0]
  return first === 'ru' || first === 'en' ? first : 'uz'
}

function hostOf(referrer: unknown): string {
  if (typeof referrer !== 'string' || referrer === '') return 'direct'
  try {
    return new URL(referrer).host || 'direct'
  } catch {
    return 'direct'
  }
}

/**
 * Turns a raw beacon body into exactly the fields the schema stores.
 *
 * This is an allowlist, not a filter: the returned object is built field by
 * field, so anything the client sends that is not named here cannot reach
 * storage even if a future client version starts sending it by mistake.
 */
export function parseBeacon(body: unknown): ParsedEvent | null {
  if (typeof body !== 'object' || body === null) return null
  const b = body as Record<string, unknown>

  if (typeof b.e !== 'string' || !(EVENTS as readonly string[]).includes(b.e)) return null
  if (typeof b.u !== 'string') return null

  let url: URL
  try {
    url = new URL(b.u)
  } catch {
    return null
  }

  return {
    event: b.e as EventName,
    path: url.pathname,
    locale: localeOf(url.pathname),
    referrerHost: hostOf(b.r),
    utmSource: utmValue(url.searchParams, 'utm_source'),
    utmMedium: utmValue(url.searchParams, 'utm_medium'),
    utmCampaign: utmValue(url.searchParams, 'utm_campaign'),
    detail: slug(b.d),
  }
}
