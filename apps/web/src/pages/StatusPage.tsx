import { Link } from 'react-router-dom'
import { useT } from '../i18n/useT'
import { useLocalePath } from '../i18n/useLocalePath'
import { Seo } from '../components/Seo'
import { SITE_URL, localePath, pageDates } from '../seo/config'
import { articleLd, faqPageLd, legislationLd } from '../seo/jsonld'
import { timeline } from '../content/timeline'
import { SOURCES } from '../content/sources'
import { ADOPTED_ON, CHECKED_ON, legalForce, statusCopy } from '../content/status'

/**
 * Answers "has the alphabet actually changed yet?" — the intent behind
 * "alifbo yangilandimi", "alifbo ozgardimi" and "yangi alifbo tasdiqlandimi",
 * which /reform does not serve: that page explains which letters changed, not
 * whether any of it is law yet.
 *
 * The answer is the first thing on the page, in one sentence, because that is
 * what a featured snippet and a language model will both take.
 */
export function StatusPage() {
  const { t, locale } = useT()
  const lp = useLocalePath()
  const url = SITE_URL + localePath(locale, 'status')
  const copy = statusCopy(locale)
  const steps = timeline[locale]

  return (
    <>
      <Seo
        titleKey="meta.status.title"
        descKey="meta.status.desc"
        // Stage-aware, and the date in the snippet is itself a reason to click.
        desc={`${copy.headline} ${t('status.checked')} ${CHECKED_ON}.`}
        pagePath="status"
        breadcrumb
        breadcrumbName={t('status.title')}
        jsonLd={[
          articleLd(t('status.title'), copy.headline, url, { ...pageDates('status'), locale }),
          legislationLd({
            name: t('status.title'),
            description: copy.headline,
            url,
            adoptedOn: ADOPTED_ON,
            legalForce: legalForce(),
          }),
          faqPageLd([{ q: t('status.title'), a: `${copy.headline} ${copy.body}` }]),
        ]}
      />
      <section className="mx-auto max-w-3xl px-6 py-24">
        <h1 className="font-serif text-4xl sm:text-6xl text-foreground">{t('status.title')}</h1>

        <p className="mt-8 text-2xl leading-snug text-foreground sm:text-3xl">{copy.headline}</p>
        <p className="mt-4 text-base leading-relaxed text-muted">{copy.body}</p>
        <p className="mt-4 text-sm text-muted">
          {t('status.checked')} <time dateTime={CHECKED_ON}>{CHECKED_ON}</time>
        </p>

        <h2 className="mt-16 font-medium text-foreground">{t('status.timeline')}</h2>
        <ol className="mt-4 space-y-4">
          {steps.map((s) => (
            <li key={s.date} className="border-t border-black/10 pt-4">
              <p className="text-sm font-medium text-foreground">{s.date}</p>
              <p className="mt-1 text-sm text-muted">{s.body}</p>
            </li>
          ))}
        </ol>

        <h2 className="mt-16 font-medium text-foreground">{t('status.sources')}</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {SOURCES.map(([label, href]) => (
            <li key={href}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted underline hover:text-foreground"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        <p className="mt-16 text-sm text-muted">
          <Link to={lp('/reform')} className="underline hover:text-foreground">
            {t('reform.title')}
          </Link>
          {' · '}
          <Link to={lp('/alphabet')} className="underline hover:text-foreground">
            {t('alphabet.title')}
          </Link>
          {' · '}
          <Link to={lp('/')} className="underline hover:text-foreground">
            {t('nav.convert')}
          </Link>
        </p>
      </section>
    </>
  )
}
