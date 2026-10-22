import { useEffect, useState } from 'react'
import { useT } from '../i18n/useT'

/**
 * "N days to go" until an ISO date, counted in Tashkent time.
 *
 * Rendered only after hydration: the page is prerendered once at build time,
 * so a number baked into the HTML would be wrong by the next morning and stay
 * wrong in every crawler's copy. Crawlers get the date; people get the count.
 */
export function DaysLeft({ until }: { until: string }) {
  const { t } = useT()
  const [days, setDays] = useState<number | null>(null)

  useEffect(() => {
    const ms = Date.parse(`${until}T00:00:00+05:00`) - Date.now()
    setDays(Math.ceil(ms / 86_400_000))
  }, [until])

  if (days === null || days <= 0) return null
  return <span className="text-muted">{` · ${t('status.daysLeft').replace('{n}', String(days))}`}</span>
}
