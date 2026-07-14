import { useT } from '../i18n/useT'
import { usePageMeta } from '../i18n/usePageMeta'

const CHANGES: Array<[string, string]> = [
  ['Sh sh', 'Ş ş'],
  ['Ch ch', 'Ç ç'],
  ['Gʻ gʻ', 'Ğ ğ'],
  ['Oʻ oʻ', 'Ŏ ŏ'],
  ['Ts ts', 'C c'],
]

export function ReformPage() {
  const { t } = useT()
  usePageMeta('meta.reform.title', 'meta.reform.desc')
  return (
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

      <p className="mt-10 leading-relaxed text-foreground">{t('reform.law')}</p>
      <p className="mt-4 leading-relaxed text-muted">{t('reform.why')}</p>
    </section>
  )
}
