# Website Desktop Update — Design

**Date:** 2026-07-17
**Status:** Design approved, pending spec review.

## Goal

Announce the shipped macOS desktop app (Phase 2, with system-wide live transform) on alfavit.uz: flip the existing "macOS" channel card from "Coming soon" to a live **Download**, and add a short highlight of the app's standout feature — typing anywhere converts live. Keep it proportional: a data-driven card change plus copy, not a new landing page.

## Context

- The web app (`apps/web`) already renders a `Channels` component ([apps/web/src/components/Channels.tsx](../../apps/web/src/components/Channels.tsx)) used on the `/apps` page. It groups channels (Desktop: macOS, Windows; Mobile: iOS, Android; More: Web, Telegram, Extension, API). The **macOS card already exists** but is marked "Coming soon" (no `live`/`href`).
- The repo is **private**, so a GitHub Release link is not publicly downloadable. Decision (this design): host the `.dmg` on the site itself (Cloudflare Pages static assets).
- i18n lives in `apps/web/src/i18n/translations.ts` with `en`, `uz`, `ru` maps and typed keys. Existing keys include `channels.open`, `channels.mac.name`, `status.soon`.

## Decisions

- **DMG hosting:** on the site — `apps/web/public/download/Alfavit.dmg`, served at `https://alfavit.uz/download/Alfavit.dmg`. Stable filename so the site link never changes; the file is replaced on each new release. Accepts a ~6 MB binary committed to the repo.
- **Build:** the hosted `.dmg` is a **universal** build (Intel `x86_64` + Apple Silicon `aarch64`) so it runs on every Mac.
- **Scope:** download + feature highlight (a card description + "New" badge + an unsigned-app note). No dedicated landing page, no new route.

## Components / changes

### 1. `Channels.tsx` — data-driven card extensions
Extend the `Item` interface with three optional fields:
- `download?: boolean` — when true, render a plain `<a href={href} download>` (static asset) instead of a react-router `Link` (which would 404 through the SPA router).
- `descKey?: TranslationKey` — a one-line muted description rendered under the card name.
- `badge?: 'new'` — a small "New" pill next to the name.

The macOS item becomes:
```
{ nameKey: 'channels.mac.name', Icon: AppleIcon, live: true,
  href: '/download/Alfavit.dmg', download: true,
  descKey: 'channels.mac.desc', badge: 'new' }
```
The download button uses a new label `channels.download` (not `channels.open`). Windows and all other cards are unchanged. Cards without `descKey`/`badge` render exactly as today (uniform grid preserved).

An unsigned-app note (`channels.mac.note`) renders as small muted text on the macOS card so downloaders know about the first-launch Gatekeeper step.

### 2. i18n — new keys in `en`, `uz`, `ru`
- `channels.download`: "Download" / "Yuklab olish" / "Скачать"
- `channels.mac.desc`: EN "Type anywhere — Uzbek Cyrillic or old-Latin converts to new-Latin as you go." (uz/ru drafted; **native-speaker verification required** before merge, consistent with prior content.)
- `channels.badge.new`: "New" / "Yangi" / "Новое"
- `channels.mac.note`: "Unsigned — on first open, right-click the app and choose Open." (uz/ru drafted; native-speaker verification required.)

### 3. Hosted file
`apps/web/public/download/Alfavit.dmg` — the universal `.dmg`. Cloudflare Pages serves `public/` as static assets, so no routing/config change is needed. `_redirects` is unaffected (static file match wins).

### 4. SEO
No new route → sitemap and JSON-LD unchanged. Optionally update the `/apps` page meta description (`meta.apps.desc`) to mention the macOS app. No other SEO changes.

## Prerequisites (execution order)

1. Merge `desktop-live-transform` → `main` (the `.dmg` must be built from final, reviewed code).
2. Build the universal `.dmg` locally (`rustup target add x86_64-apple-darwin`; `tauri build --target universal-apple-darwin`) and copy it to `apps/web/public/download/Alfavit.dmg`.
3. Then make the web changes below.

## Testing

- Update `apps/web/src/tests/Channels.test.tsx` to assert the macOS card is now live and links (via a download anchor) to `/download/Alfavit.dmg`, and that the "New" badge + description render. Other cards' behavior (e.g. Telegram live, Windows "Coming soon") stays asserted/unbroken.
- Full web suite (`pnpm --dir apps/web test`) stays green.
- Assistant verifies in the browser preview: the Channels section shows the macOS card with a Download button, "New" pill, description, and unsigned note; the download link resolves to the static `.dmg`.

## Out of scope / deferred

- Dedicated desktop landing page / homepage hero section / screenshots.
- Windows/iOS/Android channels (stay "Coming soon").
- Code signing / notarization (the download is unsigned; note added).
- Auto-updating the hosted `.dmg` from CI (manual replace per release for now).
- Making the repo public / GitHub Release-based distribution.

## Success criteria

- On alfavit.uz `/apps`, the macOS card shows a working **Download** button (→ `alfavit.uz/download/Alfavit.dmg`), a "New" badge, the live-transform description, and the unsigned-app note, in uz/ru/en.
- The hosted `.dmg` is universal and installs/runs on Apple Silicon and Intel Macs.
- Windows and other "Coming soon" cards are unchanged.
- Web test suite green; native-speaker verification of the uz/ru copy done before merge.
