# @alfavit/extension

Browser extension (Chrome / Edge, Manifest V3) that converts Uzbek text from
Cyrillic or old Latin to the reformed new Latin script — via a toolbar popup and
a right-click context-menu action on any selected text.

## Build

```bash
pnpm -C apps/extension build
```

Emits `dist/` containing `manifest.json`, `background.js`, `popup.js`,
`popup.html`, and `icons/`.

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

## Publishing

Not auto-deployed. Chrome Web Store submission is a manual step; the web app's
`/apps` "Browser extension" card stays "Coming soon" until published.
