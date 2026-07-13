# Alfavit Browser Extension — Design (Channel 6)

**Date:** 2026-07-14
**Status:** Approved (design)
**Package:** `@alfavit/extension` — `apps/extension` (Manifest V3, Chrome/Edge)

## 1. Purpose

Bring Alfavit into the browser: convert Uzbek text (Cyrillic / old 1995 Latin) to the
reformed new Latin **where people already type** — any page, any input — without visiting
the site. Fully client-side (bundles `@alfavit/engine`), private, offline. Chrome/Edge for
v1; Firefox is a later port.

## 2. Features (v1)

- **Context menu "Convert to new Latin"** (shown when text is selected):
  - Selection inside an **editable field** (`input`/`textarea`/`contenteditable`) → replace
    the selection in place with the converted text.
  - Selection on **read-only** text → copy the converted text to the clipboard and show a
    brief toast ("Copied — new Latin").
- **Toolbar popup** — a small converter: type/paste on top, live new-Latin output below,
  Copy button. Plain TS/DOM (no framework) to keep the bundle tiny.
- Deferred: keyboard shortcut, "convert whole page," Firefox port.

## 3. Architecture

```
apps/extension/
├── manifest.json          # MV3
├── build.mjs              # esbuild: bundle entries → dist/, copy static assets
├── public/
│   ├── popup.html
│   └── icons/{16,48,128}.png   # generated from the Alfavit logo
├── src/
│   ├── convert.ts         # toNewLatin(text): string  = transliterate(text).text  (shared, tested)
│   ├── background.ts      # service worker: create menu, on click convert + inject action
│   ├── inject.ts          # the function injected into the page (replace-in-field / copy+toast)
│   └── popup.ts           # popup mini-converter (imports convert.ts)
└── (build → dist/: manifest.json, background.js, popup.js, popup.html, icons/)
```

- **manifest.json**: `manifest_version: 3`; `permissions: ["contextMenus", "scripting", "activeTab"]`
  (no broad host permissions — `activeTab` grants access to the current tab only on user
  action); `background: { service_worker: "background.js", type: "module" }`;
  `action: { default_popup: "popup.html", default_icon: {…} }`; `icons`.
- **background.ts**: on install, `chrome.contextMenus.create({ id, title: "Convert to new
  Latin", contexts: ["selection"] })`. On click: `converted = toNewLatin(info.selectionText)`,
  then `chrome.scripting.executeScript({ target: { tabId }, func: applyConversion, args:
  [converted] })`. The engine runs in the service worker (bundled); only a converted string
  crosses into the page.
- **inject.ts** (`applyConversion(converted)`): runs in the page. If `document.activeElement`
  is a text input/textarea, splice the converted text over `[selectionStart, selectionEnd]`;
  if contenteditable, `document.execCommand('insertText', false, converted)`; else write to
  `navigator.clipboard` and show a small auto-dismissing toast div. Self-contained (no imports).
- **popup.ts**: wires a textarea → `toNewLatin` → output + Copy button; debounced/instant.

## 4. Build

A small `build.mjs` using **esbuild**: bundle `src/background.ts` and `src/popup.ts`
(`--bundle --format=esm`, engine included) to `dist/`, and copy `manifest.json` +
`public/popup.html` + `public/icons/` into `dist/`. Icons are generated once from the existing
Alfavit logo PNG via `sips` (16/48/128). `pnpm build` → a `dist/` loadable as an unpacked
extension and zippable for the Web Store. `build` is also the type-check (tsc `--noEmit`
alongside, like the bot/api).

## 5. Testing

Extension code is mostly browser-API glue that can't run under Vitest, so:
- **Unit-test the pure core**: `toNewLatin` (`convert.ts`) — Cyrillic and old-Latin inputs
  convert correctly (engine wiring). This is the only logic worth unit-testing.
- **Build check**: `pnpm build` succeeds and emits `dist/manifest.json` + `dist/background.js`
  + `dist/popup.js` + `dist/popup.html`.
- **Manual validation** (documented in a short README): load `dist/` unpacked in Chrome
  (`chrome://extensions` → Developer mode → Load unpacked), select Cyrillic text on a page →
  right-click → Convert; open the popup and convert. The engine's own test suite guarantees
  conversion correctness.

## 6. Deploy / channel card

Not auto-deployed — the Chrome Web Store is a manual submission (multi-day review). CI just
builds + tests the package. The `/apps` "Browser extension" card stays **Coming soon** until
you publish; then we flip it live (as with the bot).

## 7. Out of scope

Firefox/Safari ports; keyboard shortcut; whole-page conversion; options page; sync/settings;
Web Store submission automation; the `source` override (engine auto-detects).
