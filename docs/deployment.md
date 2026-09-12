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
domain** on the `alfavit.uz` zone:

```toml
routes = [
  { pattern = "api.alfavit.uz", custom_domain = true },
]
```

That one block is the whole reason this job needs a broader token than the other
two. `wrangler deploy` uploads the script with an *account*-scoped call, then
asserts the route with a *zone*-scoped one.

CI deploys it; to deploy by hand from `apps/api`: `pnpm exec wrangler deploy`.

### CI API token scopes

`CLOUDFLARE_API_TOKEN` is shared by all three jobs, so it must cover all three.
Minimum permissions:

| Scope | Permission | Needed for |
| --- | --- | --- |
| Account | Workers Scripts — **Edit** | uploading either Worker (bot, API) |
| Zone | Workers Routes — **Edit** | the `api.alfavit.uz` custom domain ← the one CI is missing |
| Account | Cloudflare Pages — **Edit** | the `web` job |
| Account | Account Settings — **Read** | account lookup |
| User | User Details — **Read** | `wrangler whoami`; only used to print diagnostics |

Under **Zone Resources**, include the `alfavit.uz` zone (or all zones on the
account). Without that, a zone permission is granted over nothing.

Two things that are *not* required, both of which look plausible and cost time:

- **Zone → DNS → Edit.** For a custom domain Cloudflare creates the DNS record
  and issues the certificate [on your behalf][cf-custom-domains], server-side —
  the token never makes a DNS call of its own. Cloudflare's own
  [Edit Cloudflare Workers template][cf-template] omits DNS deliberately.
- **A newer wrangler, or a different Node version.** Already ruled out; see the
  failure signature below.

[cf-custom-domains]: https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
[cf-template]: https://developers.cloudflare.com/fundamentals/api/reference/template/

### The failure signature

A token with Workers Scripts but no Workers Routes **uploads the Worker and then
fails**, so the job is red while the code is live:

```
Uploaded alfavit-api (3.28 sec)          ← upload succeeded, account scope is fine
✘ [ERROR] A request to the Cloudflare API (/zones/<zone-id>/workers/routes) failed.
  Authentication error [code: 10000]
```

Read the path in the error, not the summary: `/zones/…/` means a zone permission
is missing. The `Are you missing the User->User Details->Read permission?` line
that follows is wrangler's post-mortem `whoami`, not the cause — chasing it
leads nowhere.

Because `api.alfavit.uz` is already provisioned, the live endpoint keeps serving
through this failure; only the re-assertion is refused. Real red mark, no outage.

### Fixing it (owner-only)

Fastest path — **edit the existing token**, do not mint a new one:

1. [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)
2. On the token CI uses → **⋯** → **Edit**
3. Add permission **Zone · Workers Routes · Edit**
4. Set **Zone Resources** to include `alfavit.uz`
5. **Continue to summary** → **Save**
6. Re-run the failed job: `gh run rerun <run-id> --failed`

Editing permissions leaves the token *value* unchanged (only **Roll** issues a
new secret), so the `CLOUDFLARE_API_TOKEN` repo secret needs no update and the
green `web`/`bot` jobs keep working.

If you do mint a fresh token instead: the **Edit Cloudflare Workers** template
is a good base but **does not include Cloudflare Pages — Edit**, so a
template-only token deploys the API and breaks the currently-green `web` job.
Add the Pages row, then update the secret (the value must never be pasted into a
file or a chat):

```bash
gh secret set CLOUDFLARE_API_TOKEN
```

### Alternative: keep zone permissions out of CI

If granting CI a zone-level permission is unwelcome, attach the custom domain
**once** by hand and let CI only push code:

1. Cloudflare dashboard → **Workers & Pages** → `alfavit-api` → **Settings** →
   **Domains & Routes** → **Add** → **Custom domain** → `api.alfavit.uz`
2. Delete the `routes = [ … ]` block from `apps/api/wrangler.toml`

Deploys then need only **Account → Workers Scripts → Edit**, the same scope the
bot uses, and the api job stops touching the zone API entirely.

**Tradeoff:** the domain binding stops being declarative. It no longer lives in
the repo, cannot be reproduced by a clone-and-deploy, and a rebuild of the
Worker in a fresh account would come up with no custom domain and no error
saying so. Prefer the token fix if you can; take this if you would rather the
domain be a one-time manual fact than a CI permission.

---

## 4. Event collector → Cloudflare Workers (`alfavit.uz/e`, `/dl/*`)

`apps/collect` receives event beacons from the web app and counts installer
downloads. Unlike the API it claims **no custom domain** — it attaches to two
paths on the `alfavit.uz` zone that Cloudflare Pages otherwise serves, so it
needs the same **Zone · Workers Routes · Edit** scope the API job needs.

Routes (`apps/collect/wrangler.toml`):

- `alfavit.uz/e` — `POST` only; one Analytics Engine data point per beacon
- `alfavit.uz/dl/*` — counts a download, then 302s to the static installer

**Prerequisite, once per account:** Analytics Engine must be enabled at
[dash → Workers → Analytics Engine](https://dash.cloudflare.com/?to=/:account/workers/analytics-engine).
Without it, `wrangler deploy` fails at upload with `You need to enable Analytics
Engine … [code: 10089]` — the binding is correct, the account flag is missing.
After enabling, allow ~1 minute for the flag to propagate; deploys attempted
immediately afterwards still fail with the same error.

One secret, set once:

```bash
cd apps/collect && pnpm exec wrangler secret put SESSION_SECRET
```

Any long random string. It salts the daily session hash, so visits can be
grouped without storing anything about the visitor; rotating it simply starts a
new grouping window.

**Reading the data** needs a separate, **read-only** token (Account · Account
Analytics · Read) in your local environment as `CLOUDFLARE_ANALYTICS_TOKEN`,
alongside `CLOUDFLARE_ACCOUNT_ID`. Then `pnpm metrics`. It is deliberately not a
CI secret — nothing in CI reads analytics.

Analytics Engine retains **three months**. The weekly block `pnpm metrics`
prints is meant to be pasted into `docs/marketing/metrics.md`; that paste is the
durable record, not the dataset.

---

## www → apex redirect (dashboard, not in the repo)

`www.alfavit.uz` used to serve a full duplicate of the site with a 200, splitting
the analytics host dimension. It now 301s to the apex, via a **zone Redirect Rule**
created from Cloudflare's "Redirect from WWW to root" template:

| | |
| --- | --- |
| Where | alfavit.uz → Rules → Overview → Redirect Rules |
| Name | `Redirect from WWW to root [Template]` |
| Match | URI Full wildcard `https://www.*` |
| Action | 301 to `wildcard_replace(http.request.full_uri, r"https://www.*", r"https://${1}")` |
| Preserve query string | **on** |

**`_redirects` cannot do this.** Cloudflare Pages' `_redirects` file matches paths
only; domain-level redirects are explicitly unsupported. Do not try to move this
rule into `apps/web/public/_redirects` — it will silently do nothing.

**Preserve query string is not optional.** With it off, a tagged link like
`www.alfavit.uz/?utm_source=gazeta&utm_medium=press` lands on a bare `alfavit.uz/`
and the UTM parameters are gone, which silently breaks the attribution the whole
event pipeline exists to provide. It is off by default in the template.

On deploy Cloudflare warns *"This rule may not apply to your traffic — your DNS
configuration may not be proxying traffic for www."* That is a false positive here:
`www` is bound as a Pages custom domain and is already proxied. Choose **Ignore and
deploy rule anyway**, not "Create a new proxied DNS record" — the latter adds a DNS
record that can collide with the existing Pages binding.

Like the domain binding in § 3, this is a one-time manual fact rather than a
declarative one: a clone-and-deploy into a fresh account comes up without it and
says nothing.

---

## Notes

- **Secrets:** `BOT_TOKEN` is a Worker secret (and lives in the gitignored `.env`
  for local runs). `.env` and `.env.*` are gitignored repo-wide.
- **Rotate** the bot token after early testing (it was shared in chat during setup).
- The engine and all channels share one monorepo build graph; `pnpm turbo run build`
  builds them together.
- **The desktop apps are not deployed by CI.** They bundle the engine's
  compiled output at build time and have no auto-update channel, so an engine
  fix reaches Mac and Windows users only via rebuilt installers rehosted at
  `apps/web/public/download/Alfavit.dmg` and
  `apps/web/public/download/Alfavit-Setup.exe` (a `desktop-v*` tag builds
  both into one draft Release). See `apps/desktop/README.md`.
