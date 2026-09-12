import { Seo } from '../components/Seo'

const UPDATED = 'July 2026'

export function PrivacyPage() {
  return (
    <>
      <Seo titleKey="meta.privacy.title" descKey="meta.privacy.desc" pagePath="privacy" breadcrumb />
      <section className="mx-auto max-w-3xl px-6 py-24">
        <h1 className="font-serif text-4xl sm:text-6xl text-foreground">Privacy</h1>
        <p className="mt-6 text-lg leading-relaxed text-muted">
          Alfavit is built to work entirely on your device. This policy covers the
          Alfavit browser extension, web app, and API.
        </p>

        <div className="mt-12 space-y-8 leading-relaxed text-foreground">
          <div>
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted">Your text</h2>
            <p className="mt-3">
              Conversion happens entirely in your browser. Your text is never
              transmitted to a server, stored, or shared with third parties — the
              browser extension and web app both convert on your device, and the
              browser extension collects nothing.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted">Analytics</h2>
            <p className="mt-3">
              The Alfavit website uses Cloudflare Web Analytics to count page views
              and see which pages are useful. It is cookieless, collects no personal
              data, does not fingerprint your device, and does not track you across
              other sites. We run no advertising and no other third-party trackers.
            </p>
            <p className="mt-3">
              We also count a few actions on this site ourselves — that a page was
              viewed, that a conversion happened, that a file was converted, that an
              installer was downloaded, that a link out was clicked. These are counts
              only. The text you type is never sent, never stored, and never leaves
              your browser. There are no cookies, and no identifier that follows you
              from one day to the next.
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
    </>
  )
}
