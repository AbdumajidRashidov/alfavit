import { useState } from 'react'
import { useTransliterate } from '../hooks/useTransliterate'
import { useT } from '../i18n/useT'
import { Reveal } from './Reveal'
import type { TranslationKey } from '../i18n/translations'

export function Converter() {
  const { t } = useT()
  const [input, setInput] = useState('')
  const { text, detectedScript } = useTransliterate(input)
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
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
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-muted">{t('converter.outputLabel')}</label>
            <button
              onClick={copy}
              className="rounded-full bg-foreground px-5 py-2 text-sm text-background transition-transform hover:scale-[1.03]"
            >
              {copied ? t('converter.copied') : t('converter.copy')}
            </button>
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
