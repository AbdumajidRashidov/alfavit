import { useT } from '../i18n/useT'

const API_BASE = 'https://alfavit-api.abdumajidrashidov44.workers.dev'

const CURL = `curl -X POST ${API_BASE}/v1/transliterate \\
  -H "content-type: application/json" \\
  -d '{"text":"Салом дунё"}'`

const RESPONSE = `{
  "text": "salom dunyo",
  "detectedScript": "cyrillic",
  "flags": []
}`

const SDK = `import { createClient } from '@alfavit/sdk'

const alfavit = createClient({ baseUrl: '${API_BASE}' })
const { text } = await alfavit.transliterate('Салом дунё')
// text === 'salom dunyo'`

function Block({ children }: { children: string }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-2xl bg-black/[0.04] p-4 text-sm">
      <code className="font-mono text-foreground whitespace-pre">{children}</code>
    </pre>
  )
}

export function Developers() {
  const { t } = useT()
  return (
    <section id="developers" className="mx-auto max-w-3xl px-6 py-24">
      <h2 className="font-serif text-3xl sm:text-5xl text-foreground">{t('dev.title')}</h2>
      <p className="mt-3 text-sm text-muted">{t('dev.intro')}</p>

      <code
        data-testid="endpoint"
        className="mt-8 block break-all rounded-xl bg-black/[0.04] px-4 py-3 font-mono text-sm text-foreground"
      >
        POST {API_BASE}/v1/transliterate
      </code>

      <Block>{CURL}</Block>
      <p className="mt-6 text-sm font-medium text-muted">{t('dev.responseLabel')}</p>
      <Block>{RESPONSE}</Block>
      <p className="mt-6 text-sm font-medium text-muted">SDK · @alfavit/sdk</p>
      <Block>{SDK}</Block>

      <p className="mt-6 text-xs text-muted">{t('dev.rateLimit')}</p>
    </section>
  )
}
