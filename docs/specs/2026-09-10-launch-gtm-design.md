# Launch & Go-To-Market (Senate vote, Sept 2026) — Design

**Date:** 2026-09-10
**Status:** Design approved in chat (brainstorming session). Awaiting user review of this document, then an implementation plan.
**Owner:** Abdumajid Rashidov (executes outreach, store submission, publishing). Assistant implements code changes and drafts all copy.

## Goal

Make Alfavit the converter people in Uzbekistan reach for during the alphabet transition, starting from the news moment created by the Senate's approval of the 28-letter alphabet on 10 September 2026. Primary metric: daily users across web, Telegram bot, browser extension and macOS app. Budget: **$0** (organic only). Effort: **10–20 hours/week** of the owner's time. Approach chosen: **news-jacking launch sprint** in two waves (Senate vote now, presidential signature later), with evergreen SEO and product loops folded in from week two.

## Context (verified 2026-09-10)

### The reform

| Date | Event | Source |
|------|-------|--------|
| 7 Jul 2026 | Legislative Chamber adopted the law changing the Latin-based Uzbek alphabet | kun.uz, gazeta.uz (7 Jul) |
| 10 Sep 2026 | Senate approved the law and sent it to the President | gazeta.uz/oz/2026/09/10/uzb-alphabet, spot.uz/oz/2026/09/10/uzbek-alphabet, daryo.uz/fxq5yS_DR |
| Next | Presidential signature and official publication; entry into force after a transition period | gazeta.uz |
| After entry into force | Media, state bodies and official correspondence switch to the new alphabet; personal use is free; documents issued in the current alphabet stay valid; currency and securities stay in circulation; signage is replaced as it wears out or per the implementation program | gazeta.uz (uzb-alphabet, oav-alifbo) |
| 2027/28 school year | First-grade textbooks in the new alphabet | zamin.uz |
| 2031 | All school textbooks converted | zamin.uz |

Alphabet: **28 letters + 1 apostrophe sign** (was 26 letters + 3 letter combinations sh, ch, ng). Changes reported by the Senate and press: **Sh→Ş, Ch→Ç, Oʻ→Ö, Gʻ→Ğ**; **ng is no longer a separate letter** (the combination remains in orthography). Implementation measures sit with the Department for Language Development under the Cabinet of Ministers; no deadlines were given to senators who asked for them.

Same-day coverage (gazeta.uz, spot.uz, 10 Sep) describes the **keyboard problem** (typing ö takes up to six keystrokes today), a proposal to place Ö Ğ Ş Ç on currently unused punctuation keys, and notes that "private IT specialists have started building programs" for the transition — **no product is named**.

### Competitors

kirillotin.uz, lotin.uz, transliterator.uz, kiril-lotin.uz, parsing.uz, lotincha.uz, uzlatin.uz all convert Cyrillic ↔ 1995 Latin. None of the three inspected (kirillotin, lotin, transliterator) mention ş ç ö ğ or the 2026 alphabet. Chrome Web Store has generic Uzbek translit extensions, none for the new alphabet. **Alfavit is currently the only multi-channel converter for the 2026 alphabet.**

### Alfavit channel status

| Channel | State | Gap |
|---------|-------|-----|
| Web `alfavit.uz` | Live (Cloudflare Pages, SSG, uz/ru/en, Cloudflare Web Analytics via dashboard) | Reform page says only "Adopted 7 July 2026"; no Senate update, no timeline. No share hook on the converter. |
| Telegram `@alfavit_uz_bot` | Live (Workers webhook), inline mode works | No share button on replies; start/help text does not mention files or the desktop app. |
| API `api.alfavit.uz` | Live, `POST /v1/transliterate`, 60 req/min | — |
| Chrome extension | Built (v0.1.0), listing drafted in `docs/chrome-web-store/LISTING.md`, **not submitted** | Privacy URL points to `alfavit-web.pages.dev`; no `homepage_url`; Google requires a one-time $5 developer registration (the only cost in this plan). |
| macOS app | `.dmg` served from `alfavit.uz/download/Alfavit.dmg` (universal, unsigned) | GitHub release `desktop-v0.1.1` is a draft in a **private** repo. |
| Engine / SDK | Workspace packages, tested | **Not on npm**; repo private. History scan: no tokens or `.env` files ever committed; `wrangler.toml` files contain no account IDs. Safe to publish. |

### Content-accuracy decision (must land before press outreach)

The site, FAQ and README present **five** letter changes including "loanword ts→c". The official description (Senate, press) lists **four** replacements plus the removal of ng, and the 28-letter count is exactly the four replacements plus Ş and Ç as new letters — **C is not among the 28 letters** (the site's own `/alphabet` chart already lists 28 letters without C). The engine converts Cyrillic ц to `s` and only *flags* `c` as an alternative; the old-Latin path has no ts→c rule.

Decision: public copy states the **four official changes and the ng removal**. The loanword ts/c statement is reworded to describe engine behaviour honestly ("Cyrillic ц is written s; Alfavit flags c as an alternative for loanwords") or removed where it is presented as a letter change (Reform page CHANGES table, spotlight `ts`, FAQ "Which letters changed?", README, `alphabet.loanword.note`). The owner (native speaker) confirms the final Uzbek wording before publish, per the existing content-accuracy constraint in the SEO content spec.

## Positioning & messaging

- **Category we own:** *yangi alifbo konvertori* — the converter for the 28-letter 2026 alphabet. Not a generic Cyrillic–Latin translit tool.
- **Pillars:** (1) built for the 2026 alphabet: ş ç ö ğ, position-dependent e/ye, ambiguity flags; (2) works wherever you write: web, Telegram inline in any chat, Chrome right-click, Mac live typing, docx/srt/txt files, public API and SDK; (3) free, on-device, nothing uploaded; open source.
- **One-liners** (owner verifies uz/ru):
  - uz: "Alfavit — matnni yangi oʻzbek alifbosiga bir zumda oʻgiring."
  - ru: "Alfavit — переводит узбекский текст в новый алфавит за секунду."
  - en: "Alfavit — Uzbek text, in the new alphabet, in one second."
- **Press angle:** the unnamed "programs" in today's coverage now have a name; the keyboard pain in the same articles is solved today on Mac by live transform and on every device by the converter. The builder is available as a source on the digital side of the reform (Unicode, search, URLs, databases).
- **Tone:** helpful public utility, not a startup pitch. No hype, no "revolutionary". Every post answers a real question.

## Launch sequence

### Wave 1 — this week (Senate vote)

| Day | Owner does | Assistant delivers |
|-----|-----------|--------------------|
| 0–1 | Review and merge code changes; deploy; record a 15-second demo GIF (shot list provided); create npm org `alfavit`; make repo public; publish packages; publish desktop release; register Chrome developer account and submit extension | Components 1–8 below; all marketing assets |
| 1–2 | Send press pitches (Gazeta, Spot, Kun.uz, Daryo, Zamin, UzDaily, Podrobno) using the press kit; reply to any journalist within the hour | Press kit, pitch emails uz/ru/en, quote bank, outlet list |
| 2–5 | Seed communities: Uzbek IT Telegram channels and groups (IT Masters, IT Specialist, Uzbek Developers Community, Python Uzbekistan, Xinux), teacher and linguist groups, r/Uzbekistan, LinkedIn, comment threads under the 10 Sep articles. One helpful message per venue, never repeated. | Community seeding messages, etiquette rules, tracker |
| 3–7 | Developer wave: Show HN, Habr (ru) article, npm announcement | Show HN text, Habr outline, README badges |

### Wave 2 — presidential signature (date unknown)

Everything pre-written now and fired within hours of the news: press follow-up ("now that it is law"), post variants per channel, site news-strip text switch, Reform-page timeline update. Owner's job on the day: change two strings, deploy, send.

### Weeks 2–8 — compounding (~8 h/week)

- One new guide page per week targeting a real query (calendar in `docs/marketing/content-calendar.md`): keyboard typing (week 1), names and documents, Word files, subtitles, Telegram channel admins, website migration for developers, schools and teachers, Cyrillic-only readers.
- Two posts per week, replies within a day, one 30-minute metrics review per week.
- Opportunistic institutional follow-ups: any newsroom that replies gets offered the files converter and API for their archive.

## Components (implementation, this repo)

### 1. Reform page — Senate update + timeline

Files: `apps/web/src/pages/ReformPage.tsx`, `apps/web/src/i18n/translations.ts`, new `apps/web/src/content/timeline.ts`, `apps/web/src/content/types.ts`, `apps/web/src/content/faq.ts`, `apps/web/src/content/reform.ts`, `README.md`.

- `reform.law` (uz/ru/en) becomes: adopted by the Legislative Chamber on 7 July 2026, approved by the Senate on 10 September 2026, awaiting the President's signature; 28 letters + 1 apostrophe sign (was 26 letters + 3 combinations).
- New `TimelineItem { date: string; body: string }` type and `timeline: Record<Locale, TimelineItem[]>` with the six rows from the Context table. Rendered as a vertical list under a new `reform.timelineLabel` heading, between the spotlights and the law paragraph.
- New `reform.updated` string ("Updated 10 September 2026") shown under the intro.
- `SOURCES` adds gazeta.uz (uz, 10 Sep), spot.uz (10 Sep), daryo.uz (10 Sep), zamin.uz (textbooks).
- Content-accuracy decision applied: `CHANGES` table and spotlights list four changes; a short ng note added; FAQ answers and README reworded as decided above.
- `meta.reform.desc` mentions the Senate approval.

### 2. Home page news strip

Files: new `apps/web/src/components/NewsStrip.tsx`, `apps/web/src/pages/HomePage.tsx`, translations.

- One line above the hero: `news.senate` ("10 September: the Senate approved the 28-letter alphabet. What changes →") linking to `lp('/reform')`. Muted background, no dismiss state, no JS.
- Text lives in one key per locale so Wave 2 is a string change.

### 3. Keyboard guide — `/guide/keyboard`

Files: `apps/web/src/content/types.ts`, new `apps/web/src/content/guides/keyboard.ts`, `apps/web/src/components/GuidePage.tsx`, new `apps/web/src/pages/GuideKeyboardPage.tsx`, `apps/web/src/router.tsx`, `apps/web/src/seo/config.ts` (PAGE_PATHS, priority 0.7, all locales), translations (`meta.guide.keyboard.title/desc`, `guides.keyboard`, `guide.copyLetter`), `ReformPage.tsx` guides list, `AlphabetPage.tsx` link.

- `Guide` gains optional `letters?: { upper: string; lower: string; codePoint: string }[]` and `note?: string`. `GuidePage` renders a letter strip when `letters` is present: one button per letter showing "Ş ş" and its code point; clicking copies the lowercase letter (what people need mid-word) and shows a brief "Copied" state. The note renders as muted text after the steps. Existing guides unchanged.
- Letters: Ş/ş U+015E/U+015F, Ç/ç U+00C7/U+00E7, Ö/ö U+00D6/U+00F6, Ğ/ğ U+011E/U+011F.
- Steps (HowTo JSON-LD keeps working): (1) Copy the letters from this page; (2) Mac: Option+U then O for ö, Option+C for ç; for ş and ğ add the Turkish Q input source (ğ on `[`, ş on `;`, ö on `,`, ç on `.`) or use the Character Viewer; (3) Windows: add the Turkish Q keyboard; in Word type `015f` then Alt+X for ş, `011f` Alt+X for ğ; Alt+0246 ö and Alt+0231 ç on a numeric keypad; (4) iPhone and Android: add the Turkish keyboard; the four letters are on it directly, and long-pressing o, c, s, g shows them; (5) Or type the old way and let Alfavit convert: Mac live transform, or paste into the web converter, bot or extension.
- Note: the official layout proposal places Ö Ğ Ş Ç on currently unused punctuation keys; until vendors ship it, Turkish Q is the practical layout.
- Linked from the Reform page guides list and from the Alphabet page (a single link under the loanword note). The Apps page is unchanged.

### 4. Web converter — Share button

Files: `apps/web/src/components/Converter.tsx`, translations (`converter.share`).

- Next to Copy; shown only when output is non-empty. Uses `navigator.share({ text, url })` when available; otherwise opens `https://t.me/share/url?url=<site utm link>&text=<converted>` in a new tab. Site link: `https://alfavit.uz/?utm_source=share&utm_medium=telegram&utm_campaign=senate-2026-09`.

### 5. Telegram bot — share hook and copy

Files: `apps/bot/src/handlers.ts`, `apps/bot/src/bot.ts`, `apps/bot/src/i18n.ts`, `apps/bot/src/config.ts`, tests in `apps/bot/src/tests/`.

- Text replies carry an inline keyboard: row 1 `Ulashish / Поделиться / Share` using `switch_inline_query_chosen_chat` prefilled with the converted text (only when it is ≤ 256 characters, Telegram's inline query limit); row 2 URL button `alfavit.uz` → `https://alfavit.uz/?utm_source=bot&utm_medium=button`.
- `start`/`help` mention files (`alfavit.uz/files`) and the Mac app (`alfavit.uz/apps`). `config.ts` descriptions mention the site. A new `setup:config` script (`apps/bot/src/setup-config.ts`) runs `applyBotConfig` only, without touching the webhook; the owner runs it once after deploy.
- Pure function `buildReplyKeyboard(converted, locale)` so it is unit-testable without Telegram.

### 6. Chrome extension — listing fix and 0.1.1

Files: `apps/extension/manifest.json`, `docs/chrome-web-store/LISTING.md`, new zip `docs/chrome-web-store/alfavit-extension-v0.1.1.zip` (old zip removed).

- `homepage_url: https://alfavit.uz/apps`, version `0.1.1`. Listing: privacy URL `https://alfavit.uz/privacy`, website field, description mentions the Senate approval, checklist updated to the new zip. Zip is the built `dist/` with `manifest.json` at root.
- `apps/web/src/components/Channels.tsx`: `EXTENSION_STORE_URL: string | null = null`; when set, the extension card becomes live with `href`. Owner fills it in after Google approval.

### 7. Open-source readiness

Files: new `LICENSE` (MIT, © 2026 Abdumajid Rashidov), `packages/engine/README.md`, `packages/sdk/README.md`, `packages/engine/package.json` and `packages/sdk/package.json` (description, license, repository, homepage, keywords, `publishConfig.access: public`, version `0.1.0`), root `README.md` (all seven packages, badges, links, ts→c wording fix), new `CONTRIBUTING.md` (short).

- Owner actions: create npm org `alfavit`, `pnpm --filter @alfavit/engine --filter @alfavit/sdk publish`, flip repo to public, set description and topics, publish the draft desktop release with tag `desktop-v0.1.1`.

### 8. Measurement

- UTM scheme used by every link in the marketing assets: `utm_source` ∈ {gazeta, spot, kun, daryo, zamin, uzdaily, podrobno, telegram, reddit, linkedin, x, hn, habr, npm, bot, extension, share}, `utm_medium` ∈ {press, post, referral, button}, `utm_campaign` = `senate-2026-09` now, `signing-2026` for Wave 2.
- Dashboards: Cloudflare Web Analytics (visits, referrers, UTM paths), Workers metrics for bot and API request volume, Chrome Web Store stats, GitHub stars, npm downloads. Mac downloads are not counted (static asset) — accepted for now.
- Weekly 30-minute review template in `docs/marketing/metrics.md`.

## Marketing assets (`docs/marketing/`)

| File | Contents |
|------|----------|
| `README.md` | Index, how to use the kit, UTM scheme, the content-accuracy rule (four official changes), owner checklist |
| `press-kit.md` | Fact sheet (what, channels, letter table, privacy, open source, founder line), quote bank (4–6 quotable lines uz/ru/en), asset list (logo, OG image, screenshots, demo GIF), boilerplate paragraph |
| `press-outreach.md` | Outlet table with contacts (info@gazeta.uz, info@spot.uz, Kun.uz, Daryo, Zamin, UzDaily, Podrobno) and the 10 Sep article each wrote; pitch email in uz/ru/en; 3-day follow-up; "expert comment" offer; tracker table |
| `launch-posts.md` | Telegram channel post (uz, ru), LinkedIn (ru, en), X thread (en), r/Uzbekistan post (en), article-comment templates (uz, ru) |
| `community-seeding.md` | Venue list by segment (IT, teachers, linguists, students, diaspora), one short message per segment, etiquette (one post per venue, disclose you built it, answer questions, never repost), tracker |
| `developer-launch.md` | Show HN title and text, Habr article outline (ru), npm/README badges, dev.to variant |
| `wave-2-signing-kit.md` | All post variants, press follow-up, news-strip and Reform-page string values for the signing day, 2-hour runbook |
| `content-calendar.md` | Weeks 2–8: one guide per week with target query, page path, angle, and the post that promotes it |
| `demo-shotlist.md` | 15-second GIF shot list for web, bot inline, Mac live transform; export settings |
| `metrics.md` | KPI table, where each number lives, weekly review template, 30-day targets |

## Owner checklist (things only you can do)

1. Confirm the content-accuracy decision and verify all Uzbek copy before merge.
2. Record the demo GIF; export OG/logo assets to the press kit folder if needed.
3. Register a Chrome Web Store developer account ($5) and submit `alfavit-extension-v0.1.1.zip`; paste the store URL into `EXTENSION_STORE_URL` when approved.
4. Create npm org `alfavit`, publish engine and SDK, make the repo public, publish the desktop release.
5. Re-run bot config to push new descriptions.
6. Send pitches and community posts; log each in the trackers.

## Testing

- Baseline before changes: `pnpm turbo run test` green (web: 16 files / 52 tests; 8 turbo tasks).
- New tests: Reform page renders timeline, updated law text and new sources (per locale); NewsStrip renders on home with localized `/reform` link; keyboard guide route, letters strip with copy buttons, PAGE_PATHS and sitemap include `guide/keyboard` for all locales; guide build test covers the new page; Converter share button appears only with output and builds the Telegram share URL when `navigator.share` is absent; bot `buildReplyKeyboard` returns share + site buttons under 256 chars and only the site button above; Channels extension card flips live when `EXTENSION_STORE_URL` is set; i18n parity test passes with new keys.
- Commands: `pnpm turbo run test`, `pnpm build`, `pnpm --dir apps/web test:dist`.
- Browser verification (preview): Reform page, keyboard guide, news strip, share button in uz/ru/en.

## Out of scope

Windows build, mobile keyboard app, Apple code signing and notarization, paid promotion, Windows/Linux desktop, Product Hunt launch (low relevance for a regional tool), localizing the privacy page, bot user analytics (KV counters) — revisit after 30 days.

## Success criteria (30 days from launch)

- ≥ 3 outlet mentions, at least one from Gazeta, Kun.uz, Spot or Daryo.
- A clear step change in daily site visitors versus the pre-launch baseline in Cloudflare Web Analytics, sustained past week two.
- 2,000 bot users started; inline usage visible in Workers request volume.
- 300 extension installs within 30 days of store approval.
- Mac downloads are unmeasured this cycle (static asset, no counter); no target. Revisit with a counted download route after 30 days.
- 50 GitHub stars; engine published on npm with a README.
- Wave 2 kit fired within 2 hours of the signing news.

## Risks

- Press ignores the pitch → community and SEO carry Wave 1; retry with the "expert comment" angle when the President signs.
- Chrome review takes 1–3 weeks → extension joins Wave 2 instead.
- Signing date unknown → kit is ready; owner watches Gazeta/Kun Telegram channels.
- Unsigned Mac app friction → Gatekeeper note already on the Apps page; the keyboard guide offers alternatives.
- Content accuracy: Uzbek copy is drafted by the assistant and must be verified by the owner before anything is published or pitched.
