# Alfavit Telegram Bot — Design (Sub-project 3)

**Date:** 2026-07-10
**Status:** Approved (design)
**Package:** `@alfavit/bot` — `apps/bot` in the monorepo

## 1. Purpose

A Telegram bot that converts Uzbek text (Cyrillic or old 1995 Latin) to the reformed
new Latin script, meeting people where they already write. Telegram is the dominant
platform in Uzbekistan, so this is the platform's highest-reach channel. The engine
does all linguistic work; the bot is a thin, well-tested shell over `@alfavit/engine`.

## 2. Interaction modes

- **DM (direct message):** any text message → reply with its new-Latin conversion. The
  engine auto-detects Cyrillic vs old-Latin. `/start` and `/help` return a short
  localized intro.
- **Inline (flagship):** `@alfavitbot <text>` typed in *any* chat returns one inline
  result — title "New Latin", a converted preview as the description — that inserts the
  converted text into the message when tapped. Empty query returns a gentle hint result.

The conversion is language-agnostic (it always converts Uzbek text); only the bot's
chrome (start/help/labels) is localized.

## 3. Architecture

A thin grammY shell; all logic in pure, testable functions.

```
apps/bot/
├── package.json          # @alfavit/bot; deps: grammy, @alfavit/engine (workspace:*)
├── tsconfig.json
├── vitest.config.ts
└── src/
    ├── handlers.ts       # PURE — no token, no network:
    │                     #   handleMessage(text: string, locale: Locale): string
    │                     #   buildInlineResults(query: string, locale: Locale): InlineResult[]
    ├── i18n.ts           # bot chrome strings (uz/ru/en) + pickLocale(language_code?)
    ├── bot.ts            # createBot(token): grammY wiring routing updates → handlers
    ├── index.ts          # entry: read BOT_TOKEN, createBot, bot.start() (long-polling)
    └── tests/
```

- **`handlers.ts`** holds all behavior as pure functions of `(input, locale)`. This is the
  crown of the bot's testability: no Telegram, no token, no I/O.
- **`i18n.ts`**: `type Locale = 'uz' | 'ru' | 'en'`; `pickLocale(code?: string): Locale`
  (Telegram `language_code` prefix among uz/ru/en, default uz); a `strings` record.
- **`bot.ts`**: `createBot(token: string): Bot` registers `/start`, `/help`, the message
  handler, and the inline-query handler — each a one-line adapter that reads the update,
  calls a pure handler, and replies.
- **`index.ts`**: reads `BOT_TOKEN`; if absent, logs a clear error and exits non-zero;
  otherwise `createBot(token).start()`.

## 4. Behavior details

- **Auto-detection:** the engine's `detectScript`/`transliterate` handle Cyrillic and
  old-Latin transparently; the bot never asks the user to choose.
- **Best-effort output (v1):** the engine returns ambiguity flags, but the bot sends the
  best-effort converted text without interactive toggling. (Future enhancement.)
- **Locale:** `pickLocale(ctx.from?.language_code)` for chrome; conversion unaffected.
- **Limits:** input longer than a safe cap (4000 chars, under Telegram's 4096 message
  limit) is truncated before conversion; inline preview description is trimmed to a short
  length. Empty/whitespace input → a hint (inline) or the help nudge (DM).
- **Foreign text:** passes through unchanged (engine behavior), which is correct.

## 5. Runtime & configuration

- **Long-polling** by default (`bot.start()`) — no public URL required; runs anywhere.
- **Webhook** is the eventual production option; noted, not built in v1.
- **`BOT_TOKEN`** env var, obtained from @BotFather. Never committed. Tests never use it.

## 6. Testing (Vitest, no network/token)

- `handlers.ts`:
  - `handleMessage('салом', 'uz') === 'salom'`; old-Latin input converts; foreign passes
    through; empty input returns the localized hint.
  - `buildInlineResults('чой', 'uz')` returns one result whose sent message content is
    `çoy`; empty query returns a single hint result.
  - Long input is truncated to the cap.
- `i18n.ts`: `pickLocale('ru-RU') === 'ru'`, `pickLocale('de') === 'uz'`,
  `pickLocale(undefined) === 'uz'`; `strings` has identical keys across locales.
- `bot.ts`/`index.ts`: not unit-tested against live Telegram; `createBot` is exercised
  only to confirm it constructs without throwing given a dummy token (no `.start()`).

## 7. Out of scope (YAGNI)

- Ambiguity-flag toggling / inline keyboards.
- File/document conversion (belongs to the Pro tier).
- Webhooks, analytics, group-admin features, rate limiting beyond length caps.
