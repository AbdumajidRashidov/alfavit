# @alfavit/sdk

Zero-dependency client for the free Alfavit transliteration API — Uzbek Cyrillic or old Latin → the 2026 Latin alphabet (ş ç ö ğ). No API key. Limits: 60 requests per minute per IP, 100,000 characters per request.

```bash
npm i @alfavit/sdk
```

```ts
import { createClient } from '@alfavit/sdk'

const alfavit = createClient({ baseUrl: 'https://api.alfavit.uz' })
const { text, detectedScript, flags } = await alfavit.transliterate('салом дунё')
// text === 'salom dunyo', detectedScript === 'cyrillic', flags === []
```

`flags` lists positions where more than one spelling is possible (for example Cyrillic е → e or ye), each with the chosen form and its alternatives.

Pass your own `fetch` (tests, older runtimes) with `createClient({ baseUrl, fetch })`. Non-2xx responses throw an `Error` with the API's message.

Prefer running offline? Use [`@alfavit/engine`](https://www.npmjs.com/package/@alfavit/engine) directly — the same conversion, no network.

## License

MIT © 2026 Abdumajid Rashidov
