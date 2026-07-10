// Types are inlined (not imported from @alfavit/engine) so the SDK is a truly
// standalone, zero-dependency, publishable package. They mirror the API's
// response contract.
export type SourceScript = 'cyrillic' | 'old-latin' | 'foreign'

export interface AmbiguityFlag {
  start: number
  end: number
  chosen: string
  alternatives: string[]
  reason: string
}

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
  const base = baseUrl.replace(/\/+$/, '')
  return {
    async transliterate(text: string): Promise<TransliterateResult> {
      const res = await fetchImpl(`${base}/v1/transliterate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = (await res.json().catch(() => ({}))) as TransliterateResult & { error?: string }
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      return data
    },
  }
}
