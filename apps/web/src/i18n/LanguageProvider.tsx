import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react'
import { detectInitialLocale, translations, type Locale, type TranslationKey } from './translations'

interface Ctx { t: (key: TranslationKey) => string; locale: Locale; setLocale: (l: Locale) => void }
export const LanguageContext = createContext<Ctx | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectInitialLocale)
  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    try { localStorage.setItem('alfavit.locale', l) } catch { /* ignore */ }
  }, [])
  const t = useCallback((key: TranslationKey) => translations[locale][key], [locale])
  const value = useMemo(() => ({ t, locale, setLocale }), [t, locale, setLocale])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
