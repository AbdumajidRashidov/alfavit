import type { ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useT } from '../i18n/useT'
import { useLocalePath } from '../i18n/useLocalePath'
import { Reveal } from './Reveal'
import type { TranslationKey } from '../i18n/translations'
import { AppleIcon, WindowsIcon, AndroidIcon, GlobeIcon, TelegramIcon, PuzzleIcon, CodeIcon } from './icons'

interface Item {
  nameKey: TranslationKey
  Icon: ComponentType<{ className?: string }>
  live?: boolean
  href?: string
  download?: boolean
  descKey?: TranslationKey
  noteKey?: TranslationKey
  badge?: 'new'
}
interface Group { labelKey: TranslationKey; items: Item[] }

const GROUPS: Group[] = [
  {
    labelKey: 'channels.group.desktop',
    items: [
      {
        nameKey: 'channels.mac.name',
        Icon: AppleIcon,
        live: true,
        href: '/download/Alfavit.dmg',
        download: true,
        descKey: 'channels.mac.desc',
        noteKey: 'channels.mac.note',
        badge: 'new',
      },
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
      { nameKey: 'channels.web.name', Icon: GlobeIcon, live: true, href: '/' },
      { nameKey: 'channels.telegram.name', Icon: TelegramIcon, live: true, href: 'https://t.me/alfavit_uz_bot' },
      { nameKey: 'channels.extension.name', Icon: PuzzleIcon },
      { nameKey: 'channels.api.name', Icon: CodeIcon, live: true, href: '/developers' },
    ],
  },
]

const BTN = 'shrink-0 rounded-full bg-foreground px-5 py-2 text-sm text-background transition-transform hover:scale-[1.03]'

export function Channels() {
  const { t } = useT()
  const lp = useLocalePath()

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
                    className="flex items-center justify-between gap-4 rounded-2xl border border-black/10 p-5 transition-colors hover:border-black/25"
                  >
                    <div className="flex items-start gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black/[0.04] text-foreground">
                        <item.Icon className="h-6 w-6" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{t(item.nameKey)}</span>
                          {item.badge === 'new' && (
                            <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-xs font-medium text-foreground">
                              {t('channels.badge.new')}
                            </span>
                          )}
                        </div>
                        {item.descKey && <p className="mt-1 text-sm text-muted">{t(item.descKey)}</p>}
                        {item.noteKey && <p className="mt-1 text-xs text-muted/80">{t(item.noteKey)}</p>}
                      </div>
                    </div>
                    {!item.live || !item.href ? (
                      <span className="shrink-0 text-sm text-muted">{t('status.soon')}</span>
                    ) : item.download ? (
                      <a href={item.href} download className={BTN}>{t('channels.download')}</a>
                    ) : item.href.startsWith('/') ? (
                      <Link to={lp(item.href)} className={BTN}>{t('channels.open')}</Link>
                    ) : (
                      <a href={item.href} target="_blank" rel="noopener noreferrer" className={BTN}>{t('channels.open')}</a>
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
