import type { ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useT } from '../i18n/useT'
import { useLocalePath } from '../i18n/useLocalePath'
import { Reveal } from './Reveal'
import { track } from '../analytics/track'
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
  /** Tag for the outbound event fired when an external link is clicked. */
  trackAs?: 'bot' | 'extension' | 'github' | 'npm'
}
interface Group { labelKey: TranslationKey; items: Item[] }

/** Chrome Web Store listing URL. Stays null until Google approves the extension;
 * paste the store URL here to flip the card from "Coming soon" to a live "Open" link. */
export const EXTENSION_STORE_URL: string | null = null

function buildGroups(extensionStoreUrl: string | null): Group[] {
  return [
    {
      labelKey: 'channels.group.desktop',
      items: [
        {
          nameKey: 'channels.mac.name',
          Icon: AppleIcon,
          live: true,
          href: '/dl/mac',
          download: true,
          descKey: 'channels.mac.desc',
          noteKey: 'channels.mac.note',
          badge: 'new',
        },
        {
          nameKey: 'channels.windows.name',
          Icon: WindowsIcon,
          live: true,
          href: '/dl/win',
          download: true,
          descKey: 'channels.windows.desc',
          noteKey: 'channels.windows.note',
          badge: 'new',
        },
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
        { nameKey: 'channels.telegram.name', Icon: TelegramIcon, live: true, href: 'https://t.me/alfavit_uz_bot', trackAs: 'bot' },
        {
          nameKey: 'channels.extension.name',
          Icon: PuzzleIcon,
          live: extensionStoreUrl !== null,
          href: extensionStoreUrl ?? undefined,
          trackAs: 'extension',
        },
        { nameKey: 'channels.api.name', Icon: CodeIcon, live: true, href: '/developers' },
      ],
    },
  ]
}

const BTN = 'rounded-full bg-foreground px-5 py-2 text-sm text-background transition-transform hover:scale-[1.03]'

export function Channels({ extensionStoreUrl = EXTENSION_STORE_URL }: { extensionStoreUrl?: string | null } = {}) {
  const { t } = useT()
  const lp = useLocalePath()
  const groups = buildGroups(extensionStoreUrl)

  // The call-to-action for a card: download / open link, or a "Coming soon"
  // label. `full` makes it a full-width block (used by stacked feature cards).
  const cta = (item: Item, full: boolean) => {
    const cls = full ? `${BTN} block w-full text-center` : `${BTN} shrink-0`
    if (!item.live || !item.href)
      return <span className={full ? 'text-sm text-muted' : 'shrink-0 text-sm text-muted'}>{t('status.soon')}</span>
    if (item.download) return <a href={item.href} download className={cls}>{t('channels.download')}</a>
    if (item.href.startsWith('/')) return <Link to={lp(item.href)} className={cls}>{t('channels.open')}</Link>
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={cls}
        onClick={() => { if (item.trackAs) track('outbound', item.trackAs) }}
      >
        {t('channels.open')}
      </a>
    )
  }

  return (
    <section id="channels" className="bg-background">
      <div className="mx-auto max-w-5xl px-6 py-24">
        <Reveal>
          <h2 className="text-center font-serif text-4xl sm:text-6xl text-foreground">{t('channels.title')}</h2>
          <p className="mt-4 text-center text-base text-muted">{t('channels.subtitle')}</p>
        </Reveal>

        <div className="mt-16 space-y-12">
          {groups.map((group) => (
            <div key={group.labelKey}>
              <h3 className="text-sm font-medium uppercase tracking-wider text-muted">{t(group.labelKey)}</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {group.items.map((item, i) => {
                  const header = (
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black/[0.04] text-foreground">
                        <item.Icon className="h-6 w-6" />
                      </span>
                      <span className="font-medium text-foreground">{t(item.nameKey)}</span>
                      {item.badge === 'new' && (
                        <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-xs font-medium text-foreground">
                          {t('channels.badge.new')}
                        </span>
                      )}
                    </div>
                  )
                  return (
                    <motion.div
                      key={item.nameKey}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.4, delay: i * 0.04 }}
                      className={`rounded-2xl border border-black/10 p-5 transition-colors hover:border-black/25 ${
                        item.descKey ? 'flex flex-col gap-3' : 'flex items-center justify-between gap-4'
                      }`}
                    >
                      {header}
                      {item.descKey ? (
                        <>
                          <p className="text-sm leading-relaxed text-muted">{t(item.descKey)}</p>
                          {item.noteKey && <p className="text-xs leading-relaxed text-muted/80">{t(item.noteKey)}</p>}
                          {cta(item, true)}
                        </>
                      ) : (
                        cta(item, false)
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
