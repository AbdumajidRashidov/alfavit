import { LOCALES, DEFAULT_LOCALE, type Locale } from '../i18n/translations'

export { LOCALES, DEFAULT_LOCALE }
export type { Locale }

export const SITE_URL = 'https://alfavit.uz'

export const PAGE_PATHS: { path: string; priority: number }[] = [
  { path: '', priority: 1.0 },
  { path: 'files', priority: 0.8 },
  { path: 'apps', priority: 0.8 },
  { path: 'developers', priority: 0.8 },
  { path: 'reform', priority: 0.6 },
  { path: 'privacy', priority: 0.3 },
]

export function localePath(locale: Locale, pagePath: string): string {
  const prefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`
  const suffix = pagePath ? `/${pagePath}` : ''
  return prefix + suffix || '/'
}

export function parsePath(pathname: string): { locale: Locale; pagePath: string } {
  const segments = pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean)
  const first = segments[0]
  if (first === 'ru' || first === 'en') {
    return { locale: first, pagePath: segments.slice(1).join('/') }
  }
  return { locale: DEFAULT_LOCALE, pagePath: segments.join('/') }
}

export function generateSitemapXml(): string {
  const urls = LOCALES.flatMap((locale) =>
    PAGE_PATHS.map(({ path, priority }) => {
      const loc = SITE_URL + localePath(locale, path)
      const alts = LOCALES
        .map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE_URL + localePath(l, path)}"/>`)
        .join('\n')
      const xdefault = `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL + localePath(DEFAULT_LOCALE, path)}"/>`
      return `  <url>\n    <loc>${loc}</loc>\n${alts}\n${xdefault}\n    <priority>${priority.toFixed(1)}</priority>\n  </url>`
    }),
  )
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`
}
