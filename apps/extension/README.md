# @alfavit/extension

Browser extension (Chrome / Edge, Manifest V3) that converts Uzbek text from
Cyrillic or old Latin to the reformed new Latin script — via a toolbar popup and
a right-click context-menu action on any selected text.

## Build

```bash
pnpm -C apps/extension build
```

Emits `dist/` containing `manifest.json`, `background.js`, `popup.js`,
`popup.html`, `icons/`, and `_locales/`.

## Load unpacked (development)

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right)
3. Click **Load unpacked** and select `apps/extension/dist`

## How it works

- **Popup** — click the toolbar icon, type, and copy the converted text.
- **Context menu** — select text on any page, right-click → *Convert to new
  Latin*. If the selection is inside an editable field, it's replaced in place;
  otherwise the converted text is copied to your clipboard.

Conversion is fully on-device via `@alfavit/engine`. No network, no tracking.

## Languages

Strings live in `public/_locales/{en,uz,ru}/messages.json`; uz and ru entries
marked UNVERIFIED in their `description` still need a native-speaker check.

- **Menu, popup, and page toast** follow Chrome's *Preferred languages*
  (`chrome.i18n.getAcceptLanguages()`, set at `chrome://settings/languages`):
  the first entry whose base language is uz, ru, or en wins, so Uzbek listed
  below Russian gives Russian. With none of the three listed, `chrome.i18n`
  decides. `src/i18n.ts` bundles the same `_locales` files, so they stay the
  only copy of the strings.
- **Store name and description** (`__MSG_…__` in the manifest) can only follow
  the browser's UI language. Desktop Chrome has no Uzbek UI language, so there
  Uzbek speakers see them in Russian or English.

The menu title is set at install and update, refreshed when Chrome starts, and
refreshed after each use. A change to the language list therefore shows in the
menu after a Chrome restart or after one more right-click conversion; the popup
picks it up the next time it opens.

## Publishing

Not auto-deployed. Chrome Web Store submission is a manual step; the web app's
`/apps` "Browser extension" card stays "Coming soon" until published.
