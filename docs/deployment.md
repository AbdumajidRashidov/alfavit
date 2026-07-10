# Alfavit — Deployment (all on Cloudflare)

Two deployables, two Cloudflare products:

- **Web app** (`apps/web`, static SPA) → **Cloudflare Pages**
- **Telegram bot** (`apps/bot`, webhook) → **Cloudflare Workers**

Both have a generous free tier and a global edge network with good Central-Asia reach.

---

## 1. Web app → Cloudflare Pages

The web app is a static Vite build. In the Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** (or `wrangler pages deploy`).

**Build settings:**
- Framework preset: **None / Vite**
- **Root directory:** repo root (leave default)
- **Build command:** `pnpm turbo run build --filter=@alfavit/web`
  - (builds `@alfavit/engine` first via the `^build` dependency, then the web app)
- **Build output directory:** `apps/web/dist`
- **Install:** Cloudflare auto-detects pnpm from the lockfile. If needed, set env `PNPM_VERSION` / enable corepack.

**Custom domain:** add `alfavit.uz` in the Pages project → Custom domains (Cloudflare can also manage the `.uz` DNS).

After deploy, the logo is served at `https://alfavit.uz/logo.png` (from `apps/web/public/logo.png`).

---

## 2. Telegram bot → Cloudflare Workers (webhook)

The bot switches from Node long-polling (`src/index.ts`, used for local dev) to a
Worker (`src/worker.ts`) that Telegram POSTs updates to. Config lives in
`apps/bot/wrangler.toml`.

**Steps (from `apps/bot`):**

1. **Log in:** `pnpm exec wrangler login`
2. **Set the bot token as a secret** (never commit it):
   `pnpm exec wrangler secret put BOT_TOKEN` → paste the token
3. **Deploy:** `pnpm deploy` (runs `wrangler deploy`) → note the Worker URL, e.g.
   `https://alfavit-bot.<your-subdomain>.workers.dev`
4. **Register the webhook + configure commands/descriptions** (one time, run locally):
   ```
   BOT_TOKEN=… WEBHOOK_URL=https://alfavit-bot.<your-subdomain>.workers.dev \
     pnpm setup:webhook
   ```
   (`src/setup.ts` calls `setWebhook` and `applyBotConfig`.)

**`LOGO_URL`** for the inline thumbnail is a public var in `wrangler.toml`
(`[vars]`). It currently points to the catbox-hosted logo; switch it to
`https://alfavit.uz/logo.png` once Pages is live, then re-`pnpm deploy`.

**Local development:**
- Long-polling (simplest): `BOT_TOKEN=… LOGO_URL=… pnpm start`
  (or put them in `apps/bot/.env` — gitignored — and `pnpm start`)
- Worker locally: `pnpm cf:dev` (wrangler dev)

**Switching webhook → back to polling:** run `bot.api.deleteWebhook()` (or
`curl https://api.telegram.org/bot<token>/deleteWebhook`) before using `pnpm start`,
since a bot can't do both at once.

---

## Notes

- **Secrets:** `BOT_TOKEN` is a Worker secret (and lives in the gitignored `.env`
  for local runs). `.env` and `.env.*` are gitignored repo-wide.
- **Rotate** the bot token after early testing (it was shared in chat during setup).
- The engine and both channels share one monorepo build graph; `pnpm turbo run build`
  builds all three.
