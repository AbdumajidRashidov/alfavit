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
