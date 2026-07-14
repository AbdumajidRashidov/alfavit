# Privacy-Respecting Analytics

**Date:** 2026-07-15
**Status:** Design approved. Small change — implemented directly (no separate plan/SDD).

## Goal

Measure organic/SEO traffic to the Alfavit web app with analytics that don't contradict the site's privacy-first positioning, and correct the privacy page to describe it honestly.

## Decisions

- **Provider:** Cloudflare Web Analytics — free, cookieless, no fingerprinting, aggregate-only, no cross-site tracking, no consent banner required. Native (site is on Cloudflare).
- **Integration:** dashboard auto-inject (Option A) — enabled in the Cloudflare dashboard for the `alfavit.uz` zone; Cloudflare injects the beacon at the edge. **Zero code, no repo change, no new dependency.** This is a user dashboard action, not a code change.
- **Scope:** web app only. The browser extension and API are unaffected and keep their zero-collection promise.

## The only code change: `/privacy` copy

`apps/web/src/pages/PrivacyPage.tsx` is a static **English-only** page (not localized — unchanged by this work). Its "What we collect" section currently states *"We do not use cookies, analytics, or trackers,"* which becomes inaccurate once analytics is on.

Rework it to:
- **Keep the text-privacy promise intact and explicit:** conversion happens entirely in the browser; your text is never transmitted, stored, or shared.
- **Keep the extension's zero-collection promise explicit:** the browser extension collects nothing.
- **Add an honest "Analytics" statement (web app only):** the website uses Cloudflare Web Analytics — cookieless, no personal data, no fingerprinting, no cross-site tracking, no advertising/third-party trackers.

No other claim changes. The FAQ answer "your text is never uploaded, stored, or tracked" stays (it is scoped to the user's text, which analytics never touches).

## Out of scope

- Localizing the privacy page (it's English-only today; a separate task if wanted).
- Any in-repo beacon/script (Option B) — not used.
- Analytics for the extension or API.

## Success criteria

- `/privacy` accurately describes cookieless web analytics while preserving the text- and extension-privacy promises; no false "no analytics" claim remains.
- No new dependency; build + tests still green.
- (User) Cloudflare Web Analytics enabled for `alfavit.uz` in the dashboard.
