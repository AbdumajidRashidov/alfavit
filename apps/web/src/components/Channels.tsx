import { motion } from 'framer-motion'
import { useT } from '../i18n/useT'
import type { TranslationKey } from '../i18n/translations'

type StatusKey = 'status.available' | 'status.soon' | 'status.planned'
interface Channel { icon: string; nameKey: TranslationKey; descKey: TranslationKey; statusKey: StatusKey }

const CHANNELS: Channel[] = [
  { icon: '🌐', nameKey: 'channels.web.name', descKey: 'channels.web.desc', statusKey: 'status.available' },
  { icon: '✈️', nameKey: 'channels.telegram.name', descKey: 'channels.telegram.desc', statusKey: 'status.soon' },
  { icon: '🔌', nameKey: 'channels.api.name', descKey: 'channels.api.desc', statusKey: 'status.soon' },
  { icon: '🧩', nameKey: 'channels.extension.name', descKey: 'channels.extension.desc', statusKey: 'status.planned' },
  { icon: '🖥️', nameKey: 'channels.desktop.name', descKey: 'channels.desktop.desc', statusKey: 'status.planned' },
  { icon: '📱', nameKey: 'channels.mobile.name', descKey: 'channels.mobile.desc', statusKey: 'status.planned' },
]

export function Channels() {
  const { t } = useT()
  return (
    <section id="channels" className="bg-background">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <h2 className="text-center font-serif text-4xl sm:text-6xl text-foreground">{t('channels.title')}</h2>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CHANNELS.map((c, i) => (
            <motion.div
              key={c.nameKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="rounded-2xl border border-black/10 p-8 transition-transform hover:-translate-y-1"
            >
              <div className="text-3xl" aria-hidden="true">{c.icon}</div>
              <h3 className="mt-4 font-serif text-2xl text-foreground">{t(c.nameKey)}</h3>
              <p className="mt-2 text-sm text-muted">{t(c.descKey)}</p>
              <span className="mt-4 inline-block rounded-full bg-black/[0.04] px-3 py-1 text-xs text-muted">
                {t(c.statusKey)}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
