import { Link } from 'react-router-dom'
import { useT } from '../i18n/useT'
import { useLocalePath } from '../i18n/useLocalePath'
import { Seo } from '../components/Seo'
import { SITE_URL, localePath } from '../seo/config'
import { articleLd } from '../seo/jsonld'
import { LETTERS, SOUNDS } from '../content/alphabet'

export function AlphabetPage() {
  const { t, locale } = useT()
  const lp = useLocalePath()
  const url = SITE_URL + localePath(locale, 'alphabet')
  const sounds = SOUNDS[locale]
  const Badge = () => (
    <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-xs font-medium text-foreground">
      {t('alphabet.changedLabel')}
    </span>
  )
  return (
    <>
      <Seo
        titleKey="meta.alphabet.title"
        descKey="meta.alphabet.desc"
        pagePath="alphabet"
        breadcrumb
        jsonLd={[articleLd(t('alphabet.title'), t('alphabet.intro'), url)]}
      />
      <section className="mx-auto max-w-3xl px-6 py-24">
        <h1 className="font-serif text-4xl sm:text-6xl text-foreground">{t('alphabet.title')}</h1>
        <p className="mt-4 text-base text-muted">{t('alphabet.intro')}</p>

        <table className="mt-12 hidden w-full text-left sm:table">
          <thead>
            <tr className="text-sm uppercase tracking-wider text-muted">
              <th className="py-2 font-medium">{t('alphabet.col.new')}</th>
              <th className="py-2 font-medium">{t('alphabet.col.old')}</th>
              <th className="py-2 font-medium">{t('alphabet.col.cyrillic')}</th>
              <th className="py-2 font-medium">{t('alphabet.col.sound')}</th>
              <th className="py-2 font-medium">{t('alphabet.col.example')}</th>
            </tr>
          </thead>
          <tbody>
            {LETTERS.map((L) => (
              <tr key={L.id} className={`border-t border-black/10 ${L.changed ? 'bg-black/[0.03]' : ''}`}>
                <td className="py-3 text-lg font-medium text-foreground">
                  <span className="align-middle">{L.latin}</span>
                  {L.changed && <span className="ml-2 align-middle"><Badge /></span>}
                </td>
                <td className="py-3 text-muted">{L.old}</td>
                <td className="py-3 text-muted">{L.cyrillic}</td>
                <td className="py-3 text-sm text-muted">{sounds[L.id]}</td>
                <td className="py-3 text-foreground">
                  {L.example}
                  {L.exampleOld && <span className="text-muted"> ({L.exampleOld})</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-12 space-y-3 sm:hidden">
          {LETTERS.map((L) => (
            <div key={L.id} className={`rounded-xl border border-black/10 p-4 ${L.changed ? 'bg-black/[0.03]' : ''}`}>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-medium text-foreground">{L.latin}</span>
                {L.changed && <Badge />}
              </div>
              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                <dt className="text-muted">{t('alphabet.col.old')}</dt>
                <dd className="text-foreground">{L.old}</dd>
                <dt className="text-muted">{t('alphabet.col.cyrillic')}</dt>
                <dd className="text-foreground">{L.cyrillic}</dd>
                <dt className="text-muted">{t('alphabet.col.sound')}</dt>
                <dd className="text-foreground">{sounds[L.id]}</dd>
                <dt className="text-muted">{t('alphabet.col.example')}</dt>
                <dd className="text-foreground">
                  {L.example}
                  {L.exampleOld && ` (${L.exampleOld})`}
                </dd>
              </dl>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-black/10 p-5">
          <h2 className="font-medium text-foreground">{t('alphabet.tutuq.label')}</h2>
          <p className="mt-1 text-sm text-muted">{t('alphabet.tutuq.note')}</p>
          <p className="mt-3 text-sm text-muted">{t('alphabet.loanword.note')}</p>
        </div>

        <p className="mt-12 text-sm text-muted">
          <Link to={lp('/reform')} className="underline hover:text-foreground">{t('reform.title')}</Link>
          {' · '}
          <Link to={lp('/')} className="underline hover:text-foreground">{t('nav.convert')}</Link>
        </p>
      </section>
    </>
  )
}
