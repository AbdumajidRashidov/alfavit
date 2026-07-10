# Alfavit Public API + SDK Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `@alfavit/api` — an open, rate-limited Cloudflare Worker (Hono) exposing `POST /v1/transliterate` over `@alfavit/engine` — plus a zero-dependency `@alfavit/sdk` client, wired into the CI deploy pipeline.

**Architecture:** A stateless Hono app (`createApp()`) with CORS, input validation, and a per-IP rate-limit middleware using Cloudflare's GA `ratelimit` binding (graceful-degrading when absent). Tested in-process via `app.request(...)`. The SDK is a tiny typed `fetch` wrapper. Deploys as a third Workers job in `deploy.yml`.

**Tech Stack:** TypeScript (strict), Hono, Cloudflare Workers, `@alfavit/engine`, Vitest, wrangler.

## Global Constraints

- Packages: `@alfavit/api` (`apps/api`, Worker) and `@alfavit/sdk` (`packages/sdk`); both depend on `@alfavit/engine` via `workspace:*`. Strict TS, ESM.
- Open API (no keys/datastore). `POST /v1/transliterate` body `{ text: string, source?: 'auto'|'cyrillic'|'old-latin' }` → `{ text, detectedScript, flags }`. `GET /` → usage JSON.
- CORS `*` (GET/POST/OPTIONS, header `content-type`).
- Rate limit per `CF-Connecting-IP`: Cloudflare `ratelimit` binding `RATE_LIMITER`, **60 / 60s** → `429 { error: 'Rate limit exceeded' }`; if binding absent → allow.
- Validation: bad JSON → 400 `Invalid JSON body`; missing/empty `text` → 400 `Field "text" is required`; `text` > 100000 chars → 413; invalid `source` → 400 `Invalid "source"`. Errors are `{ error }` JSON.
- SDK: `createClient({ baseUrl, fetch? }).transliterate(text, { source? })`; zero runtime deps; throws the API `error` on non-2xx; `fetch` injectable.
- Verified wrangler `ratelimit` syntax (GA): `[[ratelimits]] name/namespace_id` + `[ratelimits.simple] limit/period` (period ∈ {10,60}); runtime `const { success } = await env.RATE_LIMITER.limit({ key })`.
- Tests in each package's `src/tests/`. TDD throughout.

---

### Task 1: Scaffold apps/api (Hono worker) + GET / + CORS

**Files:**
- Create: `apps/api/package.json`, `apps/api/tsconfig.json`, `apps/api/vitest.config.ts`, `apps/api/wrangler.toml`
- Create: `apps/api/src/app.ts`, `apps/api/src/index.ts`, `apps/api/src/tests/app.test.ts`

**Interfaces:**
- Consumes: `hono`.
- Produces: `createApp()` (Hono instance with CORS + `GET /`), `API_INFO`, `interface Bindings`.

- [ ] **Step 1: Manifests + config**

`apps/api/package.json`:
```json
{
  "name": "@alfavit/api",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "build": "tsc -p tsconfig.json",
    "test": "vitest run"
  },
  "dependencies": {
    "@alfavit/engine": "workspace:*",
    "hono": "^4.6.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20240909.0",
    "typescript": "^5.5.0",
    "vitest": "^2.0.0",
    "wrangler": "^3.80.0"
  }
}
```

`apps/api/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noEmit": true,
    "types": ["@cloudflare/workers-types"],
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

`apps/api/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { include: ['src/**/*.test.ts'] } })
```

`apps/api/wrangler.toml`:
```toml
name = "alfavit-api"
main = "src/index.ts"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]

[[ratelimits]]
name = "RATE_LIMITER"
namespace_id = "1001"

  [ratelimits.simple]
  limit = 60
  period = 60
```

- [ ] **Step 2: Write the failing test**

`apps/api/src/tests/app.test.ts`:
```ts
import { expect, test } from 'vitest'
import { createApp } from '../app'

test('GET / returns usage info', async () => {
  const res = await createApp().request('/')
  expect(res.status).toBe(200)
  const body = (await res.json()) as { endpoint: string }
  expect(body.endpoint).toBe('POST /v1/transliterate')
})

test('CORS is enabled', async () => {
  const res = await createApp().request('/', { method: 'OPTIONS', headers: { origin: 'https://x.dev' } })
  expect(res.headers.get('access-control-allow-origin')).toBe('*')
})
```

- [ ] **Step 3: Run to verify it fails**

Run from repo root: `pnpm install`
Then from `apps/api`: `pnpm test`
Expected: FAIL — `../app` not found.

- [ ] **Step 4: Implement app.ts + index.ts**

`apps/api/src/app.ts`:
```ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'

export interface Bindings {
  RATE_LIMITER?: { limit: (o: { key: string }) => Promise<{ success: boolean }> }
}

export const API_INFO = {
  name: 'Alfavit API',
  version: '1',
  endpoint: 'POST /v1/transliterate',
  example: {
    request: { text: 'салом' },
    response: { text: 'salom', detectedScript: 'cyrillic', flags: [] },
  },
  limits: { rateLimit: '60 requests / 60s per IP', maxTextLength: 100000 },
}

export function createApp() {
  const app = new Hono<{ Bindings: Bindings }>()
  app.use('*', cors())
  app.get('/', (c) => c.json(API_INFO))
  return app
}
```

`apps/api/src/index.ts`:
```ts
import { createApp } from './app'

export default createApp()
```

- [ ] **Step 5: Run to verify it passes + build**

Run: `pnpm test`  → PASS (2 tests).
Then: `pnpm build`  → `tsc` type-checks clean (noEmit).

- [ ] **Step 6: Commit**

```bash
git add apps/api pnpm-lock.yaml
git commit -m "chore(api): scaffold @alfavit/api (Hono worker) with GET / + CORS"
```

---

### Task 2: POST /v1/transliterate

**Files:**
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/src/tests/app.test.ts`

**Interfaces:**
- Consumes: `transliterate`, `detectScript` from `@alfavit/engine`; `createApp` (Task 1).
- Produces: `POST /v1/transliterate` route with validation, returning `{ text, detectedScript, flags }`.

- [ ] **Step 1: Add failing tests**

Append to `apps/api/src/tests/app.test.ts`:
```ts
async function post(body: unknown, raw?: string) {
  return createApp().request('/v1/transliterate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: raw ?? JSON.stringify(body),
  })
}

test('POST converts Cyrillic', async () => {
  const res = await post({ text: 'салом дунё' })
  expect(res.status).toBe(200)
  const b = (await res.json()) as { text: string; detectedScript: string; flags: unknown[] }
  expect(b.text).toBe('salom dunyo')
  expect(b.detectedScript).toBe('cyrillic')
})

test('POST honors source and returns flags for ambiguous input', async () => {
  const res = await post({ text: 'ер' })
  const b = (await res.json()) as { text: string; flags: unknown[] }
  expect(b.text).toBe('yer')
  expect(b.flags.length).toBeGreaterThan(0)
})

test('POST validation: missing text → 400', async () => {
  expect((await post({})).status).toBe(400)
})

test('POST validation: bad JSON → 400', async () => {
  expect((await post(null, '{not json')).status).toBe(400)
})

test('POST validation: oversized text → 413', async () => {
  expect((await post({ text: 'а'.repeat(100001) })).status).toBe(413)
})

test('POST validation: invalid source → 400', async () => {
  expect((await post({ text: 'салом', source: 'klingon' })).status).toBe(400)
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm test`
Expected: FAIL — route returns 404 / not implemented.

- [ ] **Step 3: Implement the route**

In `apps/api/src/app.ts`, add imports at the top:
```ts
import { transliterate, detectScript } from '@alfavit/engine'
```
Add these constants above `createApp`:
```ts
const SOURCES = ['auto', 'cyrillic', 'old-latin'] as const
const MAX_TEXT = 100000
```
Inside `createApp`, after `app.get('/', ...)` and before `return app`:
```ts
  app.post('/v1/transliterate', async (c) => {
    let body: Record<string, unknown>
    try {
      body = (await c.req.json()) as Record<string, unknown>
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400)
    }
    const text = body.text
    if (typeof text !== 'string' || text.trim() === '') {
      return c.json({ error: 'Field "text" is required' }, 400)
    }
    if (text.length > MAX_TEXT) {
      return c.json({ error: `Text too large (max ${MAX_TEXT} chars)` }, 413)
    }
    const source = body.source
    if (source !== undefined && !(SOURCES as readonly unknown[]).includes(source)) {
      return c.json({ error: 'Invalid "source"' }, 400)
    }
    const result = transliterate(text, source ? { source: source as (typeof SOURCES)[number] } : undefined)
    return c.json({ text: result.text, detectedScript: detectScript(text), flags: result.flags })
  })
```

- [ ] **Step 4: Run to verify they pass**

Run: `pnpm test`
Expected: PASS (Task 1 + these 6).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/app.ts apps/api/src/tests/app.test.ts
git commit -m "feat(api): POST /v1/transliterate with validation"
```

---

### Task 3: Per-IP rate-limit middleware

**Files:**
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/src/tests/app.test.ts`

**Interfaces:**
- Consumes: the `Bindings.RATE_LIMITER` shape (Task 1).
- Produces: middleware on `/v1/*` that 429s when the limiter denies; allows when the binding is absent.

- [ ] **Step 1: Add failing tests**

Append to `apps/api/src/tests/app.test.ts`:
```ts
test('rate limit: 429 when the limiter denies', async () => {
  const env = { RATE_LIMITER: { limit: async () => ({ success: false }) } }
  const res = await createApp().request(
    '/v1/transliterate',
    { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: 'салом' }) },
    env,
  )
  expect(res.status).toBe(429)
})

test('rate limit: allowed when no limiter binding', async () => {
  const res = await createApp().request(
    '/v1/transliterate',
    { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: 'салом' }) },
    {},
  )
  expect(res.status).toBe(200)
})
```

- [ ] **Step 2: Run to verify the 429 test fails**

Run: `pnpm test`
Expected: FAIL — the deny case currently returns 200 (no middleware yet).

- [ ] **Step 3: Implement the middleware**

In `apps/api/src/app.ts`, inside `createApp`, insert immediately after `app.use('*', cors())`:
```ts
  app.use('/v1/*', async (c, next) => {
    const limiter = c.env.RATE_LIMITER
    if (limiter) {
      const key = c.req.header('cf-connecting-ip') ?? 'anon'
      const { success } = await limiter.limit({ key })
      if (!success) return c.json({ error: 'Rate limit exceeded' }, 429)
    }
    await next()
  })
```

- [ ] **Step 4: Run to verify all pass**

Run: `pnpm test`
Expected: PASS (all app tests).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/app.ts apps/api/src/tests/app.test.ts
git commit -m "feat(api): per-IP rate-limit middleware (Cloudflare ratelimit binding)"
```

---

### Task 4: `@alfavit/sdk` client

**Files:**
- Create: `packages/sdk/package.json`, `packages/sdk/tsconfig.json`, `packages/sdk/vitest.config.ts`
- Create: `packages/sdk/src/index.ts`, `packages/sdk/src/tests/sdk.test.ts`

**Interfaces:**
- Consumes: types `SourceScript`, `AmbiguityFlag` from `@alfavit/engine`.
- Produces: `createClient({ baseUrl, fetch? })` with `transliterate(text, opts?)`.

- [ ] **Step 1: Manifests**

`packages/sdk/package.json`:
```json
{
  "name": "@alfavit/sdk",
  "version": "0.0.1",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": { ".": { "import": "./dist/index.js", "types": "./dist/index.d.ts" } },
  "files": ["dist"],
  "scripts": { "build": "tsc -p tsconfig.json", "test": "vitest run" },
  "dependencies": { "@alfavit/engine": "workspace:*" },
  "devDependencies": { "typescript": "^5.5.0", "vitest": "^2.0.0" }
}
```

`packages/sdk/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src",
    "skipLibCheck": true
  },
  "include": ["src"],
  "exclude": ["**/*.test.ts"]
}
```

`packages/sdk/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { include: ['src/**/*.test.ts'] } })
```

- [ ] **Step 2: Write the failing test**

`packages/sdk/src/tests/sdk.test.ts`:
```ts
import { expect, test, vi } from 'vitest'
import { createClient } from '../index'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

test('transliterate POSTs to the API and returns the parsed result', async () => {
  const fetchMock = vi.fn(async () => jsonResponse({ text: 'salom', detectedScript: 'cyrillic', flags: [] }))
  const client = createClient({ baseUrl: 'https://api.alfavit.uz/', fetch: fetchMock })
  const out = await client.transliterate('салом', { source: 'cyrillic' })

  expect(out.text).toBe('salom')
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
  expect(url).toBe('https://api.alfavit.uz/v1/transliterate')
  expect(init.method).toBe('POST')
  expect(JSON.parse(init.body as string)).toEqual({ text: 'салом', source: 'cyrillic' })
})

test('transliterate throws the API error message on non-2xx', async () => {
  const fetchMock = vi.fn(async () => jsonResponse({ error: 'Field "text" is required' }, 400))
  const client = createClient({ baseUrl: 'https://api.alfavit.uz', fetch: fetchMock })
  await expect(client.transliterate('')).rejects.toThrow('Field "text" is required')
})
```

- [ ] **Step 3: Run to verify it fails**

Run from `packages/sdk`: `pnpm test`
Expected: FAIL — `../index` not found.

- [ ] **Step 4: Implement**

`packages/sdk/src/index.ts`:
```ts
import type { SourceScript, AmbiguityFlag } from '@alfavit/engine'

export type Source = 'auto' | 'cyrillic' | 'old-latin'

export interface TransliterateResult {
  text: string
  detectedScript: SourceScript
  flags: AmbiguityFlag[]
}

export interface ClientOptions {
  baseUrl: string
  fetch?: typeof fetch
}

export function createClient({ baseUrl, fetch: fetchImpl = fetch }: ClientOptions) {
  const base = baseUrl.replace(/\/$/, '')
  return {
    async transliterate(text: string, opts?: { source?: Source }): Promise<TransliterateResult> {
      const res = await fetchImpl(`${base}/v1/transliterate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(opts?.source ? { text, source: opts.source } : { text }),
      })
      const data = (await res.json()) as TransliterateResult & { error?: string }
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      return data
    },
  }
}
```

- [ ] **Step 5: Run to verify it passes + build**

Run: `pnpm test`  → PASS (2 tests).
Then: `pnpm build`  → emits `dist/index.js` + `dist/index.d.ts`.

- [ ] **Step 6: Commit**

```bash
git add packages/sdk pnpm-lock.yaml
git commit -m "feat(sdk): @alfavit/sdk typed transliteration client"
```

---

### Task 5: Wire the API into CI auto-deploy

**Files:**
- Modify: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: the existing `deploy.yml` structure + `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` secrets.
- Produces: a third `api` deploy job (build engine → `wrangler deploy` in `apps/api`).

- [ ] **Step 1: Add the job**

In `.github/workflows/deploy.yml`, add a third job after the `bot` job (same indentation as `web:` and `bot:`):
```yaml
  api:
    runs-on: ubuntu-latest
    env:
      CF_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      # Build the engine (and type-check the api); wrangler bundles the Worker →
      # @alfavit/engine, which must have its dist/ present to resolve.
      - run: pnpm exec turbo run build --filter=@alfavit/api
      - name: Deploy API to Cloudflare Workers
        if: env.CF_TOKEN != ''
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          wranglerVersion: '3.114.17'
          packageManager: npm
          workingDirectory: apps/api
          command: deploy
```

- [ ] **Step 2: Validate the whole monorepo builds + tests**

Run from repo root: `pnpm turbo run build` and `pnpm turbo run test`
Expected: all packages (engine, web, bot, api, sdk) build and pass.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: auto-deploy @alfavit/api to Cloudflare Workers"
```

---

## Self-Review Notes

- **Spec coverage:** scaffold + GET / + CORS (Task 1); POST /v1/transliterate + validation/limits (Task 2); rate-limit middleware with graceful degradation (Task 3); SDK (Task 4); deploy wiring (Task 5). Verified `ratelimit` wrangler syntax used. Out-of-scope (keys/quotas/dashboard/OpenAPI/batch) excluded.
- **Placeholder scan:** none — every step has real code/commands.
- **Type consistency:** `createApp()` (Hono app with `.request()`), `Bindings.RATE_LIMITER.limit({key})→{success}`, response `{text, detectedScript, flags}`, `createClient({baseUrl,fetch?}).transliterate(text,{source?})→TransliterateResult` are used identically across tasks. `POST /v1/transliterate` path and error messages match the spec verbatim.
- **Testability:** the whole API is tested in-process via `app.request(input, init, env)` (env injects/stubs the limiter) — no real Worker or network; SDK injects `fetch`. No untested seam except the wrangler binding wiring, which is config verified against current Cloudflare docs.
