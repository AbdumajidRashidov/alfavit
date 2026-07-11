import { Link, NavLink } from 'react-router-dom'
import { useT } from '../i18n/useT'
import { LanguageSwitcher } from './LanguageSwitcher'
import type { TranslationKey } from '../i18n/translations'

const ITEMS: { key: TranslationKey; to: string }[] = [
  { key: 'nav.convert', to: '/' },
  { key: 'nav.files', to: '/files' },
  { key: 'nav.apps', to: '/apps' },
  { key: 'nav.reform', to: '/reform' },
  { key: 'nav.developers', to: '/developers' },
]

export function Nav() {
  const { t } = useT()
  return (
    <nav className="relative z-10 flex items-center justify-between max-w-7xl mx-auto px-8 py-6">
      <Link to="/" className="font-serif text-3xl tracking-tight text-foreground">
        Alfavit<sup className="text-base align-super">®</sup>
      </Link>
      <div className="hidden md:flex items-center gap-8 font-sans text-sm">
        {ITEMS.map(({ key, to }) => (
          <NavLink
            key={key}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              isActive ? 'text-foreground' : 'text-muted transition-colors hover:text-foreground'
            }
          >
            {t(key)}
          </NavLink>
        ))}
        <a href="https://t.me/alfavit_uz_bot" target="_blank" rel="noopener noreferrer" className="text-muted transition-colors hover:text-foreground">
          {t('nav.telegram')}
        </a>
      </div>
      <div className="flex items-center gap-6">
        <LanguageSwitcher />
        <Link to="/" className="rounded-full bg-foreground px-6 py-2.5 text-sm text-background transition-transform hover:scale-[1.03]">
          {t('nav.cta')}
        </Link>
      </div>
    </nav>
  )
}
