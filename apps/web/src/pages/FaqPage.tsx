import { useT } from '../i18n/useT'
import { Seo } from '../components/Seo'
import { faq } from '../content/faq'
import { faqPageLd } from '../seo/jsonld'

export function FaqPage() {
  const { t, locale } = useT()
  const items = faq[locale]
  return (
    <>
      <Seo titleKey="meta.faq.title" descKey="meta.faq.desc" pagePath="faq" jsonLd={faqPageLd(items)} breadcrumb />
      <section className="mx-auto max-w-3xl px-6 py-24">
        <h1 className="font-serif text-4xl sm:text-6xl text-foreground">{t('faq.title')}</h1>
        <dl className="mt-12 divide-y divide-black/10 border-t border-black/10">
          {items.map((item) => (
            <div key={item.q} className="py-6">
              <dt className="text-lg font-medium text-foreground">{item.q}</dt>
              <dd className="mt-2 leading-relaxed text-muted">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  )
}
