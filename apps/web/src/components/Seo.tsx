import { Head } from 'vite-react-ssg'
import { useT } from '../i18n/useT'
import { SITE_URL, DEFAULT_LOCALE, localePath, localesForPath } from '../seo/config'
import { breadcrumbLd } from '../seo/jsonld'
import type { TranslationKey } from '../i18n/translations'

interface SeoProps {
  titleKey: TranslationKey
  descKey: TranslationKey
  /**
   * Overrides descKey. For /status, whose meta description has to follow the
   * legal stage: a fixed string there would put "awaiting the President's
   * signature" in the search snippet on the day the page itself says signed.
   */
  desc?: string
  pagePath: string // locale-agnostic page path, e.g. '' | 'faq' | 'guide/cyrillic-to-latin'
  jsonLd?: object | object[]
  breadcrumb?: boolean
  /** Short name for the breadcrumb trail. Defaults to the title minus its site suffix. */
  breadcrumbName?: string
}

/**
 * A breadcrumb should read like a trail, not repeat the <title>. Titles here end
 * in "| Alfavit" or "— Alfavit", which made the second crumb say
 * "Oʻzbek alifbosi (2026) — toʻliq yangilangan lotin jadvali | Alfavit" directly
 * after a crumb already called "Alfavit".
 */
function crumbNameFrom(title: string): string {
  return title.replace(/\s*[|—–-]\s*Alfavit\s*$/u, '').trim() || title
}

export function Seo({ titleKey, descKey, desc: descOverride, pagePath, jsonLd, breadcrumb, breadcrumbName }: SeoProps) {
  const { t, locale } = useT()
  const title = t(titleKey)
  const desc = descOverride ?? t(descKey)
  const canonical = SITE_URL + localePath(locale, pagePath)
  const crumb = breadcrumb ? breadcrumbLd(breadcrumbName ?? crumbNameFrom(title), canonical) : null
  return (
    <Head>
      <html lang={locale} />
      <title>{title}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canonical} />
      {localesForPath(pagePath).map((l) => (
        <link key={l} rel="alternate" hrefLang={l} href={SITE_URL + localePath(l, pagePath)} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={SITE_URL + localePath(DEFAULT_LOCALE, pagePath)} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Alfavit" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={`${SITE_URL}/og.png`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={`${SITE_URL}/og.png`} />
      {jsonLd &&
        (Array.isArray(jsonLd) ? jsonLd : [jsonLd]).map((ld, i) => (
          <script key={i} type="application/ld+json">{JSON.stringify(ld)}</script>
        ))}
      {crumb && <script type="application/ld+json">{JSON.stringify(crumb)}</script>}
    </Head>
  )
}
