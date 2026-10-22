import { useState, useRef } from 'react'
import { detectScript, transliterate } from '@alfavit/engine'
import { useTransliterate } from '../hooks/useTransliterate'
import { track } from '../analytics/track'
import { useT } from '../i18n/useT'
import { Reveal } from './Reveal'
import type { TranslationKey } from '../i18n/translations'

/** Shared from the in-product share button, so medium is `button` — `telegram`
 * is a utm_source, never a utm_medium. See docs/marketing/README.md:20-22. */
export const SHARE_URL = 'https://alfavit.uz/?utm_source=share&utm_medium=button&utm_campaign=senate-2026-09'
const SECONDARY_BTN = 'rounded-full border border-black/15 py-2 text-sm text-foreground transition-colors hover:border-black/40'

/** The compact converter's empty state. 80% of what people convert is old
 * Latin, so it shows an old-Latin example (oʻ, sh, ch, gʻ) and, greyed in the
 * output, what the engine makes of it — before anyone types. */
export const EXAMPLE = 'Oʻzbekiston, Toshkent, choʻl, togʻ'
const EXAMPLE_RESULT = transliterate(EXAMPLE).text

/** Telegram's share endpoint: pre-fills a message with the converted text + our link. */
export function telegramShareHref(text: string): string {
  return `https://t.me/share/url?url=${encodeURIComponent(SHARE_URL)}&text=${encodeURIComponent(text)}`
}

/**
 * `compact` is the /alphabet version: a bordered card under the page intro,
 * shorter boxes, the old-Latin example, and no fade-in — it sits above the
 * fold, and the fade starts at opacity 0 until hydration.
 */
export function Converter({ compact = false }: { compact?: boolean }) {
  const { t } = useT()
  const [input, setInput] = useState('')
  const { text, detectedScript } = useTransliterate(input)
  const [copied, setCopied] = useState(false)

  // One transliterate event per visit, not one per keystroke: the question is
  // "did this visitor use the converter", not "how fast do they type".
  const reported = useRef(false)
  const reportUse = (script: string) => {
    if (reported.current) return
    reported.current = true
    track('transliterate', script)
  }

  const copy = async () => {
    if (!text) return
    await navigator.clipboard.writeText(text)
    track('copy')
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  // Native share sheet where the browser has one (mostly mobile); Telegram's share link elsewhere.
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'
  const share = async () => {
    try {
      await navigator.share({ text, url: SHARE_URL })
    } catch {
      /* user dismissed the share sheet */
    }
  }

  const scriptKey = `script.${detectedScript}` as TranslationKey
  const box = compact ? 'h-28 rounded-xl text-base' : 'h-64 rounded-2xl text-lg'
  // Narrower in the card so Поделиться + Копировать fit side by side on a 320px phone.
  const pad = compact ? 'px-3' : 'px-5'

  const inputLabel = <label htmlFor="converter-input" className="text-sm text-muted">{t('converter.inputLabel')}</label>
  const outputLabel = <label className="text-sm text-muted">{t('converter.outputLabel')}</label>
  const badge = input && (
    <span data-testid="detected-badge" className={compact ? 'text-xs text-muted' : 'ml-3 text-xs text-muted'}>
      {t('converter.detected')}: {t(scriptKey)}
    </span>
  )
  const textarea = (
    <textarea
      id="converter-input"
      className={`mt-3 w-full ${box} border border-black/10 p-4 font-sans outline-none focus:border-black/30`}
      placeholder={compact ? EXAMPLE : t('converter.placeholder')}
      value={input}
      onChange={(e) => {
        const value = e.target.value
        setInput(value)
        // Detect from the new value, not the rendered `detectedScript`, which
        // still reflects the previous keystroke and would report 'foreign'
        // for the very first character typed.
        if (value.trim() !== '') reportUse(detectScript(value))
      }}
    />
  )
  const buttons = (
    <div className="flex items-center gap-2">
      {text && (canShare ? (
        <button type="button" onClick={share} className={`${SECONDARY_BTN} ${pad}`}>{t('converter.share')}</button>
      ) : (
        <a href={telegramShareHref(text)} target="_blank" rel="noopener noreferrer" className={`${SECONDARY_BTN} ${pad}`}>{t('converter.share')}</a>
      ))}
      <button
        onClick={copy}
        className={`rounded-full bg-foreground ${pad} py-2 text-sm text-background transition-transform hover:scale-[1.03]`}
      >
        {copied ? t('converter.copied') : t('converter.copy')}
      </button>
    </div>
  )
  const output = (
    <div
      data-testid="output"
      role="status"
      aria-live="polite"
      aria-label={t('converter.outputLabel')}
      className={`mt-3 w-full ${box} overflow-auto bg-black/[0.03] p-4 font-sans whitespace-pre-wrap`}
    >
      {compact && input === '' ? <span aria-hidden="true" className="text-muted">{EXAMPLE_RESULT}</span> : text}
    </div>
  )

  if (compact) {
    // The note and the Share button appear on typing; beside the labels they
    // wrap on a 360px phone and push the boxes down mid-typing. Here they get
    // fixed-height lines below their box, so nothing on the page moves.
    return (
      <section aria-labelledby="converter-heading" className="mt-12 rounded-xl border border-black/10 p-5">
        <h2 id="converter-heading" className="font-medium text-foreground">{t('converter.heading')}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="min-w-0">
            {inputLabel}
            {textarea}
            <p className="mt-2 h-4 truncate text-xs leading-4">{badge}</p>
          </div>
          <div className="min-w-0">
            {outputLabel}
            {output}
            <div className="mt-3 flex h-10 items-center justify-end whitespace-nowrap">{buttons}</div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="converter" className="max-w-7xl mx-auto px-6 py-24">
      <Reveal className="grid gap-6 md:grid-cols-2">
        <div>
          {inputLabel}
          {badge}
          {textarea}
        </div>
        <div>
          <div className="flex items-center justify-between gap-3">
            {outputLabel}
            {buttons}
          </div>
          {output}
        </div>
      </Reveal>
    </section>
  )
}
