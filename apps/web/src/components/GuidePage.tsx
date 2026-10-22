import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useT } from '../i18n/useT'
import { useLocalePath } from '../i18n/useLocalePath'
import { Seo } from './Seo'
import { Converter } from './Converter'
import { ChartFigure } from './ChartFigure'
import { kirill } from '../content/kirill'
import { howToLd, chartImageLd } from '../seo/jsonld'
import { SITE_URL, localePath } from '../seo/config'
import type { Guide } from '../content/types'
import type { TranslationKey } from '../i18n/translations'

interface GuidePageProps {
  guide: Guide
  pagePath: string
  titleKey: TranslationKey
  descKey: TranslationKey
  /** Puts the converter right under the intro: people reach these pages to convert, not to read first. */
  converter?: boolean
  /** Placeholder text for that converter (e.g. a Cyrillic sample on the Cyrillic guide). */
  converterExample?: string
  /** Shows the printable chart, for pages that draw chart-image searches (the keyboard guide). */
  chart?: boolean
  /** A short label for the breadcrumb trail, instead of the full title. */
  crumbKey?: TranslationKey
  /** Links /kirill (root only, Uzbek Cyrillic), for the Cyrillic guide. */
  kirillLink?: boolean
}

export function GuidePage({ guide, pagePath, titleKey, descKey, converter = false, converterExample, chart = false, crumbKey, kirillLink = false }: GuidePageProps) {
  const { t, locale } = useT()
  const lp = useLocalePath()
  const [copied, setCopied] = useState<string | null>(null)

  const copyLetter = async (lower: string) => {
    await navigator.clipboard.writeText(lower)
    setCopied(lower)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <>
      <Seo titleKey={titleKey} descKey={descKey} pagePath={pagePath} jsonLd={chart
          ? [howToLd(guide.title, guide.steps), chartImageLd({ locale, name: t('alphabet.title'), description: t('alphabet.chart.alt'), caption: t('alphabet.chart.caption'), pageUrl: SITE_URL + localePath(locale, pagePath) })]
          : howToLd(guide.title, guide.steps)} breadcrumb breadcrumbName={crumbKey ? t(crumbKey) : undefined} />
      <section className="mx-auto max-w-3xl px-6 py-24">
        <h1 className="font-serif text-4xl sm:text-5xl text-foreground">{guide.title}</h1>
        <p className="mt-6 text-lg leading-relaxed text-muted">{guide.intro}</p>

        {converter && <Converter compact example={converterExample} />}

        {guide.letters && (
          <div data-testid="letters" className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {guide.letters.map((L) => (
              <button
                key={L.lower}
                type="button"
                onClick={() => copyLetter(L.lower)}
                aria-label={`${t('converter.copy')} ${L.lower}`}
                className="rounded-2xl border border-black/10 px-4 py-5 text-center transition-colors hover:border-black/30"
              >
                <span className="block font-serif text-4xl text-foreground">{`${L.upper} ${L.lower}`}</span>
                <span className="mt-2 block font-mono text-xs text-muted">{copied === L.lower ? t('converter.copied') : L.codePoint}</span>
              </button>
            ))}
          </div>
        )}

        <ol className="mt-12 space-y-6">
          {guide.steps.map((step, i) => (
            <li key={step.heading} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-sm text-background">{i + 1}</span>
              <div>
                <h2 className="font-medium text-foreground">{step.heading}</h2>
                <p className="mt-1 leading-relaxed text-muted">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        {guide.note && <p className="mt-8 text-sm leading-relaxed text-muted">{guide.note}</p>}

        {converter && (
          <p className="mt-8 text-sm">
            <Link to={lp('/guide/tricky-cases')} className="text-muted underline hover:text-foreground">{t('guides.tricky')} →</Link>
            {kirillLink && (
              <>
                {' · '}
                {/* /kirill exists at the root only, so no locale prefix. */}
                <Link to="/kirill" lang="uz-Cyrl" className="text-muted underline hover:text-foreground">{kirill.linkFromAlphabet} →</Link>
              </>
            )}
          </p>
        )}

        <div className="mt-12 rounded-2xl border border-black/10 p-6">
          <div className="flex flex-col gap-2 font-mono text-sm">
            {guide.examples.map(([from, to]) => (
              <div key={`${from}-${to}`} className="flex items-center gap-3">
                <span className="text-muted">{from}</span>
                <span aria-hidden="true" className="text-muted">→</span>
                <span className="text-foreground">{to}</span>
              </div>
            ))}
          </div>
        </div>

        {chart && <ChartFigure />}

        {/* With the converter on the page, a button to the home page would send people away from it. */}
        {!converter && (
          <Link to={lp('/')} className="mt-10 inline-flex rounded-full bg-foreground px-6 py-2.5 text-sm text-background transition-transform hover:scale-[1.03]">
            {t('nav.cta')}
          </Link>
        )}
      </section>
    </>
  )
}
