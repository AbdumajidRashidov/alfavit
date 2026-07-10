# Alfavit Telegram Bot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `@alfavit/bot` (`apps/bot`) — a grammY Telegram bot that converts Uzbek Cyrillic / old-Latin text to the reformed new Latin via `@alfavit/engine`, in both DM and inline modes.

**Architecture:** A thin grammY shell. All behavior lives in pure functions in `handlers.ts` (`update → reply`), unit-tested with no token and no network. `bot.ts` routes grammY updates into those handlers; `index.ts` reads `BOT_TOKEN` and starts long-polling.

**Tech Stack:** Node 20+, TypeScript (strict), grammY, Vitest. Runtime dep: `grammy` + `@alfavit/engine`.

## Global Constraints

- Package: `@alfavit/bot`, private, in `apps/bot`. Depends on `@alfavit/engine` via `"@alfavit/engine": "workspace:*"`. TypeScript `strict: true`, ESM, target ES2022.
- All logic in pure functions in `handlers.ts`; `bot.ts` is a thin adapter. Tests never use a real token or network.
- Locales `uz | ru | en`; `pickLocale(code?)` maps a Telegram `language_code` prefix to a locale, default **uz**. Conversion itself is language-agnostic (always converts Uzbek text).
- Input capped at **4000** chars before conversion (under Telegram's 4096 message limit). Empty/whitespace input → localized hint.
- Runtime: long-polling via `bot.start()`. `BOT_TOKEN` from env; missing → `index.ts` logs a clear error and exits non-zero.
- Vitest environment: node (default). Tests in `apps/bot/src/tests/`.
- TDD: failing test first, watch it fail, minimal implementation, watch it pass, commit.

---

### Task 1: Scaffold apps/bot + engine wiring

**Files:**
- Create: `apps/bot/package.json`, `apps/bot/tsconfig.json`, `apps/bot/vitest.config.ts`
- Create: `apps/bot/src/tests/engine-wiring.test.ts`

**Interfaces:**
- Consumes: `transliterate` from `@alfavit/engine`.
- Produces: a working Vitest harness proving the engine is importable in this package.

- [ ] **Step 1: Create manifests**

`apps/bot/package.json`:
```json
{
  "name": "@alfavit/bot",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js",
    "build": "tsc -p tsconfig.json",
    "test": "vitest run"
  },
  "dependencies": {
    "@alfavit/engine": "workspace:*",
    "grammy": "^1.30.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.5.0",
    "vitest": "^2.0.0",
    "tsx": "^4.19.0"
  }
}
```

`apps/bot/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src",
    "types": ["node"],
    "skipLibCheck": true
  },
  "include": ["src"],
  "exclude": ["**/*.test.ts"]
}
```

`apps/bot/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { include: ['src/**/*.test.ts'] } })
```

- [ ] **Step 2: Write the failing test**

`apps/bot/src/tests/engine-wiring.test.ts`:
```ts
import { expect, test } from 'vitest'
import { transliterate } from '@alfavit/engine'

test('engine is importable and converts', () => {
  expect(transliterate('салом').text).toBe('salom')
})
```

- [ ] **Step 3: Install and run to verify**

Run from repo root: `pnpm install`
Then from `apps/bot`: `pnpm test`
Expected: PASS. (If a pinned version is missing from the registry, relax that one dep to the nearest available and note it.)

- [ ] **Step 4: Verify build**

Run from `apps/bot`: `pnpm build`
Expected: succeeds (emits `dist/`). There is no source yet besides tests (excluded), so `tsc` should succeed with no emit errors; if `tsc` errors because there are no input files, add `src/index.ts` with a single line `export {}` and rerun — it will be replaced in Task 4.

- [ ] **Step 5: Commit**

```bash
git add apps/bot pnpm-lock.yaml
git commit -m "chore(bot): scaffold @alfavit/bot (grammY + Vitest)"
```

---

### Task 2: i18n — locale detection + bot strings

**Files:**
- Create: `apps/bot/src/i18n.ts`
- Create: `apps/bot/src/tests/i18n.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type Locale = 'uz' | 'ru' | 'en'`
  - `function pickLocale(code?: string): Locale` — first-2-chars of `code` if in the set, else `'uz'`.
  - `interface Strings { start: string; help: string; inlineTitle: string; inlineEmptyTitle: string; emptyHint: string }`
  - `const strings: Record<Locale, Strings>`

- [ ] **Step 1: Write the failing test**

`apps/bot/src/tests/i18n.test.ts`:
```ts
import { expect, test } from 'vitest'
import { pickLocale, strings, type Locale } from '../i18n'

test('pickLocale maps language codes, defaults to uz', () => {
  expect(pickLocale('ru-RU')).toBe('ru')
  expect(pickLocale('en-GB')).toBe('en')
  expect(pickLocale('uz')).toBe('uz')
  expect(pickLocale('de')).toBe('uz')
  expect(pickLocale(undefined)).toBe('uz')
})

test('all locales expose the same string keys', () => {
  const locales: Locale[] = ['uz', 'ru', 'en']
  const keysOf = (l: Locale) => Object.keys(strings[l]).sort().join(',')
  expect(keysOf('ru')).toBe(keysOf('uz'))
  expect(keysOf('en')).toBe(keysOf('uz'))
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test src/tests/i18n.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`apps/bot/src/i18n.ts`:
```ts
export type Locale = 'uz' | 'ru' | 'en'

const LOCALES: Locale[] = ['uz', 'ru', 'en']

export function pickLocale(code?: string): Locale {
  const prefix = (code ?? '').slice(0, 2)
  return (LOCALES as string[]).includes(prefix) ? (prefix as Locale) : 'uz'
}

export interface Strings {
  start: string
  help: string
  inlineTitle: string
  inlineEmptyTitle: string
  emptyHint: string
}

export const strings: Record<Locale, Strings> = {
  uz: {
    start: 'Salom! Menga kirill yoki eski lotinda matn yuboring — yangi lotin yozuviga oʻgirib beraman. Istalgan chatda @alfavitbot deb yozib, ichki rejimda ham foydalaning.',
    help: 'Matn yuboring — men uni 2026-yilgi yangi lotin alifbosiga oʻgiraman. Ichki rejim: istalgan chatda "@alfavitbot matn".',
    inlineTitle: 'Yangi lotin',
    inlineEmptyTitle: 'Oʻgirish uchun matn yozing',
    emptyHint: 'Oʻzbekcha matn yuboring — yangi lotin yozuviga oʻgiraman.',
  },
  ru: {
    start: 'Привет! Отправьте мне текст на кириллице или старой латинице — верну в новой латинице. Также работает в любом чате: наберите @alfavitbot текст.',
    help: 'Отправьте текст — я конвертирую его в новую латиницу 2026 года. Инлайн-режим: в любом чате «@alfavitbot текст».',
    inlineTitle: 'Новая латиница',
    inlineEmptyTitle: 'Введите текст для конвертации',
    emptyHint: 'Отправьте узбекский текст — верну его в новой латинице.',
  },
  en: {
    start: 'Hi! Send me Uzbek text in Cyrillic or old Latin and I will convert it to the new Latin script. It also works inline — type @alfavitbot text in any chat.',
    help: 'Send text and I convert it to the reformed 2026 Latin script. Inline: type "@alfavitbot text" in any chat.',
    inlineTitle: 'New Latin',
    inlineEmptyTitle: 'Type text to convert',
    emptyHint: 'Send Uzbek text and I will convert it to the new Latin script.',
  },
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm test src/tests/i18n.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/bot/src/i18n.ts apps/bot/src/tests/i18n.test.ts
git commit -m "feat(bot): locale detection and localized bot strings"
```

---

### Task 3: Pure handlers (DM + inline)

**Files:**
- Create: `apps/bot/src/handlers.ts`
- Create: `apps/bot/src/tests/handlers.test.ts`

**Interfaces:**
- Consumes: `transliterate` (`@alfavit/engine`), `strings`/`Locale` (`./i18n`), `InlineQueryResultBuilder` (`grammy`).
- Produces:
  - `const MAX_INPUT = 4000`
  - `function handleMessage(text: string, locale: Locale): string` — trims to `MAX_INPUT`; empty/whitespace → `strings[locale].emptyHint`; else the converted text.
  - `function buildInlineResults(query: string, locale: Locale): InlineQueryResult[]` — empty query → one hint article; else one article titled `strings[locale].inlineTitle`, description = converted preview (≤100 chars), whose sent message text is the full converted text.

- [ ] **Step 1: Write the failing test**

`apps/bot/src/tests/handlers.test.ts`:
```ts
import { expect, test } from 'vitest'
import { handleMessage, buildInlineResults, MAX_INPUT } from '../handlers'

test('handleMessage converts Cyrillic', () => {
  expect(handleMessage('салом дунё', 'uz')).toBe('salom dunyo')
})

test('handleMessage converts old-Latin', () => {
  expect(handleMessage("o'zbek", 'uz')).toBe('ŏzbek')
})

test('handleMessage returns the hint for empty input', () => {
  expect(handleMessage('   ', 'en')).toBe('Send Uzbek text and I will convert it to the new Latin script.')
})

test('handleMessage caps very long input', () => {
  const out = handleMessage('а'.repeat(MAX_INPUT + 500), 'uz')
  expect(out.length).toBeLessThanOrEqual(MAX_INPUT)
})

test('buildInlineResults converts the query into the sent message', () => {
  const results = buildInlineResults('чой', 'uz')
  expect(results).toHaveLength(1)
  expect((results[0] as { input_message_content: { message_text: string } }).input_message_content.message_text).toBe('çoy')
})

test('buildInlineResults returns a single hint for an empty query', () => {
  const results = buildInlineResults('', 'en')
  expect(results).toHaveLength(1)
  expect((results[0] as { title: string }).title).toBe('Type text to convert')
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test src/tests/handlers.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`apps/bot/src/handlers.ts`:
```ts
import { InlineQueryResultBuilder } from 'grammy'
import type { InlineQueryResult } from 'grammy/types'
import { transliterate } from '@alfavit/engine'
import { strings, type Locale } from './i18n'

export const MAX_INPUT = 4000

export function handleMessage(text: string, locale: Locale): string {
  const capped = text.slice(0, MAX_INPUT)
  if (!capped.trim()) return strings[locale].emptyHint
  return transliterate(capped).text
}

export function buildInlineResults(query: string, locale: Locale): InlineQueryResult[] {
  const capped = query.slice(0, MAX_INPUT)
  if (!capped.trim()) {
    const hint = strings[locale].emptyHint
    return [InlineQueryResultBuilder.article('empty', strings[locale].inlineEmptyTitle, { description: hint }).text(hint)]
  }
  const converted = transliterate(capped).text
  const preview = converted.slice(0, 100)
  return [InlineQueryResultBuilder.article('convert', strings[locale].inlineTitle, { description: preview }).text(converted)]
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm test src/tests/handlers.test.ts`
Expected: PASS (6 tests). If the `grammy/types` import path errors, change it to `import type { InlineQueryResult } from 'grammy'` (grammY re-exports the types) and rerun.

- [ ] **Step 5: Commit**

```bash
git add apps/bot/src/handlers.ts apps/bot/src/tests/handlers.test.ts
git commit -m "feat(bot): pure DM and inline conversion handlers"
```

---

### Task 4: grammY wiring + entrypoint

**Files:**
- Create: `apps/bot/src/bot.ts`
- Create: `apps/bot/src/index.ts` (replaces the Task 1 placeholder if present)
- Create: `apps/bot/src/tests/bot.test.ts`

**Interfaces:**
- Consumes: `handleMessage`/`buildInlineResults` (`./handlers`), `pickLocale`/`strings` (`./i18n`), `Bot` (`grammy`).
- Produces: `function createBot(token: string): Bot` — a configured bot (handlers registered, not started). `index.ts` is the runnable entrypoint.

- [ ] **Step 1: Write the failing test**

`apps/bot/src/tests/bot.test.ts`:
```ts
import { expect, test } from 'vitest'
import { Bot } from 'grammy'
import { createBot } from '../bot'

test('createBot builds a configured Bot without starting or network', () => {
  const bot = createBot('123456:dummy-token-for-construction')
  expect(bot).toBeInstanceOf(Bot)
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test src/tests/bot.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement bot.ts**

`apps/bot/src/bot.ts`:
```ts
import { Bot } from 'grammy'
import { handleMessage, buildInlineResults } from './handlers'
import { pickLocale, strings } from './i18n'

export function createBot(token: string): Bot {
  const bot = new Bot(token)

  // Commands are registered BEFORE the text handler so a "/start" message is
  // handled here and does not fall through to the conversion handler.
  bot.command('start', (ctx) => ctx.reply(strings[pickLocale(ctx.from?.language_code)].start))
  bot.command('help', (ctx) => ctx.reply(strings[pickLocale(ctx.from?.language_code)].help))

  bot.on('inline_query', (ctx) =>
    ctx.answerInlineQuery(buildInlineResults(ctx.inlineQuery.query, pickLocale(ctx.from?.language_code)), { cache_time: 0 }),
  )

  bot.on('message:text', (ctx) => {
    if (ctx.message.text.startsWith('/')) return // ignore other commands
    return ctx.reply(handleMessage(ctx.message.text, pickLocale(ctx.from?.language_code)))
  })

  return bot
}
```

- [ ] **Step 4: Implement index.ts**

`apps/bot/src/index.ts`:
```ts
import { createBot } from './bot'

const token = process.env.BOT_TOKEN
if (!token) {
  console.error('BOT_TOKEN is not set. Create a bot with @BotFather and set BOT_TOKEN.')
  process.exit(1)
}

const bot = createBot(token)
console.log('Alfavit bot starting (long polling)…')
void bot.start()
```

- [ ] **Step 5: Run tests + build**

Run from `apps/bot`: `pnpm test`
Expected: ALL tests pass (engine-wiring + i18n + handlers + bot).
Then: `pnpm build`
Expected: `tsc` succeeds, emits `dist/` including `index.js`, `bot.js`, `handlers.js`, `i18n.js`.

- [ ] **Step 6: Commit**

```bash
git add apps/bot/src/bot.ts apps/bot/src/index.ts apps/bot/src/tests/bot.test.ts
git commit -m "feat(bot): grammY wiring, entrypoint, long-polling startup"
```

---

## Self-Review Notes

- **Spec coverage:** engine wiring (Task 1); locale detection + strings (Task 2); DM + inline pure handlers, cap, empty hint (Task 3); grammY commands/message/inline wiring + BOT_TOKEN entrypoint + long-polling (Task 4). Out-of-scope items (ambiguity toggles, file conversion, webhooks) correctly excluded.
- **Command/message ordering:** commands registered before `message:text`, plus a `startsWith('/')` guard, so `/start` is not double-handled — documented in Task 4.
- **No token/network in tests:** `createBot` is constructed with a dummy token and never `.start()`ed; handlers are pure. Verified by the test designs.
- **Type consistency:** `handleMessage(text, locale) → string`, `buildInlineResults(query, locale) → InlineQueryResult[]`, `pickLocale(code?) → Locale`, `createBot(token) → Bot`, `MAX_INPUT = 4000`, `Strings` keys all used consistently across tasks. Fallback import note for `grammy/types` included in Task 3.
