import { createContext, useCallback, useMemo, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { translations, type Locale, type TranslationKey } from './translations'
import { localePath, parsePath } from '../seo/config'

interface Ctx { t: (key: TranslationKey) => string; locale: Locale; setLocale: (l: Locale) => void }
export const LanguageContext = createContext<Ctx | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { locale, pagePath } = parsePath(pathname)
  const setLocale = useCallback(
    (l: Locale) => { navigate(localePath(l, pagePath)) },
    [navigate, pagePath],
  )
  const t = useCallback((key: TranslationKey) => translations[locale][key], [locale])
  const value = useMemo(() => ({ t, locale, setLocale }), [t, locale, setLocale])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
