# Alfavit

Convert Uzbek text from **Cyrillic** or the **old 1995 Latin** into the reformed
**2026 new Latin** script (`sh→ş`, `ch→ç`, `gʻ→ğ`, `oʻ→ö`).

A Turborepo + pnpm monorepo: one transliteration engine, many channels.

## Packages

| Path | Package | What |
|------|---------|------|
| `packages/engine` | `@alfavit/engine` | Pure, dependency-free TS transliteration engine (Cyrillic / old-Latin → new Latin) with ambiguity flags |
| `apps/web` | `@alfavit/web` | Static Vite + React site: live converter, downloads-style channels, uz/ru/en |
| `apps/bot` | `@alfavit/bot` | grammY Telegram bot: DM + inline conversion (Node long-polling or Cloudflare Workers webhook) |

## Develop

```bash
pnpm install
pnpm turbo run test     # all packages
pnpm turbo run build

pnpm --dir apps/web dev   # web app (http://localhost:5173)
pnpm --dir apps/bot start # bot (needs BOT_TOKEN; see apps/bot/.env)
```

## Deploy

See [docs/deployment.md](docs/deployment.md) — web → Cloudflare Pages, bot → Cloudflare Workers.

Design specs and implementation plans live under [docs/](docs/).
