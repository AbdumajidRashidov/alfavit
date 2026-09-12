# Visitor Analytics — First-Party Event Pipeline

**Date:** 2026-09-12
**Status:** Design — awaiting owner review. Implementation plan to follow.
**Supersedes in part:** [2026-07-15 Privacy-Respecting Analytics](2026-07-15-privacy-analytics-design.md) (that spec stands; this adds an event layer beside it)

## Goal

Answer three questions that Cloudflare Web Analytics structurally cannot:

1. **Which channel actually works** — 37% of traffic arrives via `t.co`, which collapses every post on X into one bucket.
2. **Whether anyone uses the product** — there is currently no signal that a single visitor has transliterated anything.
3. **Whether the desktop apps convert** — installer downloads are static assets and have never been counted.

Without contradicting the site's privacy-first positioning, adding a consent banner, or costing money.

## What we already have (measured 2026-09-12)

Cloudflare Web Analytics **is** enabled for `alfavit.uz` (automatic setup, since mid-July). `docs/marketing/metrics.md` says it is not — that line is wrong and its baseline row reads zone HTTP analytics instead, which counts bots, scanners and `api.alfavit.uz`.

The two sources differ by roughly 10x:

| Window | Zone HTTP analytics | Web Analytics (RUM) |
|---|---|---|
| 30 days | 45.52k requests, 2.53k "unique visitors", peak 476/day | — |
| 21 days | — | 500 visits, 980 page views *(rounded to 10s)* |
| 7 days | — | 383 visits, 706 page views |
| 24 hours | 476 unique visitors | 54 visits, 112 page views |

Real pre-launch traffic was ~8–10 visits/day, not 69–148. Post-launch is ~55/day — a genuine 5–6x step change, correctly measured.

**Audience (last 7 days, exact):** Uzbekistan 311 (81%), US 23, Turkey 13, Korea 6, Germany 5, Russia 5; 19 countries. Mobile 252 vs desktop 130 (**66% mobile**), Android 154 vs iOS 50 (**3:1**), and 55 visits (14%) from `ChromeMobileWebview` — in-app browsers, i.e. links tapped inside Telegram.

**Referrers:** `t.co` 143 (37%), direct 103 (27%), `www.google.com` 90 (23%), LinkedIn 19, `yandex.uz` 8.

**Landing paths:** `/` 249, `/alphabet` 87, `/reform` 20, `/ru/alphabet` 10, `/apps` **4**.

Two conclusions shape this design: the audience is overwhelmingly mobile and Uzbek, and the pages that carry the product (`/apps`, the three guides) are effectively undiscovered.

## Decisions

- **Storage: Cloudflare Workers Analytics Engine.** First-party, cookieless, no consent banner, free tier far above this volume. Queried with the SQL API.
- **Collector: a fourth Worker, `apps/collect`, on a same-origin route `alfavit.uz/e`.** Rejected alternatives: a Pages Function (CI deploys `wrangler pages deploy apps/web/dist` from the repo root, so the `functions/` convention needs a CI working-directory change plus Pages-specific binding config); extending `alfavit-api` (cross-origin, and it would corrupt the "API requests" KPI the project already tracks).
- **Session grouping: a rotating daily hash**, `SHA-256(ip + user-agent + YYYY-MM-DD + secret)`, computed in the Worker and truncated to 16 hex characters. The raw IP is read from the request header, used in the hash, and never written anywhere. The date component means yesterday's hashes cannot be joined to today's.
- **Read path: a CLI script**, `pnpm metrics`, that prints the weekly-review block `docs/marketing/metrics.md` already defines. No dashboard in this cycle.

## Architecture

```
browser                          edge                        storage
────────────────────────────────────────────────────────────────────────
track(event, props)
  └─ navigator.sendBeacon ──▶ alfavit.uz/e  (apps/collect)
                                │  + country (request.cf)
                                │  + device class (UA)
                                │  + session hash (never stored raw)
                                └────────────────▶ Analytics Engine
                                                     dataset: alfavit_events
                                                           │
  pnpm metrics ──── SQL API ────────────────────────────────┘
       └─▶ prints the Monday review block
```

`alfavit.uz/dl/mac` and `/dl/win` are served by the same Worker: it writes a `download` event, then 302s to the static installer. A counted route rather than a click beacon, because a beacon misses anyone with JS disabled and download data is currently zero.

### Dataset schema

One dataset, `alfavit_events`. Analytics Engine data points carry `indexes` (one string), `blobs` (strings) and `doubles` (numbers):

| Field | Holds |
|---|---|
| `index1` | event name — the natural sampling/grouping key |
| `blob1` | path (pathname only, no query string) |
| `blob2` | locale (`uz` / `ru` / `en`) |
| `blob3` | referrer host, or `direct` |
| `blob4` | `utm_source`, or empty |
| `blob5` | `utm_medium`, or empty |
| `blob6` | `utm_campaign`, or empty |
| `blob7` | country (from `request.cf.country`) |
| `blob8` | device class (`mobile` / `desktop` / `tablet`) |
| `blob9` | session hash (daily-rotating, 16 hex chars) |
| `blob10` | event-specific detail — direction for `transliterate`, platform for `download`, target for `outbound` |
| `double1` | count (always 1; lets `sum()` and `count()` agree) |

### Events

Six, deliberately. Each maps to one of the three goals.

| Event | `blob10` | Answers |
|---|---|---|
| `pageview` | — | attribution, incl. the `t.co` blind spot, via `utm_*` + referrer |
| `transliterate` | direction (`cyrillic-latin`, `latin-cyrillic`, `oldlatin-new`) | does anyone use the converter |
| `file_convert` | file type (`docx`, `txt`) | is the file path real |
| `copy` | — | did they take the output away |
| `download` | `mac` / `win` | desktop conversion |
| `outbound` | `bot` / `extension` / `github` / `npm` | click-through to other channels |

## Privacy rules

These are hard constraints, not preferences. Each gets a test.

1. **The user's text never leaves the browser.** `transliterate` sends a direction and a count — never input, never output, never a length that could fingerprint a specific document.
2. **No raw IP is ever written.** It is read from `CF-Connecting-IP`, consumed by the hash, and discarded.
3. **No cookies, no `localStorage`, no persistent identifier.** The daily hash is recomputed per request and never handed to the client.
4. **No query strings in `blob1`.** Exactly three parameters are extracted into their own fields — `utm_source`, `utm_medium`, `utm_campaign`, matching the scheme in `docs/marketing/README.md:20-22`. Everything else in the query string is dropped, so a stray token in a shared URL cannot land in storage.
5. **Beacons are fire-and-forget.** A failed or blocked beacon must never surface an error or change what the user sees.

## Components

| File | Purpose |
|---|---|
| `apps/collect/src/index.ts` | Worker: validate, enrich, write, 302 for `/dl/*` |
| `apps/collect/src/hash.ts` | daily session hash, isolated so it can be tested directly |
| `apps/collect/wrangler.toml` | `analytics_engine_datasets` binding, routes for `/e` and `/dl/*` |
| `apps/web/src/analytics/track.ts` | ~40-line client helper, `sendBeacon`, no dependencies |
| `apps/web/src/analytics/useTrackPageview.ts` | fires `pageview` on route change (the SPA does soft navigations — RUM already reports 290 of 980 views as soft) |
| `scripts/metrics.ts` | `pnpm metrics` — SQL API queries, prints the review block |

Integration points, all existing files:

- `apps/web/src/components/Converter.tsx:21` — `copy()` already exists; add `copy` and `transliterate` events here
- `apps/web/src/components/Channels.tsx:35,45` — installer hrefs become `/dl/mac` and `/dl/win`. **`apps/web/src/tests/Channels.test.tsx:21` asserts the current hrefs and must be updated in the same commit.**
- `apps/web/src/components/RootLayout.tsx` — mount the pageview hook

## Testing

- **Worker** (`vitest`, mirroring `apps/api/src/tests/app.test.ts`): rejects malformed payloads; writes exactly one data point per valid beacon; `/dl/mac` and `/dl/win` 302 to the right asset and write a `download` event; an unknown `/dl/*` 404s rather than open-redirecting.
- **Hash**: same input on the same day is stable; the same input on different days differs; no raw IP appears in the output.
- **Client**: `track()` never throws when `sendBeacon` is missing or returns `false`; the converter test asserts **no input text appears in any beacon payload** — this is the test that protects the whole privacy claim.
- **Existing suites** stay green, including the updated `Channels.test.tsx`.

## Deployment

A fourth CI job in `.github/workflows/deploy.yml`, copied from the `api` job. `apps/collect` needs the zone-level **Workers Routes — Edit** permission that `deployment.md` already documents for `api.alfavit.uz`, so the existing `CLOUDFLARE_API_TOKEN` covers it with no token change.

The session-hash secret is a Worker secret (`wrangler secret put SESSION_SECRET`), never committed. The read-scoped API token for `pnpm metrics` lives in the owner's local environment only — **not** in CI, since nothing in CI reads analytics.

## Documentation to correct

- `docs/marketing/metrics.md` — remove the "Web Analytics is not enabled" claim, replace the baseline row with the RUM numbers above, and add the new event metrics to the KPI table. The "Mac downloads: not counted this cycle" row becomes countable.
- `apps/web/src/pages/PrivacyPage.tsx` — add first-party event counting to the Analytics section, in the same plain register as the existing copy. The text-privacy and extension promises are unchanged and must stay explicit.
- `docs/deployment.md` — a section for the fourth deployable.

## Out of scope

- **A metrics dashboard.** Script first; revisit once it's clear which numbers get checked weekly.
- **The hero video.** `apps/web/src/components/Hero.tsx:4` hardcodes `d8j0ntlcm91z4.cloudfront.net/user_38xzZ…/hf_20260328_….mp4`. It is the LCP element at 2,852ms, sits on a third-party bucket outside your control, and sends every visitor's IP to that CDN on a site that promises no third-party trackers. Real problem, separate work.
- **`www.alfavit.uz` returns 200 instead of redirecting to the apex** (8 of 383 visits). Canonical tags point at the apex so SEO is safe, but it splits the dashboard. One line in `_redirects`, separate work.
- Analytics for the extension, the bot, or the API.
- Guide-page promotion — this spec measures the problem, it does not fix it.

## Verified limits (checked 2026-09-12)

| Limit | Value | Headroom at current volume |
|---|---|---|
| Data points written, free plan | 100,000/day | ~112 page views/day; at 6 events/visit, under 1% |
| Read queries, free plan | 10,000/day | one `pnpm metrics` run is a handful |
| Blobs per data point | 20 | schema uses 10 |
| Doubles per data point | 20 | schema uses 1 |
| Indexes per data point | 1 | schema uses 1 |
| Total blob size per request | 16 KB | nowhere near |
| Index length | 96 bytes | event names are short |
| Data points per Worker invocation | 250 | 1 |
| **Retention** | **3 months** | see below |

Cloudflare states it is not currently billing for Analytics Engine, so the paid tiers
(10M writes / 1M reads per month included) are not in play either way.

**Retention is the one that bites.** Three months means the SQL API cannot answer
year-over-year questions, and this year's launch window will age out around December
2026. The weekly review in `docs/marketing/metrics.md` is therefore not just a ritual —
it is the durable record. `pnpm metrics` must print something worth pasting, because
pasting it is what makes the data survive.

## Open question, with a decided fallback

Whether a Worker route on `alfavit.uz/e` takes precedence over the Pages project serving
the same hostname is **not documented** anywhere in Cloudflare's Workers routing, Pages
routing, Pages custom-domain or serving-pages docs. It is expected to work, but it is
being treated as unproven.

**Step 1 of implementation is an empirical check**, before any client code is written:
deploy a stub `apps/collect` on the route, confirm `GET /e` hits the Worker and that
`/`, `/apps` and `/download/Alfavit.dmg` still serve from Pages unchanged.

**If it fails, fall back to approach B** — a Pages Function at `apps/web/functions/e.ts`,
with the CI `wrangler-action` moved to `workingDirectory: apps/web`. The event schema,
privacy rules, client helper and read path are all unchanged by that switch; only the
collector's home and its deploy job differ. The fallback is a half-day, not a redesign.

## Success criteria

- A week after deploy, `pnpm metrics` prints: visits by referrer **with UTM breakdown**, transliterations, file conversions, copies, downloads split Mac/Windows, and outbound clicks — enough to fill the Monday review block without opening a browser.
- The `t.co` bucket resolves into named source/medium/campaign triples for any link posted with UTMs after launch — `press` traffic separable from `post` traffic.
- Installer downloads have a number for the first time.
- No user text is transmitted, and a test proves it.
- No cookies, no consent banner, no new paid service.
- Build and all test suites green.
