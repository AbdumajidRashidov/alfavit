# Metrics

One goal: daily users across web, bot, extension and Mac app. Everything below is free to read and takes 30 minutes a week.

## Baseline (10 September 2026, 23:19 Tashkent — evening of the Senate vote, before any outreach)

| | Value | Where |
|--|-------|-------|
| Zone "unique visitors"/day (**bots included — not real visitors**, see the correction below) | 69–148 per day over the last 30 days; 1.95k in 30 days | Cloudflare dashboard → alfavit.uz → Analytics & Logs → Traffic → Unique Visitors |
| Site requests, 30 days | 40.01k (bots and scanners included; 24 h by country: UK 1,286 · UZ 1,181 · US 513) | same page → Requests |
| Bot invocations, last 7 days | 15 (10 were uncaught exceptions from non-Telegram GET traffic — fixed 10 Sep 23:50, worker now answers 405/400) | Workers & Pages → alfavit-bot → Metrics → Last 7 days |
| API invocations, last 7 days | 313, 0 errors (272 from a single Sydney source, i.e. a monitor or crawler; real usage ≈ 40) | Workers & Pages → alfavit-api → Metrics → Last 7 days |
| GitHub stars / forks | 0 / 0 | github.com/AbdumajidRashidov/alfavit — public since 10 Sep 2026, ~21:50 Tashkent |
| GitHub traffic, last 14 days | 0 views, 1 clone (our own) | `gh api repos/AbdumajidRashidov/alfavit/traffic/views` and `…/traffic/clones` |
| npm weekly downloads, engine / sdk | 0 / 0 | published 10 Sep 2026, 22:33 Tashkent; api.npmjs.org indexes downloads after about a day |

### Correction, 12 September 2026

This baseline originally said *"Web Analytics is not enabled for alfavit.uz."*
**It has been since mid-July.** The visitor row above was read from zone HTTP
analytics, which counts bots, scanners and `api.alfavit.uz` alongside people —
and overstated real traffic by roughly 10x. The row is kept, relabelled, because
the launch narrative referenced it.

The real numbers, from Web Analytics on 12 September:

| Window | Visits | Page views |
|--|--|--|
| 24 hours | 54 | 112 |
| 7 days | 383 | 706 |
| 21 days | 500 *(rounded)* | 980 *(rounded)* |

So pre-launch traffic was **~8–10 visits/day**, not 69–148, and post-launch is
**~55/day** — a real 5–6x step change, honestly measured. Compare Web Analytics
to Web Analytics; never mix the two sources in one trend.

Audience at that point (7 days): Uzbekistan 81%, mobile 66%, Android over iOS
3:1, and `t.co` the single largest referrer at 37% — ahead of direct (27%) and
Google (23%).

From the first `pnpm metrics` run onward, the numbers below come from our own
event pipeline. Analytics Engine keeps three months, so the pasted weekly blocks
at the bottom of this file are the durable record — not the dataset.

## KPIs

| Metric | Where to read it | 30-day target | Notes |
|--------|------------------|---------------|-------|
| Site visitors/day | Cloudflare Web Analytics → Visits | A clear step change vs. baseline, sustained past week 2 | Cookieless, so "visits" undercounts returning users slightly; compare like with like |
| Top referrers and UTM paths | Web Analytics → Referrers, and Paths (UTM query strings show on the path) | Press referrers appear within 48 h of a mention | Tells you which outlet or venue actually sent people |
| Guide page views | Web Analytics → Paths → `/guide/keyboard` etc. | Keyboard guide in the top 3 paths by week 2 | If not, the guide title or promotion is off, not the demand |
| Bot request volume | Workers → alfavit-bot → Requests | Trend up week over week; ~2,000 `/start` messages is the proxy for 2,000 users | Each Telegram update is one request; inline queries count too |
| API requests | Workers → alfavit-api → Requests | Any developer traffic after Show HN / npm | Spikes on Habr/HN days are normal; watch the week-3 floor |
| Extension installs | Chrome Web Store developer dashboard → Stats | 300 within 30 days of approval | Store approval can take 1–3 weeks; the clock starts at approval |
| GitHub stars | Repo page | 50 | Mostly from Show HN and Habr |
| npm downloads | npmjs.com/package/@alfavit/engine → weekly downloads | Non-zero and rising | Vanity metric unless a project depends on it; note who |
| Press mentions | `private/trackers.md` (gitignored) | ≥ 3, at least one of Gazeta / Kun / Spot / Daryo | Link each mention; check the referrer shows up |
| Installer downloads | `pnpm metrics` → Downloads | any non-zero split by platform | Counted at `/dl/mac` and `/dl/win`; 66% of traffic is mobile, so expect small absolute numbers |
| Converter use rate | `pnpm metrics` → % of visits that transliterated | establish a baseline, then improve it | The one number that says whether this is a tool or a page people glance at |

## Weekly review (Mondays, 30 minutes)

Copy this block into a new section below with the date.

```
### Week of YYYY-MM-DD

Visitors/day (7-day avg): ___  (vs. baseline ___)
Top 3 referrers: ___ / ___ / ___
Top 3 paths: ___ / ___ / ___
Bot requests/day: ___     API requests/day: ___
Extension installs (total): ___   Stars: ___   npm weekly: ___
Press mentions this week: ___

What moved and why (2 sentences):

One thing to try next week (from content-calendar.md or a reply thread):

Bugs / feedback worth fixing (link issues):
```

## Reviews

### Week of 2026-10-22

*Read on the afternoon of 22 October 2026 (Tashkent), the day after the President
signed the law. Each number names its source. Compare it only with the same source.*

Visitors/day (7-day avg): 126 (Web Analytics: 881 visits in 7 days), inflated by the signing. Before the last 24 h it was ~51/day, and ~37/day in the three weeks before that (vs. baseline ~55/day, launch week to 12 Sep)
Top 3 referrers: www.google.com 467 / yandex.uz 194 / direct 126 (Web Analytics, 7 days; 30 days: Google 850, Yandex 520 incl. yandex.ru, direct 260, Bing 50)
Top 3 paths: /alphabet 593 / / 145 / /ru/alphabet 52 (Web Analytics, 7 days)
Bot requests/day: 33 (last 24 h, 0 errors)     API requests/day: 350, of which 347 from one automated source in Manchester; real use ≈ 3
Extension installs (total): not live (`EXTENSION_STORE_URL` still null)   Stars: 0   npm weekly: 0 / 0 (engine / sdk, week of 19 Oct)
Press mentions this week: not checked

Last 24 h on Web Analytics: **573 visits (+421%)**, 798 page views; Google 342, yandex.uz 86,
direct 79, t.co 39; /alphabet 397 landings.

**Search Console** (Google only; data to 20 Oct)

- Last 28 days: 427 clicks / 19.8k impressions / 2.2% CTR / position 5.6. Baseline (3 months to 13 Sep): 202 / 8,685 / 2.33% / 6.5.
- /alphabet: 363 clicks / 17,827 impressions / 2.0% CTR / position 5.7. /reform: 51 / 1,372 / 3.7%.
- Image search: 2.04k impressions, 3 clicks, position 26.9. The chart is indexed but does not rank.
- `yangi alifbo 2026`: 3.3% CTR over 3 months (baseline 1.22%); 14.9% at position 2.4 in the last 7 days.
- Zero-click queries: `alifbo` 810 impressions in 7 days at 0.1% (position 4.8); `lotin alifbosi` 1,735 over 3 months at 0.5%; `oʻzbek alifbosi` 1,270 at 0.9%.

**Event pipeline, first read** (Analytics Engine, 12 Sep to 22 Oct. Here a visit is the same
IP and browser within one UTC day, so it is not Web Analytics' "visit".)

| | Visits | Converted text | Reached home (only page with the converter) | Of those, converted |
|--|--|--|--|--|
| Since launch | 2,971 | 108 (3.6%) | 1,136 (38%) | 9.4% |
| 9–20 Oct, normal days | 482 | 9 (1.9%) | 73 (15%) | 12% |
| 21–22 Oct, signing (22nd partial) | 627 | 55 (8.8%) | 139 (22%) | 40% |

- What gets converted (transliterate events): old Latin 97 · Cyrillic 24 · other 1.
- Copied the result: 35 visits (32% of converters). File conversions: 12 docx, 2 txt.
- Downloads (events): chart PDF 48, chart PNG 42; installers Windows 43, Mac 34; 4 junk and 6 unlabelled (see bugs).
- Clicks to the bot: 11.
- All events since launch: pageview 4,149 · copy 227 · download 177 · transliterate 122 · file_convert 14 · outbound 11.

```
UTC day     visits  converted  reached home
2026-10-09      43          1             7
2026-10-10      46          2             9
2026-10-11      22          1             2
2026-10-12      45          0             3
2026-10-13      53          2             8
2026-10-14      39          1            10
2026-10-15      46          0             5
2026-10-16      55          1             5
2026-10-17      33          0            10
2026-10-18      21          0             2
2026-10-19      42          0             9
2026-10-20      37          1             3
2026-10-21     321         26            73
2026-10-22     306         29            66   (partial)
```

What moved and why (2 sentences): The President signed the law on 21 October (Uzbek Language Day) and search traffic to /alphabet jumped fivefold; /status, the hero banner and llms.txt went to "signed" on 22 October (3fa14d6), and Search Console indexing was requested for /status, /ru/status, /en/status and /reform. Before that, search alone held the site at ~37–51 visits a day after launch-week social traffic faded, but only about one visit a day used the converter, because 78–85% of visits never reach the home page where it lives.

One thing to try next week: put the converter on /alphabet (work started 22 October), then compare the share of visits that convert with the 1.9% normal-day baseline above.

Bugs / feedback worth fixing:
- `/dl/__proto__` and `/dl/constructor` pass the `INSTALLERS[platform]` lookup in `apps/collect/src/app.ts` and are recorded as downloads (2 each so far, plus 6 downloads with no detail, source unknown). Fix with `Object.hasOwn`.
- `pnpm metrics` only sends a Bearer token. The owner has only the Global API Key, which the SQL API accepts with `X-Auth-Email` + `X-Auth-Key`.
