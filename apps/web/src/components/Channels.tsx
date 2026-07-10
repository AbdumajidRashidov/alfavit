import { useT } from '../i18n/useT'
import { Reveal } from './Reveal'
import type { TranslationKey } from '../i18n/translations'

interface Item { icon: string; nameKey: TranslationKey; live?: boolean }
interface Group { labelKey: TranslationKey; items: Item[] }

const GROUPS: Group[] = [
  {
    labelKey: 'channels.group.desktop',
    items: [
      { icon: '🍎', nameKey: 'channels.mac.name' },
      { icon: '🪟', nameKey: 'channels.windows.name' },
    ],
  },
  {
    labelKey: 'channels.group.mobile',
    items: [
      { icon: '🍏', nameKey: 'channels.ios.name' },
      { icon: '🤖', nameKey: 'channels.android.name' },
    ],
  },
  {
    labelKey: 'channels.group.more',
    items: [
      { icon: '🌐', nameKey: 'channels.web.name', live: true },
      { icon: '✈️', nameKey: 'channels.telegram.name' },
      { icon: '🧩', nameKey: 'channels.extension.name' },
      { icon: '🔌', nameKey: 'channels.api.name' },
    ],
  },
]

export function Channels() {
  const { t } = useT()
  const openWeb = () => document.getElementById('converter')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section id="channels" className="bg-background">
      <div className="mx-auto max-w-5xl px-6 py-24">
        <Reveal>
          <h2 className="text-center font-serif text-4xl sm:text-6xl text-foreground">{t('channels.title')}</h2>
          <p className="mt-4 text-center text-base sm:text-lg text-muted">{t('channels.subtitle')}</p>
        </Reveal>

        <div className="mt-16 space-y-12">
          {GROUPS.map((g) => (
            <Reveal key={g.labelKey}>
              <h3 className="text-xs font-medium uppercase tracking-widest text-muted">{t(g.labelKey)}</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {g.items.map((item) => (
                  <div
                    key={item.nameKey}
                    className="flex items-center gap-4 rounded-2xl border border-black/10 p-5 transition-transform hover:-translate-y-0.5"
                  >
                    <span className="text-3xl" aria-hidden="true">{item.icon}</span>
                    <span className="flex-1 font-serif text-xl text-foreground">{t(item.nameKey)}</span>
                    {item.live ? (
                      <button
                        onClick={openWeb}
                        className="rounded-full bg-foreground px-5 py-2 text-sm text-background transition-transform hover:scale-[1.03]"
                      >
                        {t('channels.open')}
                      </button>
                    ) : (
                      <span className="rounded-full bg-black/[0.04] px-4 py-2 text-xs text-muted">{t('status.soon')}</span>
                    )}
                  </div>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
