# Alfavit Public API + SDK — Design (Sub-project 5)

**Date:** 2026-07-11
**Status:** Approved (design)
**Packages:** `@alfavit/api` (`apps/api`, Cloudflare Worker) + `@alfavit/sdk` (`packages/sdk`)

## 1. Purpose

Host the transliteration engine as a public HTTP API so developers (apps, banks,
telecoms, publishers) can convert Uzbek text to the new Latin script programmatically —
the platform's developer channel. **Open + rate-limited** for v1 (no API keys, no
datastore); keys/quotas/billing are deferred to the Pro accounts/billing slices. A tiny
typed SDK wraps the API for JS/TS consumers.

## 2. Architecture

A stateless Cloudflare Worker using **Hono** (lightweight Workers-native framework),
consuming `@alfavit/engine`. Deploys like the bot (Workers + wrangler + the CI pipeline).

```
apps/api/
├── package.json      # @alfavit/api; deps: hono, @alfavit/engine (workspace:*)
├── wrangler.toml     # name alfavit-api; Cloudflare Rate Limiting binding
├── src/app.ts        # createApp(): routes, CORS, validation, rate-limit middleware
├── src/index.ts      # export default app  (Worker fetch entry; env via c.env)
└── src/tests/
packages/sdk/
├── package.json      # @alfavit/sdk; zero runtime deps
├── src/index.ts      # createClient({ baseUrl }).transliterate(text, opts)
└── src/tests/
```

## 3. HTTP surface (versioned `/v1`)

- **`POST /v1/transliterate`**
  - Request JSON: `{ text: string }`. (A `source`/script override is **not** exposed in v1:
    the engine auto-detects per run and does not yet support forcing a source; adding
    `source` later is a non-breaking change.)
  - Response 200 JSON: `{ text: string, detectedScript: SourceScript, flags: AmbiguityFlag[] }`
    (from `transliterate` + `detectScript`).
- **`GET /`** — self-documenting usage JSON: name, version, the endpoint, an example
  request/response, and the limits. Doubles as a health check.
- **CORS**: `Access-Control-Allow-Origin: *`, allow `GET, POST, OPTIONS`, header
  `content-type`; `OPTIONS` preflight handled.

## 4. Guardrails

- **Rate limit** (per client IP via `CF-Connecting-IP`): Cloudflare's native **Rate
  Limiting binding** (`c.env.RATE_LIMITER.limit({ key })`) — no datastore. Default **60
  requests / 60s**; on exceed → `429 { error: 'Rate limit exceeded' }`. If the binding is
  absent (local dev / tests) the middleware allows the request (graceful degradation).
  (Exact `wrangler.toml` syntax for the binding is verified against current Cloudflare docs
  during implementation.)
- **Validation**:
  - Non-JSON / unparseable body → `400 { error: 'Invalid JSON body' }`.
  - Missing or non-string or empty-after-trim `text` → `400 { error: 'Field "text" is required' }`.
  - `text` longer than **100 000** chars → `413 { error: 'Text too large (max 100000 chars)' }`.
- All responses (success and error) are JSON.

## 5. SDK (`@alfavit/sdk`)

Zero-dependency (no workspace deps either — the `SourceScript`/`AmbiguityFlag` types are
**inlined** so the package is standalone/publishable), browser + Node (global `fetch`):
```ts
createClient(options: { baseUrl: string; fetch?: typeof fetch }): {
  transliterate(text: string):
    Promise<{ text: string; detectedScript: SourceScript; flags: AmbiguityFlag[] }>
}
```
- POSTs to `${baseUrl}/v1/transliterate`; throws an `Error` with the API's `error` message
  on non-2xx (tolerant of non-JSON error bodies). `fetch` is injectable for testing.

## 6. Testing (Vitest, in-process, no network)

- **API** via `app.request(new Request(...))`:
  - `POST /v1/transliterate` `{text:'салом'}` → 200, `text:'salom'`, `detectedScript:'cyrillic'`.
  - `source:'old-latin'` honored; ambiguous input returns non-empty `flags`.
  - missing/empty text → 400; body > 100k → 413; malformed JSON → 400; bad `source` → 400.
  - `OPTIONS` preflight and success responses carry the CORS header.
  - `GET /` returns usage JSON with the endpoint path.
  - Rate-limit middleware: with a stub limiter returning `{success:false}` → 429; absent → allowed.
- **SDK**: inject a fake `fetch`; assert it calls `POST {baseUrl}/v1/transliterate` with the
  JSON body, returns the parsed result, and throws the API error message on a 400.

## 7. Deployment

Cloudflare Worker `alfavit-api` (`wrangler deploy`), wired into the existing GitHub Actions
`deploy.yml` as a third deploy job (build engine → `wrangler deploy` in `apps/api`).
Local/dev: `wrangler dev`. No secrets required (open API).

## 8. Out of scope

API keys, quotas, per-key billing, usage analytics, a developer dashboard (Pro
accounts/billing slices); OpenAPI/Swagger doc site; batch or file-upload endpoints;
non-Uzbek languages.
