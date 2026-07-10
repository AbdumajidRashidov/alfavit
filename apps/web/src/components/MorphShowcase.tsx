import { Suspense, lazy, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useT } from '../i18n/useT'
import { ErrorBoundary } from './ErrorBoundary'

const MorphBackdrop = lazy(() => import('./MorphBackdrop'))

const PAIRS: Array<[string, string]> = [['ш', 'ş'], ['ў', 'ŏ'], ['ч', 'ç'], ['gʻ', 'ğ']]

function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false)
  useEffect(() => { setReduce(!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) }, [])
  return reduce
}

function MorphPair({ from, to, reduce }: { from: string; to: string; reduce: boolean }) {
  const [showTo, setShowTo] = useState(false)
  useEffect(() => {
    if (reduce) { setShowTo(true); return }
    const id = setInterval(() => setShowTo((s) => !s), 1800)
    return () => clearInterval(id)
  }, [reduce])
  return (
    <div className="relative flex h-40 w-40 items-center justify-center font-serif text-8xl">
      {reduce ? (
        <span>{to}</span>
      ) : (
        <AnimatePresence mode="wait">
          <motion.span
            key={showTo ? to : from}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5 }}
            className={showTo ? 'text-foreground' : 'text-muted'}
          >
            {showTo ? to : from}
          </motion.span>
        </AnimatePresence>
      )}
    </div>
  )
}

export function MorphShowcase() {
  const { t } = useT()
  const reduce = usePrefersReducedMotion()
  return (
    <section className="relative min-h-screen overflow-hidden bg-background">
      {!reduce && (
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <ErrorBoundary fallback={null}>
            <Suspense fallback={null}><MorphBackdrop /></Suspense>
          </ErrorBoundary>
        </div>
      )}
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-24 text-center">
        <h2 className="font-serif text-4xl sm:text-6xl text-foreground">{t('morph.title')}</h2>
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8">
          {PAIRS.map(([from, to]) => <MorphPair key={to} from={from} to={to} reduce={reduce} />)}
        </div>
      </div>
    </section>
  )
}
