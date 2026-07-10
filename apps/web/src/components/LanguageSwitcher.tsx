import { useT } from '../i18n/useT'
import type { Locale } from '../i18n/translations'

const LABELS: Record<Locale, string> = { uz: 'UZ', ru: 'RU', en: 'EN' }

export function LanguageSwitcher() {
  const { locale, setLocale } = useT()
  return (
    <div className="flex gap-2 text-sm">
      {(Object.keys(LABELS) as Locale[]).map((l) => (
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
