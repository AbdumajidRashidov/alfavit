import type { SourceScript, AmbiguityFlag } from '@alfavit/engine'

export type Source = 'auto' | 'cyrillic' | 'old-latin'

export interface TransliterateResult {
  text: string
  detectedScript: SourceScript
  flags: AmbiguityFlag[]
}

export interface ClientOptions {
  baseUrl: string
  fetch?: typeof fetch
}

export function createClient({ baseUrl, fetch: fetchImpl = fetch }: ClientOptions) {
  const base = baseUrl.replace(/\/$/, '')
  return {
    async transliterate(text: string, opts?: { source?: Source }): Promise<TransliterateResult> {
      const res = await fetchImpl(`${base}/v1/transliterate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(opts?.source ? { text, source: opts.source } : { text }),
      })
      const data = (await res.json()) as TransliterateResult & { error?: string }
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      return data
    },
  }
}
