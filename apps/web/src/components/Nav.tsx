import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useT } from '../i18n/useT'
import { useLocalePath } from '../i18n/useLocalePath'
import { LanguageSwitcher } from './LanguageSwitcher'
import type { TranslationKey } from '../i18n/translations'

const ITEMS: { key: TranslationKey; to: string }[] = [
  { key: 'nav.convert', to: '/' },
  { key: 'nav.files', to: '/files' },
  { key: 'nav.apps', to: '/apps' },
  { key: 'nav.reform', to: '/reform' },
  { key: 'nav.alphabet', to: '/alphabet' },
  { key: 'nav.developers', to: '/developers' },
]

const CTA = 'rounded-full bg-foreground px-6 py-2.5 text-sm text-background transition-transform hover:scale-[1.03]'

function linkClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'text-foreground' : 'text-muted transition-colors hover:text-foreground'
}

export function Nav() {
  const { t } = useT()
  const lp = useLocalePath()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <nav className="relative z-20 bg-background">
      <div className="flex items-center justify-between max-w-7xl mx-auto px-6 sm:px-8 py-6">
        <Link to={lp('/')} onClick={close} className="font-serif text-3xl tracking-tight text-foreground">
          Alfavit<sup className="text-base align-super">®</sup>
        </Link>

        {/* desktop links */}
        <div className="hidden md:flex items-center gap-8 font-sans text-sm">
          {ITEMS.map(({ key, to }) => (
            <NavLink key={key} to={lp(to)} end={to === '/'} className={linkClass}>
              {t(key)}
            </NavLink>
          ))}
          <a href="https://t.me/alfavit_uz_bot" target="_blank" rel="noopener noreferrer" className="text-muted transition-colors hover:text-foreground">
            {t('nav.telegram')}
          </a>
        </div>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <Link to={lp('/')} className={`hidden md:inline-flex ${CTA}`}>{t('nav.cta')}</Link>
          {/* mobile menu toggle */}
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="md:hidden text-foreground"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* mobile panel */}
      {open && (
        <div data-testid="mobile-menu" className="md:hidden absolute left-0 right-0 top-full z-20 border-t border-black/10 bg-background px-6 py-6 shadow-lg flex flex-col gap-4 font-sans text-base">
          {ITEMS.map(({ key, to }) => (
            <NavLink key={key} to={lp(to)} end={to === '/'} onClick={close} className={linkClass}>
              {t(key)}
            </NavLink>
          ))}
          <a href="https://t.me/alfavit_uz_bot" target="_blank" rel="noopener noreferrer" onClick={close} className="text-muted">
            {t('nav.telegram')}
          </a>
          <Link to={lp('/')} onClick={close} className={`${CTA} self-start`}>{t('nav.cta')}</Link>
        </div>
      )}
    </nav>
  )
}
