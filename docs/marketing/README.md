# Alfavit launch kit

Everything needed to launch Alfavit on the Senate's approval of the 28-letter alphabet (10 September 2026) and again when the President signs. Two waves, zero budget, 10–20 hours a week. Strategy: [`docs/specs/2026-09-10-launch-gtm-design.md`](../specs/2026-09-10-launch-gtm-design.md). Build tasks: [`docs/plans/2026-09-10-launch-gtm.md`](../plans/2026-09-10-launch-gtm.md).

## Ground rules

1. **Facts only.** The reform changed **four** letters — sh→ş, ch→ç, gʻ→ğ, oʻ→ö — and **ng is no longer a separate letter**; 28 letters + 1 apostrophe sign. Never present "ts→c" as a letter change. Dates: Legislative Chamber **7 July 2026**, Senate **10 September 2026**, presidential signature pending. Textbooks: first grade **2027/28**, all by **2031**.
2. **Say you built it.** Every post and comment is signed as the builder. No sock puppets, no "a friend made this".
3. **One post per venue, ever.** Reposting the same text into the same channel or group gets it removed and burns the venue.
4. **Answer within a day.** A reply is worth more than a new post. Bug reports go into GitHub issues with a thank-you.
5. **Helpful tone.** Alfavit is a public utility, not a startup. No "revolutionary", no countdown hype. Every post answers a question someone actually has.
6. **Uzbek copy is verified by the owner** (native speaker) before it is published or pitched. The drafts here are drafts.

## UTM scheme

Every link that leaves this kit carries UTMs so Cloudflare Web Analytics can attribute traffic.

| Parameter | Values |
|-----------|--------|
| `utm_source` | `gazeta` `spot` `kun` `daryo` `zamin` `uzdaily` `podrobno` `telegram` `reddit` `linkedin` `x` `hn` `habr` `npm` `bot` `extension` `share` |
| `utm_medium` | `press` (a journalist's article) · `post` (our own post) · `referral` (README, npm, listings) · `button` (in-product buttons) |
| `utm_campaign` | `senate-2026-09` (Wave 1) · `signing-2026` (Wave 2) |

Ready-made links (Wave 1):

- Gazeta: `https://alfavit.uz/?utm_source=gazeta&utm_medium=press&utm_campaign=senate-2026-09`
- Spot: `https://alfavit.uz/?utm_source=spot&utm_medium=press&utm_campaign=senate-2026-09`
- Kun.uz: `https://alfavit.uz/?utm_source=kun&utm_medium=press&utm_campaign=senate-2026-09`
- Daryo: `https://alfavit.uz/?utm_source=daryo&utm_medium=press&utm_campaign=senate-2026-09`
- Telegram posts: `https://alfavit.uz/?utm_source=telegram&utm_medium=post&utm_campaign=senate-2026-09`
- Reddit: `https://alfavit.uz/?utm_source=reddit&utm_medium=post&utm_campaign=senate-2026-09`
- LinkedIn: `https://alfavit.uz/?utm_source=linkedin&utm_medium=post&utm_campaign=senate-2026-09`
- X: `https://alfavit.uz/?utm_source=x&utm_medium=post&utm_campaign=senate-2026-09`
- Hacker News: `https://github.com/AbdumajidRashidov/alfavit?utm_source=hn&utm_medium=post&utm_campaign=senate-2026-09`
- Habr: `https://alfavit.uz/?utm_source=habr&utm_medium=post&utm_campaign=senate-2026-09`
- npm README: `https://alfavit.uz/?utm_source=npm&utm_medium=referral&utm_campaign=senate-2026-09`

Deep links work the same way, e.g. `https://alfavit.uz/guide/keyboard?utm_source=telegram&utm_medium=post&utm_campaign=senate-2026-09`.

## Files in this folder

| File | Use it for |
|------|-----------|
| [`press-kit.md`](press-kit.md) | Fact sheet, reform facts, letter table, quote bank, asset list — attach or paste into any pitch |
| [`press-outreach.md`](press-outreach.md) | Outlet table with contacts, pitch emails (uz/ru/en), expert-comment offer, follow-up, tracker |
| [`launch-posts.md`](launch-posts.md) | Ready-to-paste posts: Telegram (uz/ru), LinkedIn (ru/en), X thread, r/Uzbekistan, article comments |
| [`community-seeding.md`](community-seeding.md) | Venue list by segment, one message per segment, etiquette, tracker |
| [`developer-launch.md`](developer-launch.md) | Show HN, Habr outline, npm announcement, repo checklist before going public |
| [`wave-2-signing-kit.md`](wave-2-signing-kit.md) | Everything for the day the President signs: runbook, string values, posts, press follow-up |
| [`content-calendar.md`](content-calendar.md) | Weeks 2–8: one guide page per week with its target query and promotion post |
| [`demo-shotlist.md`](demo-shotlist.md) | The 15-second demo GIF: three clips, export settings |
| [`metrics.md`](metrics.md) | KPIs, where each number lives, 30-day targets, weekly review template |
| `private/trackers.md` | Gitignored. Your send and reply log for press, communities and developer posts, so journalist replies never reach the public repo |

## Owner checklist for launch day

Only you can do these. Tick them in order; the code side is already merged when you start.

- [ ] Verify all Uzbek copy in this kit and on the site (Reform page, keyboard guide, news strip, bot texts).
- [ ] Note today's baseline in Cloudflare Web Analytics (visitors/day for the last 7 days) in `metrics.md`.
- [ ] Record the demo GIF per `demo-shotlist.md`; upload the MP4 somewhere linkable (Telegram channel post works).
- [ ] Make the GitHub repo public; set description and topics (`developer-launch.md` → repo checklist); publish the draft desktop release.
- [ ] Create the npm org `alfavit`; run `pnpm turbo run build --filter=@alfavit/engine --filter=@alfavit/sdk`, then `pnpm --filter @alfavit/engine publish --no-git-checks` and the same for `@alfavit/sdk`.
- [ ] Register a Chrome Web Store developer account (one-time $5) and submit `docs/chrome-web-store/alfavit-extension-v0.1.1.zip` per `docs/chrome-web-store/LISTING.md`.
- [ ] Push the bot's new descriptions: `BOT_TOKEN=… pnpm --dir apps/bot setup:config`.
- [ ] Send the press pitches (`press-outreach.md`), before 10:00 Tashkent time, one outlet per email. Log each in the tracker.
- [ ] Post the Telegram, LinkedIn and X posts (`launch-posts.md`). Seed communities over the next four days (`community-seeding.md`), never more than two venues per day.
- [ ] Show HN on a weekday between 14:00 and 16:00 Tashkent time (`developer-launch.md`).
- [ ] When Google approves the extension: paste the store URL into `EXTENSION_STORE_URL` in `apps/web/src/components/Channels.tsx`, merge, and post the extension announcement.
- [ ] Every Monday, 30 minutes: fill the weekly review in `metrics.md`.
