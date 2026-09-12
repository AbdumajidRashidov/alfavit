/** UTC calendar day, the rotation window for session hashes. */
export function utcDay(now: Date): string {
  return now.toISOString().slice(0, 10)
}

/**
 * Groups requests into a visit without storing anything about the visitor.
 *
 * The IP arrives from CF-Connecting-IP, is mixed into the digest, and is never
 * written anywhere. Including the day means yesterday's hashes cannot be joined
 * to today's, so the identifier decays on its own every midnight UTC.
 */
export async function sessionHash(
  ip: string,
  ua: string,
  day: string,
  secret: string,
): Promise<string> {
  const data = new TextEncoder().encode(`${ip}|${ua}|${day}|${secret}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)]
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
