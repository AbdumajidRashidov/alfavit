# Metrics

One goal: daily users across web, bot, extension and Mac app. Everything below is free to read and takes 30 minutes a week.

## Baseline (10 September 2026, 23:19 Tashkent — evening of the Senate vote, before any outreach)

| | Value | Where |
|--|-------|-------|
| Site visitors/day, 7-day average before launch | ___ | Cloudflare dashboard → Analytics & Logs → Web Analytics → alfavit.uz → Last 7 days → Visits ÷ 7 |
| Bot requests/day, 7-day average | ___ | Cloudflare dashboard → Workers & Pages → alfavit-bot → Metrics → Requests (Last 7 days) ÷ 7 |
| API requests/day, 7-day average | ___ | Workers & Pages → alfavit-api → Metrics → Requests (Last 7 days) ÷ 7 |
| GitHub stars / forks | 0 / 0 | github.com/AbdumajidRashidov/alfavit — public since 10 Sep 2026, ~21:50 Tashkent |
| GitHub traffic, last 14 days | 0 views, 1 clone (our own) | `gh api repos/AbdumajidRashidov/alfavit/traffic/views` and `…/traffic/clones` |
| npm weekly downloads, engine / sdk | 0 / 0 | published 10 Sep 2026, 22:33 Tashkent; api.npmjs.org indexes downloads after about a day |

The three Cloudflare rows need your login: read them from the dashboard and fill the blanks, or authorize the Cloudflare observability connector in Claude once so the weekly review can pull them automatically.

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
| Mac downloads | not counted this cycle | — | Static asset; revisit with a counted `/download` route after 30 days |

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
