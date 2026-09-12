# Visitor Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## Execution status — 12 September 2026

| Task | State |
|---|---|
| 1 Scaffold + session hash | done — 7 tests |
| 2 Route precedence gate | **PASSED** — Worker beats Pages; verified in production. Fallback not needed. |
| 3 Beacon parsing | done — 9 tests |
| 4 `POST /e` | done — 9 tests |
| 5 `/dl/*` downloads | done — 6 tests |
| 6 `track()` helper | done — 8 tests |
| 7 Pageview hook | done — 3 tests |
| 8 Converter events | done — 5 tests, incl. the privacy guarantee |
| 9 Files / installers / outbound | done — 4 tests + existing suite updated |
| 10 `pnpm metrics` | done — **still unexercised against live data**; needs a read token |
| 11 CI job + docs | done |
| 12 Deploy and verify | collector **deployed and live**; `SESSION_SECRET` set; 8 test beacons accepted and landing in `alfavit_events`. Web app not yet deployed — ships on merge to main. |

All 9 packages build; 199 tests pass. The collector is live on `alfavit.uz/e` and `/dl/*`; the web app's tracking code ships on merge to main.

**Deviation from the plan, Task 8:** the plan called `reportUse(detectedScript)`
using the rendered value, which lags one keystroke behind and would have reported
`foreign` for the first character of every session. Implemented as
`reportUse(detectScript(value))` off the new textarea value instead. The test
caught it.

---

**Goal:** Count what visitors actually do on alfavit.uz — transliterate, convert files, copy, download, click out — attributed to the campaign that sent them, without transmitting a single character of their text.

**Architecture:** A fourth Worker (`apps/collect`) receives `sendBeacon` posts on the same-origin route `alfavit.uz/e` and writes one Analytics Engine data point per event. It also serves `/dl/mac` and `/dl/win`, which count a download and then 302 to the static installer. A ~40-line client helper fires the beacons. A dependency-free Node script reads the data back through the Analytics Engine SQL API and prints the weekly review block.

**Tech Stack:** Cloudflare Workers, Workers Analytics Engine, Hono 4, TypeScript 5.5, Vitest 2, React 18, Wrangler 4.x, pnpm workspaces + Turborepo.

**Spec:** [`docs/specs/2026-09-12-visitor-analytics-design.md`](../specs/2026-09-12-visitor-analytics-design.md)

## Global Constraints

Every task's requirements implicitly include this section.

- **The user's text never leaves the browser.** No event carries input, output, or a length derived from either. A test enforces this.
- **No raw IP is ever written.** It is read from `CF-Connecting-IP`, consumed by the session hash, and discarded.
- **No cookies, no `localStorage`, no persistent identifier.** The daily hash is recomputed server-side per request and never returned to the client.
- **Exactly three query parameters survive:** `utm_source`, `utm_medium`, `utm_campaign` — matching `docs/marketing/README.md:20-22`. Everything else in a query string is dropped before storage.
- **Beacons are fire-and-forget.** A blocked, failed, or missing `sendBeacon` must never throw, log, or change what the user sees.
- **Exactly six event names:** `pageview`, `transliterate`, `file_convert`, `copy`, `download`, `outbound`. Anything else is rejected at the edge.
- **Schema is fixed:** `index1` = event name; `blob1..blob10` = path, locale, referrer host, utm_source, utm_medium, utm_campaign, country, device, session hash, detail; `double1` = 1.
- **Analytics Engine caps (verified 2026-09-12):** 20 blobs, 20 doubles, 1 index per data point; 16 KB total blobs; 96-byte index; 250 data points per invocation; 100k writes + 10k reads per day on the free plan; **3-month retention**.
- **Wrangler 4.x requires Node 22 in CI.** The `api` job documents why; the new job copies it exactly.
- **Commit style:** explicit paths in `git add`, never `git add -A` — the working tree carries untracked `.DS_Store` files and may be shared with another session.

---

## File Structure

**New — `apps/collect` (the collector Worker):**

| File | Responsibility |
|---|---|
| `apps/collect/package.json` | workspace package `@alfavit/collect`, scripts mirroring `@alfavit/api` |
| `apps/collect/tsconfig.json` | copy of `apps/api/tsconfig.json` |
| `apps/collect/vitest.config.ts` | copy of `apps/api/vitest.config.ts` |
| `apps/collect/wrangler.toml` | Analytics Engine binding + the `/e` and `/dl/*` routes |
| `apps/collect/src/hash.ts` | daily session hash — isolated so it is directly testable |
| `apps/collect/src/event.ts` | parse + validate + sanitise a beacon body; pure, no Worker APIs |
| `apps/collect/src/app.ts` | Hono app: `POST /e`, `GET /dl/:platform` |
| `apps/collect/src/index.ts` | Worker entry — `export default createApp()` |
| `apps/collect/src/tests/*.test.ts` | one file per module above |

**New — client:**

| File | Responsibility |
|---|---|
| `apps/web/src/analytics/track.ts` | `track()` — build payload, `sendBeacon`, swallow everything |
| `apps/web/src/analytics/useTrackPageview.ts` | fire `pageview` on route change |
| `apps/web/src/tests/track.test.ts` | helper behaviour, including the no-text guarantee |

**New — read path:**

| File | Responsibility |
|---|---|
| `scripts/metrics.mjs` | query the SQL API, print the Monday review block |

**Modified:**

| File | Change |
|---|---|
| `apps/web/src/components/RootLayout.tsx` | mount the pageview hook |
| `apps/web/src/components/Converter.tsx:21` | `transliterate` + `copy` events |
| `apps/web/src/components/FileConverter.tsx:18` | `file_convert` event |
| `apps/web/src/components/Channels.tsx:35,45` | installer hrefs → `/dl/mac`, `/dl/win`; `outbound` on external links |
| `apps/web/src/tests/Channels.test.tsx:21` | asserts the old hrefs — must change in the same commit |
| `apps/web/src/pages/PrivacyPage.tsx` | disclose first-party event counting |
| `docs/marketing/metrics.md` | correct the false baseline; add event KPIs |
| `docs/deployment.md` | document the fourth deployable |
| `.github/workflows/deploy.yml` | `collect` job |
| `package.json` | `"metrics"` script |

`scripts/metrics.mjs` is **plain ESM JavaScript, not TypeScript**, deliberately: it is the only file outside the build graph, and making it TS would mean adding `tsx` or a build step to a repo that currently needs neither. JSDoc types carry the intent.

---

## Task 1: Collector scaffold and the daily session hash

**Files:**
- Create: `apps/collect/package.json`, `apps/collect/tsconfig.json`, `apps/collect/vitest.config.ts`, `apps/collect/wrangler.toml`
- Create: `apps/collect/src/hash.ts`
- Test: `apps/collect/src/tests/hash.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `utcDay(now: Date): string` returning `YYYY-MM-DD`; `sessionHash(ip: string, ua: string, day: string, secret: string): Promise<string>` returning 16 lowercase hex characters.

- [ ] **Step 1: Create the package scaffold**

`apps/collect/package.json`:

```json
{
  "name": "@alfavit/collect",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "build": "tsc -p tsconfig.json",
    "test": "vitest run"
  },
  "dependencies": {
    "hono": "^4.6.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20240909.0",
    "typescript": "^5.5.0",
    "vitest": "^2.0.0",
    "wrangler": "^4.36.0"
  }
}
```

`apps/collect/tsconfig.json` — identical to `apps/api/tsconfig.json`:

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

`apps/collect/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { include: ['src/**/*.test.ts'] } })
```

`apps/collect/wrangler.toml` — note this Worker has **no** `custom_domain`; it attaches to paths on a hostname Pages already serves:

```toml
name = "alfavit-collect"
main = "src/index.ts"
compatibility_date = "2025-01-01"

# Paths on the alfavit.uz zone. Pages serves everything else on this hostname.
routes = [
  { pattern = "alfavit.uz/e", zone_name = "alfavit.uz" },
  { pattern = "alfavit.uz/dl/*", zone_name = "alfavit.uz" },
]

[[analytics_engine_datasets]]
binding = "ANALYTICS"
dataset = "alfavit_events"
```

- [ ] **Step 2: Install and confirm the workspace picks it up**

Run: `pnpm install`
Expected: `apps/collect` resolves as `@alfavit/collect`; no lockfile errors.

- [ ] **Step 3: Write the failing test**

`apps/collect/src/tests/hash.test.ts`:

```ts
import { expect, test } from 'vitest'
import { sessionHash, utcDay } from '../hash'

const IP = '213.230.90.1'
const UA = 'Mozilla/5.0 (Linux; Android 13)'
const SECRET = 'test-secret'

test('utcDay formats as YYYY-MM-DD', () => {
  expect(utcDay(new Date('2026-09-12T22:32:43Z'))).toBe('2026-09-12')
})

test('hash is 16 lowercase hex characters', async () => {
  const h = await sessionHash(IP, UA, '2026-09-12', SECRET)
  expect(h).toMatch(/^[0-9a-f]{16}$/)
})

test('same visitor on the same day hashes identically', async () => {
  const a = await sessionHash(IP, UA, '2026-09-12', SECRET)
  const b = await sessionHash(IP, UA, '2026-09-12', SECRET)
  expect(a).toBe(b)
})

test('same visitor on a different day hashes differently', async () => {
  const a = await sessionHash(IP, UA, '2026-09-12', SECRET)
  const b = await sessionHash(IP, UA, '2026-09-13', SECRET)
  expect(a).not.toBe(b)
})

test('different visitors on the same day hash differently', async () => {
  const a = await sessionHash(IP, UA, '2026-09-12', SECRET)
  const b = await sessionHash('84.54.79.2', UA, '2026-09-12', SECRET)
  expect(a).not.toBe(b)
})

test('the raw IP never appears in the output', async () => {
  const h = await sessionHash(IP, UA, '2026-09-12', SECRET)
  expect(h).not.toContain(IP)
  expect(h).not.toContain('213')
})

test('the secret changes the output', async () => {
  const a = await sessionHash(IP, UA, '2026-09-12', SECRET)
  const b = await sessionHash(IP, UA, '2026-09-12', 'other-secret')
  expect(a).not.toBe(b)
})
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `cd apps/collect && pnpm test`
Expected: FAIL — `Failed to resolve import "../hash"`.

- [ ] **Step 5: Write the implementation**

`apps/collect/src/hash.ts`:

```ts
/** UTC calendar day, the rotation window for session hashes. */
export function utcDay(now: Date): string {
  return now.toISOString().slice(0, 10)
}

/**
 * Groups requests into a visit without storing anything about the visitor.
 *
 * The IP arrives from CF-Connecting-IP, is mixed into the digest, and is never
 * written anywhere. Including the day means yesterday's hashes cannot be joined
 * to today's, so the identifier decays on its own every midnight UTC.
 */
export async function sessionHash(
  ip: string,
  ua: string,
  day: string,
  secret: string,
): Promise<string> {
  const data = new TextEncoder().encode(`${ip}|${ua}|${day}|${secret}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)]
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `cd apps/collect && pnpm test`
Expected: PASS — 7 tests.

- [ ] **Step 7: Commit**

```bash
git add apps/collect/package.json apps/collect/tsconfig.json apps/collect/vitest.config.ts apps/collect/wrangler.toml apps/collect/src/hash.ts apps/collect/src/tests/hash.test.ts pnpm-lock.yaml
git commit -m "feat(collect): scaffold the collector Worker and the daily session hash"
```

---

## Task 2: Route precedence gate — OWNER STEP, BLOCKING FOR DEPLOY ONLY

This is the spec's one unproven assumption. Do it before writing any deploy-shaped
code. **Tasks 3–9 do not depend on the outcome** — the event schema, parsing,
client helper and read path are identical either way — so they can proceed while
this is pending. Only Task 11's CI job and the final deploy depend on it.

**Files:** Create `apps/collect/src/index.ts` and a temporary stub `apps/collect/src/app.ts`.

**Interfaces:**
- Produces: `createApp()` returning a Hono app — the real one replaces the stub in Task 4.

- [ ] **Step 1: Write the stub**

`apps/collect/src/app.ts` (temporary — Task 4 replaces the body):

```ts
import { Hono } from 'hono'

export function createApp() {
  const app = new Hono()
  app.get('/e', (c) => c.text('collect-ok'))
  return app
}
```

`apps/collect/src/index.ts`:

```ts
import { createApp } from './app'

export default createApp()
```

- [ ] **Step 2: Owner authenticates wrangler**

There is currently no wrangler session on this machine (`~/.wrangler/config` is empty).

```bash
pnpm exec wrangler login
```

- [ ] **Step 3: Owner deploys the stub**

```bash
cd apps/collect && pnpm exec wrangler deploy
```

Expected: `Uploaded alfavit-collect`, then two route assertions against the
`alfavit.uz` zone. An `Authentication error [code: 10000]` on a `/zones/.../workers/routes`
path means the token lacks **Zone · Workers Routes · Edit** — see `docs/deployment.md § CI API token scopes`.

- [ ] **Step 4: Verify the Worker wins the route and Pages still serves everything else**

```bash
curl -s https://alfavit.uz/e
curl -s -o /dev/null -w "%{http_code}\n" https://alfavit.uz/
curl -s -o /dev/null -w "%{http_code}\n" https://alfavit.uz/apps
curl -s -o /dev/null -w "%{http_code} %{size_download}\n" https://alfavit.uz/download/Alfavit.dmg
```

Expected: `collect-ok`, then `200`, `200`, and `200` with ~6.7 MB.

**PASS** → continue to Task 3, approach unchanged.

**FAIL** (the Worker does not intercept, or Pages routes break) → switch to the
spec's pre-agreed fallback: move the collector to `apps/web/functions/e.ts` as a
Pages Function and set `workingDirectory: apps/web` on the web job's
`wrangler-action`. The event schema, `event.ts`, `hash.ts`, the client helper and
`scripts/metrics.mjs` are all unchanged — only the collector's home and its deploy
job differ. Record the outcome in the spec's "Open question" section either way.

- [ ] **Step 5: Commit the stub**

```bash
git add apps/collect/src/app.ts apps/collect/src/index.ts
git commit -m "feat(collect): worker entry point and route-precedence stub"
```

---

## Task 3: Beacon parsing, validation and sanitisation

The privacy guarantees live here, in a pure module with no Worker APIs, so they
can be tested exhaustively without a network or a binding.

**Files:**
- Create: `apps/collect/src/event.ts`
- Test: `apps/collect/src/tests/event.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `EVENTS: readonly EventName[]` — the six allowed names
  - `type EventName = 'pageview' | 'transliterate' | 'file_convert' | 'copy' | 'download' | 'outbound'`
  - `interface ParsedEvent { event: EventName; path: string; locale: string; referrerHost: string; utmSource: string; utmMedium: string; utmCampaign: string; detail: string }`
  - `parseBeacon(body: unknown): ParsedEvent | null` — `null` means reject with 400

- [ ] **Step 1: Write the failing test**

`apps/collect/src/tests/event.test.ts`:

```ts
import { expect, test } from 'vitest'
import { parseBeacon } from '../event'

const base = { e: 'pageview', u: 'https://alfavit.uz/apps', r: 'https://t.co/abc123' }

test('parses a well-formed pageview', () => {
  const p = parseBeacon(base)
  expect(p).not.toBeNull()
  expect(p!.event).toBe('pageview')
  expect(p!.path).toBe('/apps')
  expect(p!.referrerHost).toBe('t.co')
})

test('extracts exactly the three utm parameters', () => {
  const p = parseBeacon({
    ...base,
    u: 'https://alfavit.uz/?utm_source=gazeta&utm_medium=press&utm_campaign=senate-2026-09',
  })
  expect(p!.utmSource).toBe('gazeta')
  expect(p!.utmMedium).toBe('press')
  expect(p!.utmCampaign).toBe('senate-2026-09')
})

test('drops every other query parameter and never keeps a query string in the path', () => {
  const p = parseBeacon({
    ...base,
    u: 'https://alfavit.uz/apps?utm_source=x&token=SECRET123&email=a@b.com',
  })
  expect(p!.path).toBe('/apps')
  expect(p!.utmSource).toBe('x')
  expect(JSON.stringify(p)).not.toContain('SECRET123')
  expect(JSON.stringify(p)).not.toContain('a@b.com')
})

test('derives locale from the path prefix', () => {
  expect(parseBeacon({ ...base, u: 'https://alfavit.uz/ru/alphabet' })!.locale).toBe('ru')
  expect(parseBeacon({ ...base, u: 'https://alfavit.uz/en/apps' })!.locale).toBe('en')
  expect(parseBeacon({ ...base, u: 'https://alfavit.uz/alphabet' })!.locale).toBe('uz')
})

test('an absent or same-site referrer records as direct', () => {
  expect(parseBeacon({ ...base, r: '' })!.referrerHost).toBe('direct')
  expect(parseBeacon({ ...base, r: 'not a url' })!.referrerHost).toBe('direct')
})

test('rejects an unknown event name', () => {
  expect(parseBeacon({ ...base, e: 'exfiltrate' })).toBeNull()
})

test('rejects a missing or malformed body', () => {
  expect(parseBeacon(null)).toBeNull()
  expect(parseBeacon({})).toBeNull()
  expect(parseBeacon({ e: 'pageview' })).toBeNull()
  expect(parseBeacon({ e: 'pageview', u: 'not a url' })).toBeNull()
})

test('detail is allowlisted to short slug characters', () => {
  expect(parseBeacon({ ...base, e: 'download', d: 'mac' })!.detail).toBe('mac')
  expect(parseBeacon({ ...base, e: 'transliterate', d: 'cyrillic-latin' })!.detail).toBe('cyrillic-latin')
  // Anything that is not a short slug is dropped rather than stored.
  expect(parseBeacon({ ...base, e: 'copy', d: 'салом дунё' })!.detail).toBe('')
  expect(parseBeacon({ ...base, e: 'copy', d: 'a'.repeat(100) })!.detail).toBe('')
})

test('a beacon carrying unexpected fields cannot smuggle them through', () => {
  const p = parseBeacon({ ...base, text: 'салом дунё', input: 'secret' })
  expect(JSON.stringify(p)).not.toContain('салом')
  expect(JSON.stringify(p)).not.toContain('secret')
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/collect && pnpm test event`
Expected: FAIL — `Failed to resolve import "../event"`.

- [ ] **Step 3: Write the implementation**

`apps/collect/src/event.ts`:

```ts
export const EVENTS = [
  'pageview',
  'transliterate',
  'file_convert',
  'copy',
  'download',
  'outbound',
] as const

export type EventName = (typeof EVENTS)[number]

export interface ParsedEvent {
  event: EventName
  path: string
  locale: string
  referrerHost: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
  detail: string
}

/** Short, lowercase slugs only. Anything else is dropped, not truncated —
 * truncating invites the assumption that longer values are merely trimmed. */
const DETAIL = /^[a-z0-9_-]{1,32}$/

function slug(v: unknown): string {
  return typeof v === 'string' && DETAIL.test(v) ? v : ''
}

function utmValue(params: URLSearchParams, key: string): string {
  return slug(params.get(key)?.toLowerCase() ?? '')
}

function localeOf(pathname: string): string {
  const first = pathname.split('/').filter(Boolean)[0]
  return first === 'ru' || first === 'en' ? first : 'uz'
}

function hostOf(referrer: unknown): string {
  if (typeof referrer !== 'string' || referrer === '') return 'direct'
  try {
    return new URL(referrer).host || 'direct'
  } catch {
    return 'direct'
  }
}

/**
 * Turns a raw beacon body into exactly the fields the schema stores.
 *
 * This is an allowlist, not a filter: the returned object is built field by
 * field, so anything the client sends that is not named here cannot reach
 * storage even if a future client version starts sending it by mistake.
 */
export function parseBeacon(body: unknown): ParsedEvent | null {
  if (typeof body !== 'object' || body === null) return null
  const b = body as Record<string, unknown>

  if (typeof b.e !== 'string' || !(EVENTS as readonly string[]).includes(b.e)) return null
  if (typeof b.u !== 'string') return null

  let url: URL
  try {
    url = new URL(b.u)
  } catch {
    return null
  }

  return {
    event: b.e as EventName,
    path: url.pathname,
    locale: localeOf(url.pathname),
    referrerHost: hostOf(b.r),
    utmSource: utmValue(url.searchParams, 'utm_source'),
    utmMedium: utmValue(url.searchParams, 'utm_medium'),
    utmCampaign: utmValue(url.searchParams, 'utm_campaign'),
    detail: slug(b.d),
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd apps/collect && pnpm test event`
Expected: PASS — 9 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/collect/src/event.ts apps/collect/src/tests/event.test.ts
git commit -m "feat(collect): allowlist beacon parsing, dropping everything but the schema fields"
```

---

## Task 4: `POST /e` writes one data point

**Files:**
- Modify: `apps/collect/src/app.ts` (replaces the Task 2 stub entirely)
- Test: `apps/collect/src/tests/app.test.ts`

**Interfaces:**
- Consumes: `parseBeacon`, `ParsedEvent` from `./event`; `sessionHash`, `utcDay` from `./hash`.
- Produces: `createApp()`; `interface Bindings { ANALYTICS?: AnalyticsEngineDataset; SESSION_SECRET?: string }`.

- [ ] **Step 1: Write the failing test**

`apps/collect/src/tests/app.test.ts`:

```ts
import { expect, test } from 'vitest'
import { createApp } from '../app'

interface Point { indexes: string[]; blobs: string[]; doubles: number[] }

function fakeEnv() {
  const points: Point[] = []
  return {
    points,
    env: {
      SESSION_SECRET: 'test-secret',
      ANALYTICS: { writeDataPoint: (p: Point) => { points.push(p) } },
    },
  }
}

function beacon(body: unknown, headers: Record<string, string> = {}) {
  return new Request('https://alfavit.uz/e', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'cf-connecting-ip': '213.230.90.1', ...headers },
    body: JSON.stringify(body),
  })
}

const PAGEVIEW = { e: 'pageview', u: 'https://alfavit.uz/apps?utm_source=x&utm_medium=post&utm_campaign=senate-2026-09', r: 'https://t.co/abc' }

test('a valid beacon writes exactly one data point and returns 204', async () => {
  const { points, env } = fakeEnv()
  const res = await createApp().fetch(beacon(PAGEVIEW), env)
  expect(res.status).toBe(204)
  expect(points).toHaveLength(1)
})

test('the data point matches the schema positions', async () => {
  const { points, env } = fakeEnv()
  await createApp().fetch(beacon(PAGEVIEW), env)
  const [p] = points
  expect(p.indexes).toEqual(['pageview'])
  expect(p.blobs[0]).toBe('/apps')          // blob1 path
  expect(p.blobs[1]).toBe('uz')             // blob2 locale
  expect(p.blobs[2]).toBe('t.co')           // blob3 referrer host
  expect(p.blobs[3]).toBe('x')              // blob4 utm_source
  expect(p.blobs[4]).toBe('post')           // blob5 utm_medium
  expect(p.blobs[5]).toBe('senate-2026-09') // blob6 utm_campaign
  expect(p.blobs[7]).toBe('desktop')        // blob8 device (no UA → desktop)
  expect(p.blobs[8]).toMatch(/^[0-9a-f]{16}$/) // blob9 session hash
  expect(p.doubles).toEqual([1])
})

test('the raw IP is never written', async () => {
  const { points, env } = fakeEnv()
  await createApp().fetch(beacon(PAGEVIEW), env)
  expect(JSON.stringify(points)).not.toContain('213.230.90.1')
})

test('an Android user agent is classified as mobile', async () => {
  const { points, env } = fakeEnv()
  await createApp().fetch(beacon(PAGEVIEW, { 'user-agent': 'Mozilla/5.0 (Linux; Android 13; SM-A125F)' }), env)
  expect(points[0].blobs[7]).toBe('mobile')
})

test('an iPad user agent is classified as tablet', async () => {
  const { points, env } = fakeEnv()
  await createApp().fetch(beacon(PAGEVIEW, { 'user-agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)' }), env)
  expect(points[0].blobs[7]).toBe('tablet')
})

test('an unknown event name is rejected and writes nothing', async () => {
  const { points, env } = fakeEnv()
  const res = await createApp().fetch(beacon({ ...PAGEVIEW, e: 'exfiltrate' }), env)
  expect(res.status).toBe(400)
  expect(points).toHaveLength(0)
})

test('malformed JSON is rejected and writes nothing', async () => {
  const { points, env } = fakeEnv()
  const req = new Request('https://alfavit.uz/e', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{not json',
  })
  expect((await createApp().fetch(req, env)).status).toBe(400)
  expect(points).toHaveLength(0)
})

test('a missing ANALYTICS binding degrades to 204 rather than erroring', async () => {
  const res = await createApp().fetch(beacon(PAGEVIEW), { SESSION_SECRET: 's' })
  expect(res.status).toBe(204)
})

test('GET /e is not a write path', async () => {
  const { points, env } = fakeEnv()
  const res = await createApp().fetch(new Request('https://alfavit.uz/e'), env)
  expect(res.status).toBe(405)
  expect(points).toHaveLength(0)
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/collect && pnpm test app`
Expected: FAIL — the stub has no `POST /e`, so the first assertion gets 404.

- [ ] **Step 3: Write the implementation**

`apps/collect/src/app.ts` — replace the whole file:

```ts
import { Hono } from 'hono'
import { parseBeacon, type ParsedEvent } from './event'
import { sessionHash, utcDay } from './hash'

export interface Bindings {
  ANALYTICS?: AnalyticsEngineDataset
  SESSION_SECRET?: string
}

/** Coarse enough to be useful, coarse enough not to be identifying. */
export function deviceClass(ua: string): string {
  if (/iPad|Tablet/i.test(ua)) return 'tablet'
  if (/Mobi|Android|iPhone/i.test(ua)) return 'mobile'
  return 'desktop'
}

async function write(c: { env: Bindings; req: { header: (n: string) => string | undefined } }, parsed: ParsedEvent, country: string) {
  const dataset = c.env?.ANALYTICS
  if (!dataset) return // local dev and tests without a binding: silently no-op

  const ip = c.req.header('cf-connecting-ip') ?? ''
  const ua = c.req.header('user-agent') ?? ''
  const session = await sessionHash(ip, ua, utcDay(new Date()), c.env.SESSION_SECRET ?? '')

  dataset.writeDataPoint({
    indexes: [parsed.event],
    blobs: [
      parsed.path,          // blob1
      parsed.locale,        // blob2
      parsed.referrerHost,  // blob3
      parsed.utmSource,     // blob4
      parsed.utmMedium,     // blob5
      parsed.utmCampaign,   // blob6
      country,              // blob7
      deviceClass(ua),      // blob8
      session,              // blob9
      parsed.detail,        // blob10
    ],
    doubles: [1],
  })
}

export function createApp() {
  const app = new Hono<{ Bindings: Bindings }>()

  app.post('/e', async (c) => {
    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      return c.text('', 400)
    }
    const parsed = parseBeacon(body)
    if (!parsed) return c.text('', 400)

    const country = (c.req.raw as Request & { cf?: { country?: string } }).cf?.country ?? 'XX'
    await write(c, parsed, country)
    return c.body(null, 204)
  })

  app.all('/e', (c) => c.text('', 405))

  return app
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd apps/collect && pnpm test`
Expected: PASS — 9 app tests plus the 7 hash and 9 event tests already green.

- [ ] **Step 5: Commit**

```bash
git add apps/collect/src/app.ts apps/collect/src/tests/app.test.ts
git commit -m "feat(collect): POST /e writes one Analytics Engine data point per beacon"
```

---

## Task 5: Counted installer downloads at `/dl/:platform`

A counted route rather than a click beacon, because a beacon misses anyone with
JS disabled or a blocked script — and installer downloads are currently at zero,
so the measurement needs to be the reliable kind.

**Files:**
- Modify: `apps/collect/src/app.ts`
- Test: `apps/collect/src/tests/download.test.ts`

**Interfaces:**
- Consumes: `createApp`, `Bindings` from `./app`.
- Produces: `INSTALLERS: Record<string, string>` exported from `./app`, mapping `mac` → `/download/Alfavit.dmg` and `win` → `/download/Alfavit-Setup.exe`.

- [ ] **Step 1: Write the failing test**

`apps/collect/src/tests/download.test.ts`:

```ts
import { expect, test } from 'vitest'
import { createApp } from '../app'

interface Point { indexes: string[]; blobs: string[]; doubles: number[] }

function fakeEnv() {
  const points: Point[] = []
  return {
    points,
    env: {
      SESSION_SECRET: 'test-secret',
      ANALYTICS: { writeDataPoint: (p: Point) => { points.push(p) } },
    },
  }
}

const get = (path: string) =>
  new Request(`https://alfavit.uz${path}`, { headers: { 'cf-connecting-ip': '213.230.90.1' } })

test('/dl/mac redirects to the hosted dmg', async () => {
  const { env } = fakeEnv()
  const res = await createApp().fetch(get('/dl/mac'), env)
  expect(res.status).toBe(302)
  expect(res.headers.get('location')).toBe('/download/Alfavit.dmg')
})

test('/dl/win redirects to the hosted exe', async () => {
  const { env } = fakeEnv()
  const res = await createApp().fetch(get('/dl/win'), env)
  expect(res.status).toBe(302)
  expect(res.headers.get('location')).toBe('/download/Alfavit-Setup.exe')
})

test('a download writes one point tagged with the platform', async () => {
  const { points, env } = fakeEnv()
  await createApp().fetch(get('/dl/mac'), env)
  expect(points).toHaveLength(1)
  expect(points[0].indexes).toEqual(['download'])
  expect(points[0].blobs[9]).toBe('mac') // blob10 detail
})

test('an unknown platform 404s and is not an open redirect', async () => {
  const { points, env } = fakeEnv()
  const res = await createApp().fetch(get('/dl/https://evil.example.com'), env)
  expect(res.status).toBe(404)
  expect(res.headers.get('location')).toBeNull()
  expect(points).toHaveLength(0)
})

test('the redirect still happens when the analytics binding is missing', async () => {
  const res = await createApp().fetch(get('/dl/win'), { SESSION_SECRET: 's' })
  expect(res.status).toBe(302)
  expect(res.headers.get('location')).toBe('/download/Alfavit-Setup.exe')
})

test('utm parameters on a download link are preserved in the data point', async () => {
  const { points, env } = fakeEnv()
  await createApp().fetch(get('/dl/mac?utm_source=telegram&utm_medium=post&utm_campaign=senate-2026-09'), env)
  expect(points[0].blobs[3]).toBe('telegram')
  expect(points[0].blobs[4]).toBe('post')
  expect(points[0].blobs[5]).toBe('senate-2026-09')
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/collect && pnpm test download`
Expected: FAIL — `/dl/mac` returns 404.

- [ ] **Step 3: Add the route**

In `apps/collect/src/app.ts`, add the export above `createApp`:

```ts
/** The only two redirect targets. A map, not string interpolation, so a crafted
 * platform value cannot become an open redirect. */
export const INSTALLERS: Record<string, string> = {
  mac: '/download/Alfavit.dmg',
  win: '/download/Alfavit-Setup.exe',
}
```

and inside `createApp`, before `return app`:

```ts
  app.get('/dl/:platform', async (c) => {
    const platform = c.req.param('platform')
    const target = INSTALLERS[platform]
    if (!target) return c.text('', 404)

    const parsed = parseBeacon({ e: 'download', u: c.req.url, r: c.req.header('referer') ?? '', d: platform })
    if (parsed) {
      const country = (c.req.raw as Request & { cf?: { country?: string } }).cf?.country ?? 'XX'
      await write(c, parsed, country)
    }
    return c.redirect(target, 302)
  })
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd apps/collect && pnpm test`
Expected: PASS — all four test files green.

- [ ] **Step 5: Commit**

```bash
git add apps/collect/src/app.ts apps/collect/src/tests/download.test.ts
git commit -m "feat(collect): counted installer downloads at /dl/mac and /dl/win"
```

---

## Task 6: The client `track()` helper

**Files:**
- Create: `apps/web/src/analytics/track.ts`
- Test: `apps/web/src/tests/track.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `track(event: EventName, detail?: string): void` and `type EventName = 'pageview' | 'transliterate' | 'file_convert' | 'copy' | 'download' | 'outbound'`.

- [ ] **Step 1: Write the failing test**

`apps/web/src/tests/track.test.ts`:

```ts
import { expect, test, beforeEach, vi } from 'vitest'
import { track } from '../analytics/track'

let sent: Array<{ url: string; body: string }>

beforeEach(() => {
  sent = []
  Object.defineProperty(navigator, 'sendBeacon', {
    configurable: true,
    writable: true,
    value: (url: string, body: string) => { sent.push({ url, body }); return true },
  })
})

test('posts to the same-origin collector endpoint', () => {
  track('pageview')
  expect(sent).toHaveLength(1)
  expect(sent[0].url).toBe('/e')
})

test('sends the event name, the current url and the referrer', () => {
  track('copy')
  const body = JSON.parse(sent[0].body)
  expect(body.e).toBe('copy')
  expect(typeof body.u).toBe('string')
  expect('r' in body).toBe(true)
})

test('sends a detail slug when given one', () => {
  track('transliterate', 'cyrillic-latin')
  expect(JSON.parse(sent[0].body).d).toBe('cyrillic-latin')
})

test('the payload carries exactly four keys and nothing else', () => {
  track('transliterate', 'cyrillic-latin')
  expect(Object.keys(JSON.parse(sent[0].body)).sort()).toEqual(['d', 'e', 'r', 'u'])
})

test('does not throw when sendBeacon is absent', () => {
  Object.defineProperty(navigator, 'sendBeacon', { configurable: true, writable: true, value: undefined })
  expect(() => track('pageview')).not.toThrow()
})

test('does not throw when sendBeacon returns false', () => {
  Object.defineProperty(navigator, 'sendBeacon', {
    configurable: true, writable: true, value: () => false,
  })
  expect(() => track('pageview')).not.toThrow()
})

test('does not throw when sendBeacon itself throws', () => {
  Object.defineProperty(navigator, 'sendBeacon', {
    configurable: true,
    writable: true,
    value: () => { throw new Error('blocked by extension') },
  })
  expect(() => track('pageview')).not.toThrow()
})

test('never logs to the console', () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  Object.defineProperty(navigator, 'sendBeacon', {
    configurable: true, writable: true, value: () => { throw new Error('nope') },
  })
  track('pageview')
  expect(spy).not.toHaveBeenCalled()
  spy.mockRestore()
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/web && pnpm test track`
Expected: FAIL — `Failed to resolve import "../analytics/track"`.

- [ ] **Step 3: Write the implementation**

`apps/web/src/analytics/track.ts`:

```ts
export type EventName =
  | 'pageview'
  | 'transliterate'
  | 'file_convert'
  | 'copy'
  | 'download'
  | 'outbound'

const ENDPOINT = '/e'

/**
 * Fire-and-forget event beacon.
 *
 * Four fields, ever: event name, current URL, referrer, and an optional short
 * slug. The user's text is never among them — the converter reports a direction,
 * not its input. Everything here is wrapped so that an adblocker, a missing
 * sendBeacon, or a thrown error can never surface to the person using the site.
 */
export function track(event: EventName, detail = ''): void {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') return
    const body = JSON.stringify({
      e: event,
      u: window.location.href,
      r: document.referrer,
      d: detail,
    })
    navigator.sendBeacon(ENDPOINT, body)
  } catch {
    /* analytics must never break the page */
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd apps/web && pnpm test track`
Expected: PASS — 8 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/analytics/track.ts apps/web/src/tests/track.test.ts
git commit -m "feat(web): fire-and-forget track() helper for first-party events"
```

---

## Task 7: Pageviews on every route change

The site is an SPA — Cloudflare's RUM already attributes 290 of 980 page views to
soft navigations — so a load-time-only beacon would undercount by roughly a third.

**Files:**
- Create: `apps/web/src/analytics/useTrackPageview.ts`
- Modify: `apps/web/src/components/RootLayout.tsx`
- Test: `apps/web/src/tests/useTrackPageview.test.tsx`

**Interfaces:**
- Consumes: `track` from `../analytics/track`; `useLocation` from `react-router-dom`.
- Produces: `useTrackPageview(): void`.

- [ ] **Step 1: Write the failing test**

`apps/web/src/tests/useTrackPageview.test.tsx`:

```tsx
import { render } from '@testing-library/react'
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { expect, test, beforeEach } from 'vitest'
import { useTrackPageview } from '../analytics/useTrackPageview'

let sent: string[]

beforeEach(() => {
  sent = []
  Object.defineProperty(navigator, 'sendBeacon', {
    configurable: true,
    writable: true,
    value: (_url: string, body: string) => { sent.push(body); return true },
  })
})

function Harness() {
  useTrackPageview()
  return (
    <Routes>
      <Route path="/" element={<Link to="/apps">apps</Link>} />
      <Route path="/apps" element={<p>apps page</p>} />
    </Routes>
  )
}

test('fires one pageview on first render', () => {
  render(<MemoryRouter initialEntries={['/']}><Harness /></MemoryRouter>)
  expect(sent).toHaveLength(1)
  expect(JSON.parse(sent[0]).e).toBe('pageview')
})

test('fires again on a soft navigation', async () => {
  render(<MemoryRouter initialEntries={['/']}><Harness /></MemoryRouter>)
  await userEvent.click(await import('@testing-library/react').then((m) => m.screen.getByText('apps')))
  expect(sent).toHaveLength(2)
})

test('does not fire twice for the same path', () => {
  const { rerender } = render(<MemoryRouter initialEntries={['/']}><Harness /></MemoryRouter>)
  rerender(<MemoryRouter initialEntries={['/']}><Harness /></MemoryRouter>)
  expect(sent.length).toBeGreaterThanOrEqual(1)
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/web && pnpm test useTrackPageview`
Expected: FAIL — `Failed to resolve import "../analytics/useTrackPageview"`.

- [ ] **Step 3: Write the hook**

`apps/web/src/analytics/useTrackPageview.ts`:

```ts
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { track } from './track'

/**
 * One pageview per path. Keyed on pathname rather than the whole location so a
 * query-string change (a utm-tagged link being cleaned up, say) does not double-count.
 */
export function useTrackPageview(): void {
  const { pathname } = useLocation()
  useEffect(() => {
    track('pageview')
  }, [pathname])
}
```

- [ ] **Step 4: Mount it**

In `apps/web/src/components/RootLayout.tsx`, add the import and call it inside
`RootLayout`, above the `return`:

```tsx
import { useTrackPageview } from '../analytics/useTrackPageview'

export function RootLayout() {
  useTrackPageview()
  return (
    // ...unchanged
```

- [ ] **Step 5: Run the full web suite**

Run: `cd apps/web && pnpm test`
Expected: PASS — the new file plus every existing suite still green.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/analytics/useTrackPageview.ts apps/web/src/components/RootLayout.tsx apps/web/src/tests/useTrackPageview.test.tsx
git commit -m "feat(web): count pageviews on soft navigations, not just first load"
```

---

## Task 8: Converter events — and the test that protects the privacy claim

**Files:**
- Modify: `apps/web/src/components/Converter.tsx`
- Test: `apps/web/src/tests/converterTracking.test.tsx`

**Interfaces:**
- Consumes: `track` from `../analytics/track`; `detectedScript` already returned by `useTransliterate`.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Write the failing test**

`apps/web/src/tests/converterTracking.test.tsx`:

```tsx
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, beforeEach } from 'vitest'
import { renderWithLocale } from './renderApp'
import { Converter } from '../components/Converter'

const SECRET_TEXT = 'салом дунё жуда махфий матн'
let sent: string[]

beforeEach(() => {
  sent = []
  Object.defineProperty(navigator, 'sendBeacon', {
    configurable: true,
    writable: true,
    value: (_url: string, body: string) => { sent.push(body); return true },
  })
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: async () => {} },
  })
})

test('THE PRIVACY GUARANTEE: no beacon ever contains the typed text', async () => {
  renderWithLocale(<Converter />, '/en')
  await userEvent.type(screen.getByLabelText(/input/i), SECRET_TEXT)
  await userEvent.click(screen.getByRole('button', { name: /copy/i }))

  const all = sent.join('\n')
  expect(all).not.toContain(SECRET_TEXT)
  expect(all).not.toContain('салом')
  expect(all).not.toContain('махфий')
  // Nor the transliterated output.
  expect(all).not.toContain('salom')
})

test('typing fires one transliterate event carrying only a direction', async () => {
  renderWithLocale(<Converter />, '/en')
  await userEvent.type(screen.getByLabelText(/input/i), 'салом')

  const events = sent.map((s) => JSON.parse(s)).filter((b) => b.e === 'transliterate')
  expect(events.length).toBe(1)
  expect(events[0].d).toBe('cyrillic')
})

test('transliterate fires once per session, not once per keystroke', async () => {
  renderWithLocale(<Converter />, '/en')
  await userEvent.type(screen.getByLabelText(/input/i), 'салом дунё')
  const count = sent.map((s) => JSON.parse(s)).filter((b) => b.e === 'transliterate').length
  expect(count).toBe(1)
})

test('copying fires a copy event with no detail', async () => {
  renderWithLocale(<Converter />, '/en')
  await userEvent.type(screen.getByLabelText(/input/i), 'салом')
  await userEvent.click(screen.getByRole('button', { name: /copy/i }))
  const copies = sent.map((s) => JSON.parse(s)).filter((b) => b.e === 'copy')
  expect(copies).toHaveLength(1)
  expect(copies[0].d).toBe('')
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/web && pnpm test converterTracking`
Expected: FAIL — no `transliterate` or `copy` beacon is sent.

- [ ] **Step 3: Implement**

In `apps/web/src/components/Converter.tsx`:

```tsx
import { useState, useRef } from 'react'
import { track } from '../analytics/track'
```

Inside `Converter`, after the existing `const [copied, setCopied] = useState(false)`:

```tsx
  // One transliterate event per visit, not one per keystroke: the question is
  // "did this visitor use the converter", not "how fast do they type".
  const reported = useRef(false)
  const reportUse = (script: string) => {
    if (reported.current) return
    reported.current = true
    track('transliterate', script)
  }
```

Change the textarea handler:

```tsx
            onChange={(e) => {
              setInput(e.target.value)
              if (e.target.value.trim() !== '') reportUse(detectedScript)
            }}
```

And the copy handler:

```tsx
  const copy = async () => {
    await navigator.clipboard.writeText(text)
    track('copy')
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd apps/web && pnpm test converterTracking`
Expected: PASS — 4 tests, including the privacy guarantee.

- [ ] **Step 5: Run the whole web suite**

Run: `cd apps/web && pnpm test`
Expected: PASS — existing `Converter` tests unaffected.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/Converter.tsx apps/web/src/tests/converterTracking.test.tsx
git commit -m "feat(web): count converter use and copies, with a test that no text is sent"
```

---

## Task 9: File conversions, installer links and outbound clicks

**Files:**
- Modify: `apps/web/src/components/FileConverter.tsx:18`
- Modify: `apps/web/src/components/Channels.tsx:35,45`
- Modify: `apps/web/src/tests/Channels.test.tsx:21`
- Test: `apps/web/src/tests/channelsTracking.test.tsx`

**Interfaces:**
- Consumes: `track` from `../analytics/track`.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Update the existing Channels test to the new hrefs**

In `apps/web/src/tests/Channels.test.tsx`, line 21 currently reads:

```ts
  expect(downloads).toEqual(['/download/Alfavit.dmg', '/download/Alfavit-Setup.exe'])
```

Replace with:

```ts
  // Counted routes: the collect Worker records the download, then 302s to the installer.
  expect(downloads).toEqual(['/dl/mac', '/dl/win'])
```

- [ ] **Step 2: Write the failing tests**

`apps/web/src/tests/channelsTracking.test.tsx`:

```tsx
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, beforeEach } from 'vitest'
import { renderWithLocale } from './renderApp'
import { Channels } from '../components/Channels'

let sent: string[]

beforeEach(() => {
  localStorage.clear()
  sent = []
  Object.defineProperty(navigator, 'sendBeacon', {
    configurable: true,
    writable: true,
    value: (_url: string, body: string) => { sent.push(body); return true },
  })
})

test('installer links point at the counted routes', () => {
  renderWithLocale(<Channels />, '/en')
  const downloads = screen.getAllByRole('link', { name: 'Download' }).map((a) => a.getAttribute('href'))
  expect(downloads).toEqual(['/dl/mac', '/dl/win'])
})

test('clicking the Telegram link fires an outbound event', async () => {
  renderWithLocale(<Channels />, '/en')
  const telegram = screen.getAllByRole('link', { name: 'Open' })
    .find((a) => a.getAttribute('href') === 'https://t.me/alfavit_uz_bot')!
  await userEvent.click(telegram)
  const events = sent.map((s) => JSON.parse(s)).filter((b) => b.e === 'outbound')
  expect(events).toHaveLength(1)
  expect(events[0].d).toBe('bot')
})
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `cd apps/web && pnpm test channelsTracking`
Expected: FAIL — hrefs are still `/download/...` and no outbound beacon fires.

- [ ] **Step 4: Implement the Channels changes**

In `apps/web/src/components/Channels.tsx`, add the import:

```ts
import { track } from '../analytics/track'
```

Change the two installer hrefs (lines 35 and 45):

```ts
          href: '/dl/mac',
```

```ts
          href: '/dl/win',
```

Add a `trackAs` field to the `Item` interface:

```ts
  trackAs?: 'bot' | 'extension' | 'github' | 'npm'
```

Set `trackAs: 'bot'` on the Telegram item, and `trackAs: 'extension'` on the
extension item. Where the component renders an external `<a>`, add:

```tsx
onClick={() => { if (item.trackAs) track('outbound', item.trackAs) }}
```

- [ ] **Step 5: Implement the FileConverter change**

In `apps/web/src/components/FileConverter.tsx`, add the import:

```ts
import { track } from '../analytics/track'
```

and immediately after the successful conversion on line 18:

```ts
      const { blob, filename } = await convertFile(file)
      // Extension only — never the filename, which is the user's content.
      track('file_convert', file.name.toLowerCase().endsWith('.docx') ? 'docx' : 'txt')
```

- [ ] **Step 6: Run the whole web suite**

Run: `cd apps/web && pnpm test`
Expected: PASS — including the updated `Channels.test.tsx`.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/Channels.tsx apps/web/src/components/FileConverter.tsx apps/web/src/tests/Channels.test.tsx apps/web/src/tests/channelsTracking.test.tsx
git commit -m "feat(web): counted installer routes, file-conversion and outbound events"
```

---

## Task 10: `pnpm metrics` — the Monday review, printed

**Files:**
- Create: `scripts/metrics.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_ANALYTICS_TOKEN` from the environment.
- Produces: a CLI command, `pnpm metrics`.

**Note on `COUNT(DISTINCT)`:** unique sessions are computed by grouping on `blob9`
and counting rows in JavaScript, rather than with `COUNT(DISTINCT blob9)`. At
~400 visits/week the row count is trivial, and this avoids depending on an
Analytics Engine SQL feature whose support was not verified. If a later run
confirms `COUNT(DISTINCT)` works, collapsing these is a one-line simplification.

- [ ] **Step 1: Write the script**

`scripts/metrics.mjs`:

```js
#!/usr/bin/env node
/**
 * Prints the weekly review block defined in docs/marketing/metrics.md.
 *
 * Analytics Engine retains three months, so this output — pasted into
 * metrics.md — is the durable record, not the dataset.
 *
 * Requires, in the local environment only (never in CI):
 *   CLOUDFLARE_ACCOUNT_ID
 *   CLOUDFLARE_ANALYTICS_TOKEN   (Account > Account Analytics > Read)
 */

const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID
const TOKEN = process.env.CLOUDFLARE_ANALYTICS_TOKEN

if (!ACCOUNT || !TOKEN) {
  console.error('Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_ANALYTICS_TOKEN, then re-run.')
  process.exit(1)
}

const ENDPOINT = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/analytics_engine/sql`

/** @param {string} sql @returns {Promise<Array<Record<string, string|number>>>} */
async function query(sql) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}` },
    body: sql,
  })
  if (!res.ok) {
    console.error(`Query failed (${res.status}): ${await res.text()}`)
    process.exit(1)
  }
  const json = await res.json()
  return json.data ?? []
}

const WEEK = "timestamp > NOW() - INTERVAL '7' DAY"

const counts = await query(`
  SELECT index1 AS event, sum(_sample_interval) AS n
  FROM alfavit_events
  WHERE ${WEEK}
  GROUP BY event
  ORDER BY n DESC
`)

const sources = await query(`
  SELECT blob3 AS referrer, blob4 AS source, blob5 AS medium, blob6 AS campaign,
         sum(_sample_interval) AS n
  FROM alfavit_events
  WHERE ${WEEK} AND index1 = 'pageview'
  GROUP BY referrer, source, medium, campaign
  ORDER BY n DESC
  LIMIT 10
`)

const paths = await query(`
  SELECT blob1 AS path, sum(_sample_interval) AS n
  FROM alfavit_events
  WHERE ${WEEK} AND index1 = 'pageview'
  GROUP BY path
  ORDER BY n DESC
  LIMIT 10
`)

const downloads = await query(`
  SELECT blob10 AS platform, sum(_sample_interval) AS n
  FROM alfavit_events
  WHERE ${WEEK} AND index1 = 'download'
  GROUP BY platform
  ORDER BY n DESC
`)

const devices = await query(`
  SELECT blob8 AS device, sum(_sample_interval) AS n
  FROM alfavit_events
  WHERE ${WEEK} AND index1 = 'pageview'
  GROUP BY device
  ORDER BY n DESC
`)

// Unique sessions: group, then count rows. See the note in the plan.
const sessionRows = await query(`
  SELECT blob9 AS session
  FROM alfavit_events
  WHERE ${WEEK} AND index1 = 'pageview'
  GROUP BY session
`)

/** @param {string} event */
const n = (event) => Number(counts.find((r) => r.event === event)?.n ?? 0)

const visits = sessionRows.length
const converted = n('transliterate')
const rate = visits ? ((converted / visits) * 100).toFixed(1) : '0.0'
const today = new Date().toISOString().slice(0, 10)

const line = (rows, key) =>
  rows.length ? rows.map((r) => `${r[key] || '(none)'} ${r.n}`).join(' · ') : '—'

console.log(`
### Week of ${today}

Visits (7d): ${visits}   Pageviews: ${n('pageview')}
Transliterations: ${converted}   → ${rate}% of visits used the converter
File conversions: ${n('file_convert')}   Copies: ${n('copy')}
Downloads: ${line(downloads, 'platform')}
Outbound clicks: ${n('outbound')}
Devices: ${line(devices, 'device')}

Top sources:
${sources.map((r) => `  ${r.referrer} | ${r.source || '—'}/${r.medium || '—'}/${r.campaign || '—'} — ${r.n}`).join('\n') || '  —'}

Top paths:
${paths.map((r) => `  ${r.path} — ${r.n}`).join('\n') || '  —'}

What moved and why (2 sentences):

One thing to try next week:

Bugs / feedback worth fixing (link issues):
`)
```

- [ ] **Step 2: Register the script**

In the root `package.json`, add to `scripts`:

```json
    "metrics": "node scripts/metrics.mjs"
```

- [ ] **Step 3: Verify it fails cleanly without credentials**

Run: `pnpm metrics`
Expected: exit 1 with `Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_ANALYTICS_TOKEN, then re-run.` — and no stack trace.

- [ ] **Step 4: Commit**

```bash
git add scripts/metrics.mjs package.json
git commit -m "feat(metrics): pnpm metrics prints the weekly review from the SQL API"
```

---

## Task 11: CI job, and the docs that are currently wrong

**Files:**
- Modify: `.github/workflows/deploy.yml`
- Modify: `docs/marketing/metrics.md`
- Modify: `apps/web/src/pages/PrivacyPage.tsx`
- Modify: `docs/deployment.md`

- [ ] **Step 1: Add the CI job**

Append to `.github/workflows/deploy.yml`, after the `api` job. Node 22 for the
same reason the `api` job documents — wrangler 4.x refuses to run on Node 20:

```yaml
  collect:
    runs-on: ubuntu-latest
    env:
      CF_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec turbo run build --filter=@alfavit/collect
      # Like the api job, this Worker asserts ZONE routes (alfavit.uz/e and
      # alfavit.uz/dl/*), so CLOUDFLARE_API_TOKEN needs Zone > Workers Routes >
      # Edit with alfavit.uz in Zone Resources. See docs/deployment.md.
      - name: Deploy collect to Cloudflare Workers
        if: env.CF_TOKEN != ''
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          wranglerVersion: '4.110.0'
          packageManager: npm
          workingDirectory: apps/collect
          command: deploy
```

- [ ] **Step 2: Correct the false baseline in `docs/marketing/metrics.md`**

Replace the first baseline row. It currently claims Web Analytics is not enabled
and quotes bot-inflated zone figures:

```markdown
| Site visits/day (Cloudflare Web Analytics — humans, not bots) | ~8–10/day before launch; 383 visits / 706 page views in the 7 days to 12 Sep (~55/day) | Web Analytics → alfavit.uz → Visits |
| Zone requests, 30 days (bots included — do NOT read as visitors) | 45.52k requests, 2.53k "unique visitors" | Analytics & Logs → Traffic |
```

Add a note under the table:

```markdown
**The two numbers above are not comparable.** Zone analytics counts bots, scanners
and `api.alfavit.uz`; Web Analytics counts browsers that ran the beacon. The
earlier "69–148 visitors/day" baseline was the zone number and overstated real
traffic by roughly 10x. Compare Web Analytics to Web Analytics.
```

Replace the `Mac downloads` row, which said "not counted this cycle":

```markdown
| Installer downloads | `pnpm metrics` → Downloads | any non-zero split by platform | Counted at `/dl/mac` and `/dl/win`; 66% of traffic is mobile, so expect small absolute numbers |
```

- [ ] **Step 3: Disclose the event counting on `/privacy`**

In `apps/web/src/pages/PrivacyPage.tsx`, extend the Analytics section (currently
lines 28–34) with a second paragraph, matching the existing plain register:

```tsx
            <p className="mt-3">
              We also count a few actions on this site — a page view, that a
              conversion happened, that a file was converted, that an installer was
              downloaded. These are counts only. The text you type is never sent,
              never stored, and never leaves your browser. There are no cookies and
              no identifier that follows you between days.
            </p>
```

- [ ] **Step 4: Document the fourth deployable in `docs/deployment.md`**

Add a section after the API section:

~~~~markdown
## 4. Event collector → Cloudflare Workers (`alfavit.uz/e`, `/dl/*`)

`apps/collect` receives event beacons and counts installer downloads. Unlike the
API it claims no custom domain — it attaches to two paths on the `alfavit.uz`
zone that Cloudflare Pages otherwise serves, so it needs the same
**Zone · Workers Routes · Edit** scope the API job needs.

One secret, set once:

```
cd apps/collect && pnpm exec wrangler secret put SESSION_SECRET
```

Any long random string. It salts the daily session hash; rotating it simply
starts a new session-grouping window.

Reading the data needs a **separate, read-only** token (Account · Account
Analytics · Read) in your local environment as `CLOUDFLARE_ANALYTICS_TOKEN`.
It is deliberately not a CI secret — nothing in CI reads analytics.
~~~~

- [ ] **Step 5: Run the full suite and build**

Run: `pnpm test && pnpm build`
Expected: all packages green.

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/deploy.yml docs/marketing/metrics.md docs/deployment.md apps/web/src/pages/PrivacyPage.tsx
git commit -m "feat(collect): CI job, honest metrics baseline, privacy disclosure"
```

---

## Task 12: Deploy and verify end to end — OWNER STEP

- [ ] **Step 1: Set the Worker secret**

```bash
cd apps/collect && pnpm exec wrangler secret put SESSION_SECRET
```

- [ ] **Step 2: Merge and let CI deploy**

```bash
git checkout main && git merge analytics-events && git push
```

- [ ] **Step 3: Verify the collector is live**

```bash
curl -s -X POST https://alfavit.uz/e -H 'content-type: application/json' \
  -d '{"e":"pageview","u":"https://alfavit.uz/?utm_source=verify&utm_medium=post&utm_campaign=senate-2026-09","r":"","d":""}' \
  -o /dev/null -w "%{http_code}\n"
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://alfavit.uz/dl/mac
curl -s -o /dev/null -w "%{http_code}\n" https://alfavit.uz/dl/nonsense
```

Expected: `204`, then `302 https://alfavit.uz/download/Alfavit.dmg`, then `404`.

- [ ] **Step 4: Confirm the site still works**

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://alfavit.uz/
curl -s -o /dev/null -w "%{http_code}\n" https://alfavit.uz/apps
curl -s -o /dev/null -w "%{http_code}\n" https://alfavit.uz/guide/keyboard
```

Expected: `200` three times.

- [ ] **Step 5: Read it back**

Wait a few minutes for ingestion, then:

```bash
export CLOUDFLARE_ACCOUNT_ID=... CLOUDFLARE_ANALYTICS_TOKEN=...
pnpm metrics
```

Expected: a review block including the `verify` source from Step 3.

- [ ] **Step 6: Paste the first week's block into `docs/marketing/metrics.md`**

Retention is three months. The pasted block is what survives.

---

## Self-Review

**Spec coverage.** Every spec section maps to a task: schema → 4; six events → 3, 7, 8, 9;
five privacy rules → 1 (no raw IP), 3 (allowlist, no query strings), 6 (fire-and-forget),
8 (no text); collector → 2, 4; `/dl/*` → 5; client helper → 6, 7; read path → 10;
CI + secret → 11, 12; the three doc corrections → 11; verified limits → Global Constraints;
route-precedence gate and fallback → 2.

**Deliberately deferred, and why.** The spec lists `npm` and `github` in the `outbound`
allowlist, but `Channels.tsx` renders no npm or GitHub link today — only Telegram and the
(currently null) extension URL. Task 9 wires `trackAs` for all four values so the plumbing
is there, and tests the two that exist. Adding the others when those links appear is a
one-line change, not a revisit.

**Type consistency.** `track(event, detail)` in Task 6 is called with the same signature in
7, 8 and 9. `parseBeacon` returns `ParsedEvent | null` in Task 3 and is consumed that way in
4 and 5. `sessionHash(ip, ua, day, secret)` in Task 1 is called with four arguments in Task 4.
Blob positions in the Task 4 test (`blobs[0]`…`blobs[9]`) match `blob1`…`blob10` throughout,
and Task 5 asserts `blobs[9]` for the `blob10` detail — the one off-by-one worth re-checking
during review, since the schema is 1-indexed and the array is 0-indexed.
