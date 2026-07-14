import { Link } from 'react-router-dom'
import { useT } from '../i18n/useT'
import { useLocalePath } from '../i18n/useLocalePath'
import { Seo } from './Seo'
import { howToLd } from '../seo/jsonld'
import type { Guide } from '../content/types'
import type { TranslationKey } from '../i18n/translations'

interface GuidePageProps {
  guide: Guide
  pagePath: string
  titleKey: TranslationKey
  descKey: TranslationKey
}

export function GuidePage({ guide, pagePath, titleKey, descKey }: GuidePageProps) {
  const { t } = useT()
  const lp = useLocalePath()
  return (
    <>
      <Seo titleKey={titleKey} descKey={descKey} pagePath={pagePath} jsonLd={howToLd(guide.title, guide.steps)} breadcrumb />
      <section className="mx-auto max-w-3xl px-6 py-24">
        <h1 className="font-serif text-4xl sm:text-5xl text-foreground">{guide.title}</h1>
        <p className="mt-6 text-lg leading-relaxed text-muted">{guide.intro}</p>

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

        <div className="mt-12 rounded-2xl border border-black/10 p-6">
          <div className="flex flex-col gap-2 font-mono text-sm">
            {guide.examples.map(([from, to]) => (
              <div key={from} className="flex items-center gap-3">
                <span className="text-muted">{from}</span>
                <span aria-hidden="true" className="text-muted">→</span>
                <span className="text-foreground">{to}</span>
              </div>
            ))}
          </div>
        </div>

        <Link to={lp('/')} className="mt-10 inline-flex rounded-full bg-foreground px-6 py-2.5 text-sm text-background transition-transform hover:scale-[1.03]">
          {t('nav.cta')}
        </Link>
      </section>
    </>
  )
}
