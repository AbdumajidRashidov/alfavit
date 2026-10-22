import { Link } from 'react-router-dom'
import { transliterate } from '@alfavit/engine'
import { useT } from '../i18n/useT'
import { useLocalePath } from '../i18n/useLocalePath'
import { Seo } from '../components/Seo'
import { SITE_URL, localePath, pageDates } from '../seo/config'
import { articleLd } from '../seo/jsonld'
import { TRICKY_GROUPS, trickyCases } from '../content/guides/trickyCases'

/** What letter-by-letter conversion gets wrong, with the engine's own output for each case. */
export function GuideTrickyCasesPage() {
  const { t, locale } = useT()
  const lp = useLocalePath()
  const copy = trickyCases[locale]
  const url = SITE_URL + localePath(locale, 'guide/tricky-cases')

  return (
    <>
      <Seo
        titleKey="meta.guide.tricky.title"
        descKey="meta.guide.tricky.desc"
        pagePath="guide/tricky-cases"
        breadcrumb
        breadcrumbName={t('guides.tricky')}
        jsonLd={articleLd(copy.title, copy.intro, url, { ...pageDates('guide/tricky-cases'), locale })}
      />
      <section className="mx-auto max-w-3xl px-6 py-24">
        <h1 className="font-serif text-4xl sm:text-5xl text-foreground">{copy.title}</h1>
        <p className="mt-6 text-lg leading-relaxed text-muted">{copy.intro}</p>

        {TRICKY_GROUPS.map(({ id, inputs }) => (
          <div key={id} className="mt-14">
            <h2 id={`case-${id}`} className="font-medium text-foreground">{copy.groups[id].heading}</h2>
            <p className="mt-2 leading-relaxed text-muted">{copy.groups[id].note}</p>
            <table aria-labelledby={`case-${id}`} className="mt-4 w-full text-left font-mono text-sm">
              <thead>
                <tr className="text-muted">
                  <th scope="col" className="py-2 font-normal">{copy.inputLabel}</th>
                  <th scope="col" className="py-2 font-normal">{copy.outputLabel}</th>
                </tr>
              </thead>
              <tbody>
                {inputs.map((input) => (
                  <tr key={input} className="border-t border-black/10">
                    <td className="py-2 text-muted">{input}</td>
                    {/* The engine's own output, rendered at build: the page can't claim what the converter doesn't do. */}
                    <td lang="uz-Latn" className="py-2 text-foreground">{transliterate(input).text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        <Link to={lp('/')} className="mt-14 inline-flex rounded-full bg-foreground px-6 py-2.5 text-sm text-background transition-transform hover:scale-[1.03]">
          {t('nav.cta')}
        </Link>
      </section>
    </>
  )
}
