import { Link } from 'react-router-dom'
import { useT } from '../i18n/useT'
import { useLocalePath } from '../i18n/useLocalePath'

/** One-line news banner above the hero. The text is a single i18n key so the
 * Wave-2 (presidential signature) update is a string change, not a code change. */
export function NewsStrip() {
  const { t } = useT()
  const lp = useLocalePath()
  return (
    <div className="border-b border-black/10 bg-black/[0.03] px-6 py-2.5 text-center text-sm text-foreground">
      <Link to={lp('/reform')} className="underline decoration-black/30 underline-offset-4 transition-colors hover:text-muted">
        {t('news.senate')}
      </Link>
    </div>
  )
}
