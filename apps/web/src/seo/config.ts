import { LOCALES, DEFAULT_LOCALE, type Locale } from '../i18n/translations'
import { chartPng } from '../content/chart'

export { LOCALES, DEFAULT_LOCALE }
export type { Locale }

export const SITE_URL = 'https://alfavit.uz'

export const PAGE_PATHS: { path: string; priority: number; locales: readonly Locale[] }[] = [
  { path: '', priority: 1.0, locales: LOCALES },
  { path: 'files', priority: 0.8, locales: LOCALES },
  { path: 'apps', priority: 0.8, locales: LOCALES },
  { path: 'developers', priority: 0.8, locales: LOCALES },
  { path: 'reform', priority: 0.7, locales: LOCALES },
  { path: 'alphabet', priority: 0.6, locales: LOCALES },
  { path: 'guide/cyrillic-to-latin', priority: 0.6, locales: LOCALES },
  { path: 'guide/old-latin-to-new', priority: 0.6, locales: LOCALES },
  { path: 'guide/keyboard', priority: 0.7, locales: LOCALES },
  { path: 'privacy', priority: 0.3, locales: LOCALES },
]

export function localesForPath(pagePath: string): readonly Locale[] {
  return PAGE_PATHS.find((p) => p.path === pagePath)?.locales ?? LOCALES
}

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
  const urls = PAGE_PATHS.flatMap(({ path, priority, locales }) =>
    locales.map((locale) => {
      const loc = SITE_URL + localePath(locale, path)
      const alts = locales
        .map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE_URL + localePath(l, path)}"/>`)
        .join('\n')
      const xdefault = `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL + localePath(DEFAULT_LOCALE, path)}"/>`
      // The alphabet chart is the one image worth crawling; declaring it here is
      // how Google Images finds it without waiting to render the page. Google
      // reads only <image:loc> — caption, title and license were retired in 2022.
      const image =
        path === 'alphabet'
          ? `\n    <image:image>\n      <image:loc>${SITE_URL + chartPng(locale)}</image:loc>\n    </image:image>`
          : ''
      return `  <url>\n    <loc>${loc}</loc>\n${alts}\n${xdefault}\n    <priority>${priority.toFixed(1)}</priority>${image}\n  </url>`
    }),
  )
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join('\n')}\n</urlset>\n`
}
