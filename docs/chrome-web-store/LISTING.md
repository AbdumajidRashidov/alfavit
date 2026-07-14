# Chrome Web Store listing — Alfavit

Everything you paste into the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) when submitting `alfavit-extension-v0.1.0.zip`.

---

## Store listing tab

**Item name** (≤ 45 chars)
```
Alfavit — new Uzbek Latin
```

**Summary** (≤ 132 chars, shown in search results)
```
Convert Uzbek text from Cyrillic or old Latin to the reformed 2026 new Latin script — instantly, on-device, in any browser tab.
```

**Description** (detailed, shown on the listing page)
```
Alfavit converts Uzbek text into the reformed 2026 new Latin alphabet — sh → ş, ch → ç, gʻ → ğ, oʻ → ŏ, and loanword ts → c — directly in your browser.

Two ways to use it:

• Popup — click the toolbar icon, type or paste text, and copy the converted result.
• Right-click — select any text on any page and choose "Convert to new Latin." If the selection is inside an editable field, it's replaced in place; otherwise the converted text is copied to your clipboard.

Alfavit understands both source scripts automatically:
• Cyrillic (Ўзбекча → Ŏzbekça)
• Old 1995 Latin (oʻzbek → ŏzbek)

Everything runs on your device. No account, no network requests, no tracking — your text never leaves the browser.

Part of the Alfavit platform, which also offers a web app, a Telegram bot, file conversion, and a public API.
```

**Category:** Productivity
**Language:** English (with Uzbek/Russian UI text in-product)

---

## Privacy tab

**Single purpose** (required)
```
Alfavit converts Uzbek text from Cyrillic or old Latin script into the reformed new Latin script, via a toolbar popup and a right-click context-menu action.
```

**Permission justifications**

- **contextMenus** — Adds the "Convert to new Latin" item to the right-click menu so users can convert selected text on any page.
- **scripting** — After a context-menu click, injects a small function into the active tab to replace the selected text in an editable field (or copy it to the clipboard). Runs only in response to that explicit user action.
- **activeTab** — Grants temporary access to the current tab when the user invokes the context-menu action, so the conversion can be applied to the text they selected. No broad host permissions are requested.

**Data usage disclosures**
- Does the extension collect user data? **No.**
- Conversion happens entirely on-device; no data is transmitted, stored remotely, or shared. Check all "does not collect / does not sell / does not use for unrelated purposes" certifications.

**Privacy policy URL**
```
https://alfavit-web.pages.dev/privacy
```
> A minimal privacy page is required because we declare a single purpose. See `PRIVACY.md` in this folder for the copy — publish it at the URL above (a `/privacy` route in the web app) before submitting.

---

## Assets

| Asset | Requirement | File |
|-------|-------------|------|
| Package | .zip, manifest at root | `alfavit-extension-v0.1.0.zip` |
| Store icon | 128×128 PNG | `../../apps/extension/public/icons/128.png` |
| Screenshot(s) | 1280×800 PNG, ≥1 required | `screenshots/01-popup.png`, `screenshots/02-context-menu.png` |
| Small promo tile | 440×280 PNG (optional) | `screenshots/promo-440x280.png` |

---

## Submission checklist

- [ ] Create a Chrome Web Store developer account ($5 one-time fee)
- [ ] Publish the privacy page at `https://alfavit-web.pages.dev/privacy`
- [ ] Upload `alfavit-extension-v0.1.0.zip`
- [ ] Paste name, summary, description (above)
- [ ] Upload store icon + screenshots
- [ ] Fill single purpose + permission justifications + data disclosures
- [ ] Set category = Productivity, visibility = Public
- [ ] Submit for review (typically a few days)
- [ ] On approval: flip the `channels.extension` card in `apps/web/src/components/Channels.tsx` to `live: true` with the Web Store `href`
```
