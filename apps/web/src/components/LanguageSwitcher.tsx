import { useLocation } from 'react-router-dom'
import { useT } from '../i18n/useT'
import { parsePath, localesForPath } from '../seo/config'
import type { Locale } from '../i18n/translations'

const LABELS: Record<Locale, string> = { uz: 'UZ', ru: 'RU', en: 'EN' }

export function LanguageSwitcher() {
  const { locale, setLocale } = useT()
  const { pathname } = useLocation()
  const available = localesForPath(parsePath(pathname).pagePath)
  return (
    <div className="flex gap-2 text-sm">
      {available.map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={l === locale ? 'text-foreground' : 'text-muted'}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  )
}
