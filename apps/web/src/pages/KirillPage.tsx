import { Link } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { Converter, CYRILLIC_EXAMPLE } from '../components/Converter'
import { SITE_URL, pageDates } from '../seo/config'
import { articleLd, faqPageLd } from '../seo/jsonld'
import { LETTERS } from '../content/alphabet'
import { kirill } from '../content/kirill'

const CHANGED = LETTERS.filter((L) => L.changed)

/** The converter page written in Uzbek Cyrillic, at /kirill only (no ru or en version). */
export function KirillPage() {
  const url = `${SITE_URL}/kirill`
  return (
    <>
      <Seo
        titleKey="meta.home.title"
        descKey="meta.home.desc"
        title={kirill.metaTitle}
        desc={kirill.metaDesc}
        lang="uz-Cyrl"
        pagePath="kirill"
        jsonLd={[
          articleLd(kirill.title, kirill.metaDesc, url, { ...pageDates('kirill'), locale: 'uz', inLanguage: 'uz-Cyrl' }),
          faqPageLd(kirill.qa),
        ]}
      />
      <section className="mx-auto max-w-3xl px-6 py-24">
        <h1 className="font-serif text-4xl sm:text-5xl text-foreground">{kirill.title}</h1>
        <p className="mt-6 text-lg leading-relaxed text-muted">{kirill.intro}</p>

        <Converter compact example={CYRILLIC_EXAMPLE} strings={kirill.converter} />

        <h2 id="kirill-letters" className="mt-16 font-medium text-foreground">{kirill.lettersHeading}</h2>
        <table aria-labelledby="kirill-letters" className="mt-4 w-full text-left">
          <thead>
            <tr className="text-sm text-muted">
              <th scope="col" className="py-2 font-normal">{kirill.fromLabel}</th>
              <th scope="col" className="py-2 font-normal">{kirill.oldLabel}</th>
              <th scope="col" className="py-2 font-normal">{kirill.toLabel}</th>
            </tr>
          </thead>
          <tbody>
            {CHANGED.map((L) => (
              <tr key={L.id} className="border-t border-black/10">
                <td className="py-3 font-serif text-2xl text-foreground">{L.cyrillic}</td>
                <td lang="uz-Latn" className="py-3 font-serif text-2xl text-muted">{L.old}</td>
                <td lang="uz-Latn" className="py-3 font-serif text-2xl text-foreground">{L.latin}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {kirill.qa.map(({ q, a }) => (
          <div key={q}>
            <h2 className="mt-12 font-medium text-foreground">{q}</h2>
            <p className="mt-2 leading-relaxed text-muted">{a}</p>
          </div>
        ))}

        <p className="mt-16 text-sm text-muted">
          <Link to="/alphabet" className="underline hover:text-foreground">{kirill.alphabetLink}</Link>
          {' · '}
          <Link to="/status" className="underline hover:text-foreground">{kirill.statusLink}</Link>
        </p>
      </section>
    </>
  )
}
