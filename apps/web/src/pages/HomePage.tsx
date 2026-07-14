import { Link } from 'react-router-dom'
import { Hero } from '../components/Hero'
import { Converter } from '../components/Converter'
import { useT } from '../i18n/useT'
import { useLocalePath } from '../i18n/useLocalePath'
import { usePageMeta } from '../i18n/usePageMeta'
import type { TranslationKey } from '../i18n/translations'

const MORE: { to: string; key: TranslationKey }[] = [
  { to: '/files', key: 'nav.files' },
  { to: '/apps', key: 'nav.apps' },
  { to: '/developers', key: 'nav.developers' },
]

export function HomePage() {
  const { t } = useT()
  const lp = useLocalePath()
  usePageMeta('meta.home.title', 'meta.home.desc')
  return (
    <>
      <Hero />
      <Converter />
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-4 sm:grid-cols-3">
          {MORE.map(({ to, key }) => (
            <Link
              key={to}
              to={lp(to)}
              className="rounded-2xl border border-black/10 p-6 font-serif text-2xl text-foreground transition-colors hover:border-black/30"
            >
              {t(key)} →
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
