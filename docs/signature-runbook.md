# Signature-day runbook

What to do the day the President signs the alphabet law — or the day it enters
into force.

The Senate vote on 10 September 2026 was the site's best traffic day ever: 843
impressions, 39 clicks, average position 5.6. The signature will be bigger, and
`/status` is the page built to catch it. It is only worth having while it is
right, so the point of this file is that updating it is a known ten-minute job
and not a scramble.

This was written from an actual drill: `STAGE` was flipped on a throwaway
branch and the build inspected. Everything below is what that found.

## 1. Make the edit

In `apps/web/src/content/status.ts`:

```ts
export const STAGE: ReformStage = 'signed'   // or 'in-force'
export const CHECKED_ON = '2026-XX-XX'       // the date you verified it
```

Check the sources in `apps/web/src/content/sources.ts` first, and add the new
one you verified against.

## 2. Run the tests — they will fail, and that is the checklist

```bash
pnpm test
```

`signatureDrift.test.ts` fails and names every string that still says the law is
waiting, across all three locales. Expect roughly:

| File | What to change |
|---|---|
| `content/timeline.ts` | The "Next" / "Keyingi qadam" / "Далее" step — the signature has happened, so the next step is entry into force |
| `content/faq.ts` | "Islohot qachon qabul qilindi?" and its ru/en counterparts |
| `i18n/translations.ts` | `reform.law`, in all three locales |

Fix them, re-run, and the test goes green. That test is the checklist — you do
not have to remember this table.

## 3. One thing the test cannot catch

`news.senate` in `i18n/translations.ts` is the banner above the hero. It reads
"10 September: the Senate approved the 28-letter alphabet." That is not phrased
as *awaiting* anything, so no pattern can flag it — it is simply old news.

**Update it by hand.** It is the first thing every visitor sees, and on
signature day it is the wrong headline. All three locales.

## 4. What updates itself — do not hand-edit these

The drill confirmed all of these follow `STAGE` and `CHECKED_ON` automatically:

- `/status` headline and body, in uz, ru and en
- The `Legislation` schema's `legislationLegalForce`
- `/status`'s **meta description** — the search snippet. This one was a real
  trap: it used to be a fixed string, so it would have told Google "awaiting
  the President's signature" on the day the page said signed
- `llms.txt` — generated at build from `status.ts`, not served from `public/`,
  for the same reason
- `<lastmod>` and `dateModified` for `/status`, which track `CHECKED_ON`

## 5. Ship and confirm

```bash
pnpm build && pnpm --dir apps/web test:dist
```

Merge to `main` and push; the Deploy workflow does the rest. Then check
production:

```bash
curl -s https://alfavit.uz/status | grep -o '"legislationLegalForce":"[^"]*"'
curl -s https://alfavit.uz/llms.txt | grep '^As of'
```

`legislationLegalForce` stays `NotInForce` for `signed` — that is correct, a
signed law is not the same as a law in force. It becomes `InForce` only at
stage `in-force`.

## 6. Then, within the hour

- **Search Console → URL Inspection → request indexing** for `/status`,
  `/ru/status`, `/en/status` and `/reform`. This is the one day where hours
  matter; normal crawl cadence is too slow for a news spike.
- Post the update on the Telegram channel and anywhere else the launch went.
  Press links in `docs/marketing/`.

## Note on the build guard

`pnpm build` fails once `CHECKED_ON` is more than 45 days old
(`statusFreshnessPlugin`). That is deliberate — it means a stale status page
cannot deploy. If you hit it and the status has genuinely not changed, just
re-verify against the sources and bump `CHECKED_ON`.
