import { useT } from '../i18n/useT'
import { LanguageSwitcher } from './LanguageSwitcher'
import type { TranslationKey } from '../i18n/translations'

const MENU: { key: TranslationKey; target?: string }[] = [
  { key: 'nav.convert', target: 'converter' },
  { key: 'nav.reform' },
  { key: 'nav.developers', target: 'developers' },
  { key: 'nav.telegram' },
  { key: 'nav.reach' },
]

export function Nav() {
  const { t } = useT()
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  return (
    <nav className="relative z-10 flex items-center justify-between max-w-7xl mx-auto px-8 py-6">
      <a href="#" className="font-serif text-3xl tracking-tight text-foreground">
        Alfavit<sup className="text-base align-super">®</sup>
      </a>
      <div className="hidden md:flex items-center gap-8 font-sans text-sm">
        {MENU.map(({ key, target }) => (
          <button
            key={key}
            onClick={target ? () => scrollTo(target) : undefined}
            className={target ? 'text-foreground transition-colors hover:text-foreground' : 'text-muted transition-colors hover:text-foreground'}
          >
            {t(key)}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-6">
        <LanguageSwitcher />
        <button onClick={() => scrollTo('converter')} className="rounded-full bg-foreground px-6 py-2.5 text-sm text-background transition-transform hover:scale-[1.03]">
          {t('nav.cta')}
        </button>
      </div>
    </nav>
  )
}
