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
  - `flags`: `{ start, end, chosen, alternatives, reason }[]` — positions where more than one spelling is possible. Reasons include `cyrillic-e-position` (е → e or ye depending on position) and `cyrillic-ts` (ц → s, with c as the alternative), and `foreign-word`: a word with letters Uzbek doesn't use (w, or a c outside "ch") is left as written, with its converted form offered as the alternative
- `detectScript(text) → 'cyrillic' | 'old-latin' | 'foreign'`
- `version`

## 0.2.1

- Cyrillic е after ҳ, қ and ғ is e, not ye (`ҳеч` → `heç`, was `hyeç`); е after a capital Ъ is ye.
- All-caps Cyrillic words stay all caps when a letter becomes two (`ЁШЛАР` → `YOŞLAR`, was `YoŞLAR`), and so do listed exceptions (`ЦИРК` → `SIRK`).

## 0.2.0

- Web addresses, domains, emails and @handles pass through unchanged (`shahar.uz` no longer becomes `şahar.uz`).
- Words where old-Latin `sh` is s + h — *Ishoq*, *mushaf*, *ashob*, *ishol*, *tashih* — keep the two letters apart, with or without the tutuq and with any suffix.
- Words Uzbek Latin can't spell (a `w`, or a `c` outside `ch`) are left as written and flagged `foreign-word`; an Uzbek suffix after them still converts.
- Old-Latin conversion stays fast on long input (100,000 characters in milliseconds).

## Design notes

Old-Latin input is normalized first: every apostrophe variant used for oʻ/gʻ (ʻ ʼ ' ‘ ’ `) is recognized. Web addresses, domains, emails and @handles pass through unchanged, so `shahar.uz` keeps working. Words from a sourced list where old-Latin `sh` is s + h rather than ş (*Ishoq*, *mushaf*, *ashob*; see `S_H_STEMS` in `src/dictionary.ts`) keep the two letters apart, with or without the tutuq and with any suffix. Conversion is deterministic and offline — no network, no locale data, no dependencies. ESM only.

Run the tests with `pnpm test`.

## License

MIT © 2026 Abdumajid Rashidov
