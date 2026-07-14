import { Head } from 'vite-react-ssg'
import { useT } from '../i18n/useT'
import { SITE_URL, DEFAULT_LOCALE, localePath, localesForPath } from '../seo/config'
import { breadcrumbLd } from '../seo/jsonld'
import type { TranslationKey } from '../i18n/translations'

interface SeoProps {
  titleKey: TranslationKey
  descKey: TranslationKey
  pagePath: string // locale-agnostic page path, e.g. '' | 'faq' | 'guide/cyrillic-to-latin'
  jsonLd?: object | object[]
  breadcrumb?: boolean
}

export function Seo({ titleKey, descKey, pagePath, jsonLd, breadcrumb }: SeoProps) {
  const { t, locale } = useT()
  const title = t(titleKey)
  const desc = t(descKey)
  const canonical = SITE_URL + localePath(locale, pagePath)
  const crumb = breadcrumb ? breadcrumbLd(title, canonical) : null
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
