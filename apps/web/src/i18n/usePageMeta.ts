import { useEffect } from 'react'
import { useT } from './useT'
import type { TranslationKey } from './translations'

// Sets document.title, the meta description, and <html lang> per route.
// Re-runs when the active locale changes so titles stay localized.
export function usePageMeta(titleKey: TranslationKey, descKey: TranslationKey) {
  const { t, locale } = useT()
  useEffect(() => {
    document.title = t(titleKey)
    let meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', t(descKey))
    document.documentElement.lang = locale
  }, [t, locale, titleKey, descKey])
}
