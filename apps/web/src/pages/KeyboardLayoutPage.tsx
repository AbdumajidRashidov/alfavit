import { KEY_TABLE, LAYOUT_NAME, macDisplaced } from '@alfavit/layouts'
import { useT } from '../i18n/useT'
import { Seo } from '../components/Seo'
import { howToLd } from '../seo/jsonld'
import { keyboardLayout } from '../content/keyboardLayout'

const BTN = 'mt-6 inline-flex rounded-full bg-foreground px-6 py-2.5 text-sm text-background transition-transform hover:scale-[1.03]'

function Steps({ steps }: { steps: string[] }) {
  return (
    <ol className="mt-6 space-y-4">
      {steps.map((step, i) => (
        <li key={step} className="flex gap-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-sm text-background">{i + 1}</span>
          <p className="pt-1 leading-relaxed text-muted">{step}</p>
        </li>
      ))}
    </ol>
  )
}

export function KeyboardLayoutPage() {
  const { t, locale } = useT()
  const copy = keyboardLayout[locale]
  const macSteps = copy.mac.steps.map((s) => ({ heading: s, body: s }))

  return (
    <>
      <Seo
        titleKey="meta.keyboardLayout.title"
        descKey="meta.keyboardLayout.desc"
        pagePath="keyboard-layout"
        jsonLd={howToLd(copy.mac.heading, macSteps)}
        breadcrumb
        breadcrumbName={t('guides.keyboardLayout')}
      />
      <section className="mx-auto max-w-3xl px-6 py-24">
        <h1 className="font-serif text-4xl sm:text-5xl text-foreground">{copy.title}</h1>
        <p className="mt-6 text-lg leading-relaxed text-muted">{copy.intro}</p>

        <h2 className="mt-14 font-medium text-foreground">{copy.combosHeading}</h2>
        {/* Rendered from the key table the layout files are generated from, so the page cannot disagree with them. */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {KEY_TABLE.map((k) => (
            <div key={k.base} className="rounded-2xl border border-black/10 px-4 py-5 text-center">
              <span className="block font-mono text-xs text-muted">⌥ / AltGr + {k.base}</span>
              <span className="mt-2 block font-serif text-4xl text-foreground">
                <span>{k.lower}</span>
                {k.upper !== k.lower && <> <span>{k.upper}</span></>}
              </span>
            </div>
          ))}
        </div>

        <h2 className="mt-14 font-medium text-foreground">{copy.mac.heading}</h2>
        <Steps steps={copy.mac.steps} />
        <p className="mt-4 text-sm text-muted">
          {copy.mac.lookFor} <strong className="text-foreground">{LAYOUT_NAME}</strong>
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">{copy.mac.notListed}</p>
        <a href="/dl/mac-layout" download className={BTN}>{t('layout.download.mac')}</a>
        <p className="mt-4 text-sm leading-relaxed text-muted">{copy.mac.uninstall}</p>

        <h3 className="mt-10 text-sm font-medium uppercase tracking-wider text-muted">{copy.displacedHeading}</h3>
        <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm">
          {macDisplaced().map((d) => (
            <li key={d.combo} className="flex items-center gap-2">
              <kbd className="text-muted">{d.combo}</kbd>
              <span className="text-muted">{d.was}</span>
              <span aria-hidden="true" className="text-muted">→</span>
              <span className="text-foreground">{d.now}</span>
            </li>
          ))}
        </ul>

        <h2 className="mt-14 font-medium text-foreground">{copy.linux.heading}</h2>
        <Steps steps={copy.linux.steps} />
        <p className="mt-4 text-sm leading-relaxed text-muted">{copy.linux.x11Note}</p>
        <a href="/dl/linux-layout" download className={BTN}>{t('layout.download.linux')}</a>

        <h2 className="mt-14 font-medium text-foreground">{copy.windows.heading}</h2>
        <p className="mt-4 leading-relaxed text-muted">{copy.windows.body}</p>

        <p className="mt-14 rounded-2xl border border-black/10 p-6 text-sm leading-relaxed text-muted">{copy.privacy}</p>
      </section>
    </>
  )
}
