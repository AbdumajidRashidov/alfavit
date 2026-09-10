# @alfavit/engine

Pure, dependency-free TypeScript engine that converts Uzbek text from **Cyrillic** or the **1995 Latin** alphabet into the **2026 Latin alphabet** (sh→ş, ch→ç, gʻ→ğ, oʻ→ö). It powers [alfavit.uz](https://alfavit.uz), the Telegram bot, the Chrome extension, the macOS app and the public API.

```bash
npm i @alfavit/engine
```

```ts
import { transliterate, detectScript } from '@alfavit/engine'

const r = transliterate('Ўзбекистон шаҳри')
r.text   // 'Özbekiston şahri'
r.flags  // [{ start: 3, end: 4, chosen: 'e', alternatives: ['ye'], reason: 'cyrillic-e-position' }]

detectScript("o'zbek") // 'old-latin'
```

## API

- `transliterate(text, options?) → { text, segments, flags }`
  - `options.source`: `'auto' | 'cyrillic' | 'old-latin'` (default `'auto'`; the script is detected per run of text, so mixed input works)
  - `options.onAmbiguity`: `'first' | 'flag'`
  - `segments`: `{ source, output, script, start, end }[]` — one per run of text; `foreign` runs pass through unchanged
  - `flags`: `{ start, end, chosen, alternatives, reason }[]` — positions where more than one spelling is possible. Reasons include `cyrillic-e-position` (е → e or ye depending on position) and `cyrillic-ts` (ц → s, with c as the alternative)
- `detectScript(text) → 'cyrillic' | 'old-latin' | 'foreign'`
- `version`

## Design notes

Old-Latin input is normalized first: every apostrophe variant used for oʻ/gʻ (ʻ ʼ ' ‘ ’ `) is recognized. Conversion is deterministic and offline — no network, no locale data, no dependencies. ESM only.

Run the tests with `pnpm test`.

## License

MIT © 2026 Abdumajid Rashidov
