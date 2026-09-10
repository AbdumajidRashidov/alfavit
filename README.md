# Alfavit

[![CI](https://github.com/AbdumajidRashidov/alfavit/actions/workflows/ci.yml/badge.svg)](https://github.com/AbdumajidRashidov/alfavit/actions/workflows/ci.yml)
[![npm @alfavit/engine](https://img.shields.io/npm/v/@alfavit/engine)](https://www.npmjs.com/package/@alfavit/engine)
[![License: MIT](https://img.shields.io/badge/license-MIT-black)](LICENSE)

Convert Uzbek text from **Cyrillic** or the **1995 Latin** alphabet into the **2026 Latin alphabet** (`sh→ş`, `ch→ç`, `gʻ→ğ`, `oʻ→ö`). Free, on-device, open source.

**Use it:** [alfavit.uz](https://alfavit.uz) · Telegram [@alfavit_uz_bot](https://t.me/alfavit_uz_bot) (works inline in any chat) · [Files](https://alfavit.uz/files) (.docx .txt .srt) · [macOS app](https://alfavit.uz/apps) (converts as you type) · [API & SDK](https://alfavit.uz/developers)

**The reform:** the Legislative Chamber adopted the law on 7 July 2026 and the Senate approved it on 10 September 2026; the alphabet has 28 letters and one apostrophe sign. Details and timeline: [alfavit.uz/reform](https://alfavit.uz/reform).

## Packages

| Path | Package | What |
|------|---------|------|
| `packages/engine` | [`@alfavit/engine`](packages/engine) | Pure, dependency-free TS transliteration engine with ambiguity flags |
| `packages/sdk` | [`@alfavit/sdk`](packages/sdk) | Zero-dependency client for the public API |
| `apps/web` | `@alfavit/web` | Static Vite + React site (vite-react-ssg): converter, files, guides, uz/ru/en |
| `apps/bot` | `@alfavit/bot` | grammY Telegram bot: DM + inline (Cloudflare Workers webhook) |
| `apps/api` | `@alfavit/api` | Hono on Cloudflare Workers: `POST /v1/transliterate`, rate-limited, no key |
| `apps/extension` | `@alfavit/extension` | Chrome/Edge MV3 extension: popup + right-click convert |
| `apps/desktop` | `@alfavit/desktop` | Tauri macOS menu-bar app with live transform |

## Develop

```bash
pnpm install
pnpm turbo run test        # all packages
pnpm turbo run build

pnpm --dir apps/web dev    # http://localhost:5173
pnpm --dir apps/bot start  # needs BOT_TOKEN in apps/bot/.env
```

## Deploy

See [docs/deployment.md](docs/deployment.md) — web → Cloudflare Pages, bot and API → Cloudflare Workers; the macOS `.dmg` is built by the desktop-release workflow and served from the site.

Design specs and implementation plans live under [docs/specs](docs/specs) and [docs/plans](docs/plans); launch material under [docs/marketing](docs/marketing).

## Contributing

Issues and PRs welcome — see [CONTRIBUTING.md](CONTRIBUTING.md). Transliteration rules live in `packages/engine/src/mappings`; every rule change needs a test.

## License

[MIT](LICENSE) © 2026 Abdumajid Rashidov
