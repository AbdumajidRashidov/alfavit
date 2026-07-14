import { usePageMeta } from '../i18n/usePageMeta'

const UPDATED = 'July 2026'

export function PrivacyPage() {
  usePageMeta('meta.privacy.title', 'meta.privacy.desc')
  return (
    <section className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="font-serif text-4xl sm:text-6xl text-foreground">Privacy</h1>
      <p className="mt-6 text-lg leading-relaxed text-muted">
        Alfavit is built to work entirely on your device. This policy covers the
        Alfavit browser extension, web app, and API.
      </p>

      <div className="mt-12 space-y-8 leading-relaxed text-foreground">
        <div>
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted">What we collect</h2>
          <p className="mt-3">
            Nothing. The browser extension and web app convert text locally in
            your browser. Your text is never transmitted to a server, stored
            remotely, or shared with third parties. We do not use cookies,
            analytics, or trackers.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted">Extension permissions</h2>
          <p className="mt-3">
            The extension requests <code className="font-mono text-sm">contextMenus</code>,{' '}
            <code className="font-mono text-sm">scripting</code>, and{' '}
            <code className="font-mono text-sm">activeTab</code> solely to add the
            “Convert to new Latin” right-click action and apply the converted text
            to the tab you are actively using. It runs only in response to your
            explicit action and requests no broad access to your browsing.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted">The API</h2>
          <p className="mt-3">
            If you call the public Alfavit API, the text you submit is processed in
            memory to return a conversion and is not logged or retained. Standard,
            non-identifying rate-limit counters are the only state kept.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted">Contact</h2>
          <p className="mt-3">
            Questions? Reach us at{' '}
            <a className="underline" href="mailto:hello@alfavit.uz">hello@alfavit.uz</a>.
          </p>
        </div>
      </div>

      <p className="mt-12 text-sm text-muted">Last updated: {UPDATED}</p>
    </section>
  )
}
