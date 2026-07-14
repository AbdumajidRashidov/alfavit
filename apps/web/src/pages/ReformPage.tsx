import { useT } from '../i18n/useT'
import { Seo } from '../components/Seo'
import { spotlights } from '../content/reform'
import { articleLd } from '../seo/jsonld'
import { SITE_URL, localePath } from '../seo/config'

const CHANGES: Array<[string, string]> = [
  ['Sh sh', 'Ş ş'],
  ['Ch ch', 'Ç ç'],
  ['Gʻ gʻ', 'Ğ ğ'],
  ['Oʻ oʻ', 'Ŏ ŏ'],
  ['Ts ts', 'C c'],
]

export function ReformPage() {
  const { t, locale } = useT()
  const items = spotlights[locale]
  const url = SITE_URL + localePath(locale, 'reform')
  return (
    <>
      <Seo
        titleKey="meta.reform.title"
        descKey="meta.reform.desc"
        pagePath="reform"
        jsonLd={articleLd(t('reform.title'), t('reform.intro'), url)}
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
      </section>
    </>
  )
}
