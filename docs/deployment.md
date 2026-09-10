# Alfavit — Deployment (all on Cloudflare)

Three deployables, two Cloudflare products:

- **Web app** (`apps/web`, static SPA) → **Cloudflare Pages**
- **Telegram bot** (`apps/bot`, webhook) → **Cloudflare Workers**
- **Public API** (`apps/api`, `api.alfavit.uz`) → **Cloudflare Workers**

All have a generous free tier and a global edge network with good Central-Asia reach.

CI deploys all three on a push to `main` (`.github/workflows/deploy.yml`), using
the repo secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. See
[CI API token scopes](#ci-api-token-scopes) — the API job needs a zone-level
permission the other two do not.

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

## 3. Public API → Cloudflare Workers (`api.alfavit.uz`)

Config lives in `apps/api/wrangler.toml`. Unlike the bot, it serves a **custom
domain** on the `alfavit.uz` zone, so wrangler asserts a zone route on every
deploy — that is the one thing needing a zone-scoped token (below).

CI deploys it; to deploy by hand from `apps/api`: `pnpm exec wrangler deploy`.

### CI API token scopes

`CLOUDFLARE_API_TOKEN` must carry the permissions of the **Edit Cloudflare
Workers** template. Create it at
[dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)
→ **Create Token** → **Edit Cloudflare Workers** (or **Custom token** with the
same rows):

| Scope | Permission | Needed for |
| --- | --- | --- |
| Account | Workers Scripts — **Edit** | uploading any Worker (bot, API) |
| Zone | Workers Routes — **Edit** | the `api.alfavit.uz` custom domain |
| Account | Account Settings — **Read** | account lookup |
| User | User Details — **Read** | `wrangler whoami` during deploy |
| Account | Cloudflare Pages — **Edit** | the web job |

Under **Zone Resources**, include the `alfavit.uz` zone (or all zones on the
account). A token without **Zone → Workers Routes → Edit** still *uploads* the
Worker, then fails at the end of the job with:

```
A request to the Cloudflare API (/zones/<zone-id>/workers/routes) failed.
  Authentication error [code: 10000]
```

That is the failure mode to recognize: a red `api` job whose log says
`Uploaded alfavit-api` a few lines above the error. The code is live and the
already-provisioned custom domain keeps serving — only the route re-assertion
failed — so the red mark is real but not an outage. **Do not chase it as a
wrangler or Node version problem.** Re-scope the token, then re-run the job.

After minting a replacement, update the repo secret (owner-only — the value must
never be pasted into a file or a chat):

```bash
gh secret set CLOUDFLARE_API_TOKEN
```

---

## Notes

- **Secrets:** `BOT_TOKEN` is a Worker secret (and lives in the gitignored `.env`
  for local runs). `.env` and `.env.*` are gitignored repo-wide.
- **Rotate** the bot token after early testing (it was shared in chat during setup).
- The engine and all channels share one monorepo build graph; `pnpm turbo run build`
  builds them together.
- **The macOS app is not deployed by CI.** It bundles the engine's compiled
  output at build time and has no auto-update channel, so an engine fix reaches
  Mac users only via a rebuilt `.dmg` rehosted at
  `apps/web/public/download/Alfavit.dmg`. See `apps/desktop/README.md`.
