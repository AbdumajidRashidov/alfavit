import { Link } from 'react-router-dom'
import { useT } from '../i18n/useT'
import { useLocalePath } from '../i18n/useLocalePath'
import { Seo } from '../components/Seo'
import { spotlights } from '../content/reform'
import { faq } from '../content/faq'
import { articleLd, faqPageLd } from '../seo/jsonld'
import { SITE_URL, localePath, localesForPath } from '../seo/config'

const CHANGES: Array<[string, string]> = [
  ['Sh sh', 'Ş ş'],
  ['Ch ch', 'Ç ç'],
  ['Gʻ gʻ', 'Ğ ğ'],
  ['Oʻ oʻ', 'Ŏ ŏ'],
  ['Ts ts', 'C c'],
]

export function ReformPage() {
  const { t, locale } = useT()
  const lp = useLocalePath()
  const items = spotlights[locale]
  const url = SITE_URL + localePath(locale, 'reform')
  const hasGuides = localesForPath('guide/cyrillic-to-latin').includes(locale)
  return (
    <>
      <Seo
        titleKey="meta.reform.title"
        descKey="meta.reform.desc"
        pagePath="reform"
        jsonLd={[articleLd(t('reform.title'), t('reform.intro'), url), faqPageLd(faq[locale])]}
        breadcrumb
      />
      <section className="mx-auto max-w-3xl px-6 py-24">
        <h1 className="font-serif text-4xl sm:text-6xl text-foreground">{t('reform.title')}</h1>
        <p className="mt-6 text-lg leading-relaxed text-muted">{t('reform.intro')}</p>

        <h2 className="mt-12 text-sm font-medium uppercase tracking-wider text-muted">{t('reform.changesLabel')}</h2>
        <div className="mt-4 divide-y divide-black/10 rounded-2xl border border-black/10">
          {CHANGES.map(([oldForm, newForm]) => (
            <div key={newForm} className="flex items-center justify-center gap-6 px-6 py-4 font-serif text-3xl">
              <span className="w-32 text-right text-muted">{oldForm}</span>
              <span aria-hidden="true" className="text-muted">→</span>
              <span className="w-32 text-foreground">{newForm}</span>
            </div>
          ))}
        </div>

        <h2 className="mt-16 text-sm font-medium uppercase tracking-wider text-muted">{t('reform.spotlightsLabel')}</h2>
        <div className="mt-4 space-y-10">
          {items.map((s) => (
            <div key={s.id} id={s.id} className="scroll-mt-24">
              <h3 className="font-serif text-3xl text-foreground">
                {s.from} <span aria-hidden="true" className="text-muted">→</span> {s.to}
              </h3>
              <p className="mt-2 leading-relaxed text-muted">{s.body}</p>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-sm text-foreground">
                {s.examples.map(([from, to]) => (
                  <span key={`${from}-${to}`}>{from} → {to}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-16 leading-relaxed text-foreground">{t('reform.law')}</p>
        <p className="mt-4 leading-relaxed text-muted">{t('reform.why')}</p>

        <h2 id="faq" className="mt-16 scroll-mt-24 text-sm font-medium uppercase tracking-wider text-muted">{t('faq.title')}</h2>
        <dl className="mt-4 divide-y divide-black/10 border-t border-black/10">
          {faq[locale].map((item) => (
            <div key={item.q} className="py-6">
              <dt className="text-lg font-medium text-foreground">{item.q}</dt>
              <dd className="mt-2 leading-relaxed text-muted">{item.a}</dd>
            </div>
          ))}
        </dl>

        {hasGuides && (
          <>
            <h2 className="mt-16 text-sm font-medium uppercase tracking-wider text-muted">{t('guides.label')}</h2>
            <div className="mt-4 flex flex-col gap-3">
              <Link to={lp('/guide/cyrillic-to-latin')} className="font-serif text-2xl text-foreground transition-colors hover:text-muted">
                {t('guides.cyrillic')} →
              </Link>
              <Link to={lp('/guide/old-latin-to-new')} className="font-serif text-2xl text-foreground transition-colors hover:text-muted">
                {t('guides.oldlatin')} →
              </Link>
            </div>
          </>
        )}
      </section>
    </>
  )
}
