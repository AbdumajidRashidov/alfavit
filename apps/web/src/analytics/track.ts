export type EventName =
  | 'pageview'
  | 'transliterate'
  | 'file_convert'
  | 'copy'
  | 'download'
  | 'outbound'

const ENDPOINT = '/e'

/**
 * Fire-and-forget event beacon.
 *
 * Four fields, ever: event name, current URL, referrer, and an optional short
 * slug. The user's text is never among them — the converter reports a direction,
 * not its input. Everything here is wrapped so that an adblocker, a missing
 * sendBeacon, or a thrown error can never surface to the person using the site.
 */
export function track(event: EventName, detail = ''): void {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') return
    const body = JSON.stringify({
      e: event,
      u: window.location.href,
      r: document.referrer,
      d: detail,
    })
    navigator.sendBeacon(ENDPOINT, body)
  } catch {
    /* analytics must never break the page */
  }
}
