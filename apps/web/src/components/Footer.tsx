import { useT } from '../i18n/useT'

export function Footer() {
  const { t } = useT()
  const links = [
    { key: 'footer.reform' as const, href: '#' },
    { key: 'footer.developers' as const, href: '#' },
    { key: 'footer.telegram' as const, href: 'https://t.me/' },
    { key: 'footer.github' as const, href: 'https://github.com/' },
  ]
  return (
    <footer className="border-t border-black/10 bg-background">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-8 py-10 sm:flex-row">
        <span className="font-serif text-2xl text-foreground">Alfavit<sup className="text-sm align-super">®</sup></span>
        <nav className="flex gap-6 font-sans text-sm text-muted">
          {links.map((l) => (
            <a key={l.key} href={l.href} className="transition-colors hover:text-foreground">{t(l.key)}</a>
          ))}
        </nav>
      </div>
    </footer>
  )
}
