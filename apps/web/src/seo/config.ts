import { LOCALES, DEFAULT_LOCALE, type Locale } from '../i18n/translations'
import { chartPng } from '../content/chart'

export { LOCALES, DEFAULT_LOCALE }
export type { Locale }

export const SITE_URL = 'https://alfavit.uz'

export interface PageDef {
  path: string
  priority: number
  locales: readonly Locale[]
  /** ISO date the page first went live. */
  published: string
  /** ISO date its content last meaningfully changed — drives <lastmod> and dateModified. */
  updated: string
}

/**
 * Priorities follow what the pages are actually worth in search: /alphabet
 * draws 6,484 impressions a quarter and /files, /apps and /developers draw 12
 * between them, which the old 0.6-vs-0.8 split had backwards.
 *
 * `updated` must be maintained by hand when content changes. It cannot be read
 * from git at build time — CI checks out at depth 1, so the history is not
 * there. Dates seeded from `git log` over each page and its content module.
 * An inaccurate lastmod is worse than none: Google stops trusting the file.
 */
export const PAGE_PATHS: PageDef[] = [
  { path: '', priority: 1.0, locales: LOCALES, published: '2026-07-11', updated: '2026-09-10' },
  { path: 'alphabet', priority: 0.9, locales: LOCALES, published: '2026-07-17', updated: '2026-09-13' },
  { path: 'reform', priority: 0.8, locales: LOCALES, published: '2026-07-11', updated: '2026-09-10' },
  { path: 'guide/keyboard', priority: 0.6, locales: LOCALES, published: '2026-09-10', updated: '2026-09-10' },
  { path: 'guide/cyrillic-to-latin', priority: 0.6, locales: LOCALES, published: '2026-07-14', updated: '2026-07-15' },
  { path: 'guide/old-latin-to-new', priority: 0.6, locales: LOCALES, published: '2026-07-14', updated: '2026-07-15' },
  { path: 'apps', priority: 0.5, locales: LOCALES, published: '2026-07-11', updated: '2026-07-14' },
  { path: 'files', priority: 0.5, locales: LOCALES, published: '2026-07-11', updated: '2026-07-14' },
  { path: 'developers', priority: 0.5, locales: LOCALES, published: '2026-07-11', updated: '2026-07-14' },
  { path: 'privacy', priority: 0.3, locales: LOCALES, published: '2026-07-14', updated: '2026-09-12' },
]

/**
 * Publication dates for a page. The reform's legal status is still moving —
 * the law awaits the President's signature — so both Google and the language
 * models answering questions about it need to see which version is current.
 */
export function pageDates(pagePath: string): { published: string; updated: string } {
  const page = PAGE_PATHS.find((p) => p.path === pagePath)
  if (!page) throw new Error(`pageDates: unknown page path "${pagePath}"`)
  return { published: page.published, updated: page.updated }
}

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
  const urls = PAGE_PATHS.flatMap(({ path, priority, locales, updated }) =>
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
      return `  <url>\n    <loc>${loc}</loc>\n${alts}\n${xdefault}\n    <lastmod>${updated}</lastmod>\n    <priority>${priority.toFixed(1)}</priority>${image}\n  </url>`
    }),
  )
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join('\n')}\n</urlset>\n`
}
