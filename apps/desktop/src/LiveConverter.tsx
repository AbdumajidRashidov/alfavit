import { useState } from 'react'
import { transliterate, detectScript } from '@alfavit/engine'
import { scriptLabel } from './scriptLabel'

/** The panel body: type/paste Uzbek text, see reformed new-Latin live. */
export function LiveConverter() {
  const [input, setInput] = useState('')
  const [copied, setCopied] = useState(false)

  // Conversion is synchronous and cheap; run it on every render (no debounce
  // needed for a single textarea). Empty input stays empty.
  const output = input ? transliterate(input).text : ''

  async function copy() {
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      // Clipboard can reject (denied permission / not focused); ignore rather
      // than surface an unhandled rejection — just skip the "Copied" state.
    }
  }

  return (
    <div className="converter">
      <textarea
        autoFocus
        className="input"
        aria-label="Uzbek text input"
        placeholder="Matn kiriting…"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <div className="meta">
        {input ? (
          <span data-testid="detected-badge" className="badge">
            {scriptLabel(detectScript(input))}
          </span>
        ) : (
          <span className="badge badge--empty" aria-hidden="true" />
        )}
        <button className="copy" onClick={copy} disabled={!output}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      {output ? (
        <output data-testid="output" className="output">
          {output}
        </output>
      ) : (
        <p className="hint">Type or paste Cyrillic or old-Latin Uzbek text.</p>
      )}
    </div>
  )
}
