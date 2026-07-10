import type { ComponentType } from 'react'
import { motion } from 'framer-motion'
import { useT } from '../i18n/useT'
import { Reveal } from './Reveal'
import type { TranslationKey } from '../i18n/translations'
import { AppleIcon, WindowsIcon, AndroidIcon, GlobeIcon, TelegramIcon, PuzzleIcon, CodeIcon } from './icons'

interface Item { nameKey: TranslationKey; Icon: ComponentType<{ className?: string }>; live?: boolean; href?: string }
interface Group { labelKey: TranslationKey; items: Item[] }

const GROUPS: Group[] = [
  {
    labelKey: 'channels.group.desktop',
    items: [
      { nameKey: 'channels.mac.name', Icon: AppleIcon },
      { nameKey: 'channels.windows.name', Icon: WindowsIcon },
    ],
  },
  {
    labelKey: 'channels.group.mobile',
    items: [
      { nameKey: 'channels.ios.name', Icon: AppleIcon },
      { nameKey: 'channels.android.name', Icon: AndroidIcon },
    ],
  },
  {
    labelKey: 'channels.group.more',
    items: [
      { nameKey: 'channels.web.name', Icon: GlobeIcon, live: true },
      { nameKey: 'channels.telegram.name', Icon: TelegramIcon, live: true, href: 'https://t.me/alfavit_uz_bot' },
      { nameKey: 'channels.extension.name', Icon: PuzzleIcon },
      { nameKey: 'channels.api.name', Icon: CodeIcon, live: true, href: '#developers' },
    ],
  },
]

const scrollToConverter = () =>
  document.getElementById('converter')?.scrollIntoView({ behavior: 'smooth' })

export function Channels() {
  const { t } = useT()

  return (
    <section id="channels" className="bg-background">
      <div className="mx-auto max-w-5xl px-6 py-24">
        <Reveal>
          <h2 className="text-center font-serif text-4xl sm:text-6xl text-foreground">{t('channels.title')}</h2>
          <p className="mt-4 text-center text-base text-muted">{t('channels.subtitle')}</p>
        </Reveal>

        <div className="mt-16 space-y-12">
          {GROUPS.map((group) => (
            <div key={group.labelKey}>
              <h3 className="text-sm font-medium uppercase tracking-wider text-muted">{t(group.labelKey)}</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {group.items.map((item, i) => (
                  <motion.div
                    key={item.nameKey}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.4, delay: i * 0.04 }}
                    className="flex items-center justify-between rounded-2xl border border-black/10 p-5 transition-colors hover:border-black/25"
                  >
                    <div className="flex items-center gap-4">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-black/[0.04] text-foreground">
                        <item.Icon className="h-6 w-6" />
                      </span>
                      <span className="font-medium text-foreground">{t(item.nameKey)}</span>
                    </div>
                    {!item.live ? (
                      <span className="text-sm text-muted">{t('status.soon')}</span>
                    ) : item.href ? (
                      <a
                        href={item.href}
                        {...(item.href.startsWith('#') ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                        className="rounded-full bg-foreground px-5 py-2 text-sm text-background transition-transform hover:scale-[1.03]"
                      >
                        {t('channels.open')}
                      </a>
                    ) : (
                      <button
                        onClick={scrollToConverter}
                        className="rounded-full bg-foreground px-5 py-2 text-sm text-background transition-transform hover:scale-[1.03]"
                      >
                        {t('channels.open')}
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
