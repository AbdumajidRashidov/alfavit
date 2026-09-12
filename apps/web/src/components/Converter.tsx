import { useState, useRef } from 'react'
import { detectScript } from '@alfavit/engine'
import { useTransliterate } from '../hooks/useTransliterate'
import { track } from '../analytics/track'
import { useT } from '../i18n/useT'
import { Reveal } from './Reveal'
import type { TranslationKey } from '../i18n/translations'

/** Shared from the in-product share button, so medium is `button` — `telegram`
 * is a utm_source, never a utm_medium. See docs/marketing/README.md:20-22. */
export const SHARE_URL = 'https://alfavit.uz/?utm_source=share&utm_medium=button&utm_campaign=senate-2026-09'
const SECONDARY_BTN = 'rounded-full border border-black/15 px-5 py-2 text-sm text-foreground transition-colors hover:border-black/40'

/** Telegram's share endpoint: pre-fills a message with the converted text + our link. */
export function telegramShareHref(text: string): string {
  return `https://t.me/share/url?url=${encodeURIComponent(SHARE_URL)}&text=${encodeURIComponent(text)}`
}

export function Converter() {
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

  return (
    <section id="converter" className="max-w-7xl mx-auto px-6 py-24">
      <Reveal className="grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="converter-input" className="text-sm text-muted">{t('converter.inputLabel')}</label>
          {input && (
            <span data-testid="detected-badge" className="ml-3 text-xs text-muted">
              {t('converter.detected')}: {t(scriptKey)}
            </span>
          )}
          <textarea
            id="converter-input"
            className="mt-3 w-full h-64 rounded-2xl border border-black/10 p-4 font-sans text-lg outline-none focus:border-black/30"
            placeholder={t('converter.placeholder')}
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
        </div>
        <div>
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm text-muted">{t('converter.outputLabel')}</label>
            <div className="flex items-center gap-2">
              {text && (canShare ? (
                <button type="button" onClick={share} className={SECONDARY_BTN}>{t('converter.share')}</button>
              ) : (
                <a href={telegramShareHref(text)} target="_blank" rel="noopener noreferrer" className={SECONDARY_BTN}>{t('converter.share')}</a>
              ))}
              <button
                onClick={copy}
                className="rounded-full bg-foreground px-5 py-2 text-sm text-background transition-transform hover:scale-[1.03]"
              >
                {copied ? t('converter.copied') : t('converter.copy')}
              </button>
            </div>
          </div>
          <div
            data-testid="output"
            role="status"
            aria-live="polite"
            aria-label={t('converter.outputLabel')}
            className="mt-3 w-full h-64 overflow-auto rounded-2xl bg-black/[0.03] p-4 font-sans text-lg whitespace-pre-wrap"
          >
            {text}
          </div>
        </div>
      </Reveal>
    </section>
  )
}
