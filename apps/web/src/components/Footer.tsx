import { Link } from 'react-router-dom'
import { useT } from '../i18n/useT'
import { useLocalePath } from '../i18n/useLocalePath'

const cls = 'transition-colors hover:text-foreground'

export function Footer() {
  const { t } = useT()
  const lp = useLocalePath()
  return (
    <footer className="border-t border-black/10 bg-background">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-8 py-10 sm:flex-row">
        <Link to={lp('/')} className="font-serif text-2xl text-foreground">
          Alfavit<sup className="text-sm align-super">®</sup>
        </Link>
        <nav className="flex gap-6 font-sans text-sm text-muted">
          <Link to={lp('/reform')} className={cls}>{t('footer.reform')}</Link>
          <Link to={lp('/developers')} className={cls}>{t('footer.developers')}</Link>
          <a href="https://t.me/alfavit_uz_bot" target="_blank" rel="noopener noreferrer" className={cls}>{t('footer.telegram')}</a>
          <a href="https://github.com/AbdumajidRashidov/alfavit" target="_blank" rel="noopener noreferrer" className={cls}>{t('footer.github')}</a>
        </nav>
      </div>
    </footer>
  )
}
