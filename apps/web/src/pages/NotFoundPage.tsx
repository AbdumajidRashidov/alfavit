import { Link } from 'react-router-dom'
import { Head } from 'vite-react-ssg'
import { useT } from '../i18n/useT'
import { useLocalePath } from '../i18n/useLocalePath'

/**
 * Prerenders to dist/404.html, which Cloudflare Pages serves — with a real 404
 * status — for anything that is not one of the 30 built pages.
 *
 * Before this, router.tsx answered `*` with the homepage and _redirects rewrote
 * every unmatched path to index.html with a 200, so every typo and stale
 * inbound link became a full duplicate of the homepage that Google had to crawl
 * and decide about. That is the most likely source of the "Crawled - currently
 * not indexed" and "Alternative page with proper canonical" entries in Search
 * Console.
 *
 * Deliberately no canonical and no hreflang: this page is not a destination.
 */
export function NotFoundPage() {
  const { t } = useT()
  const lp = useLocalePath()
  return (
    <>
      <Head>
        <title>{t('notfound.title')}</title>
        <meta name="robots" content="noindex, follow" />
      </Head>
      <section className="mx-auto max-w-3xl px-6 py-32">
        <p className="font-serif text-6xl text-foreground">404</p>
        <h1 className="mt-4 font-serif text-3xl sm:text-4xl text-foreground">{t('notfound.title')}</h1>
        <p className="mt-4 text-base text-muted">{t('notfound.body')}</p>
        <p className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link to={lp('/')} className="underline text-muted hover:text-foreground">
            {t('nav.convert')}
          </Link>
          <Link to={lp('/alphabet')} className="underline text-muted hover:text-foreground">
            {t('alphabet.title')}
          </Link>
          <Link to={lp('/reform')} className="underline text-muted hover:text-foreground">
            {t('reform.title')}
          </Link>
        </p>
      </section>
    </>
  )
}
