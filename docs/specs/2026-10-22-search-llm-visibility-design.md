# Search & LLM Visibility (Oct 2026 – Apr 2027) — Design

**Date:** 2026-10-22
**Status:** Owner's answers folded in (22 Oct 2026). Awaiting the owner's approval of this document.
**Owner:** Abdumajid Rashidov: Uzbek copy, anything posted or sent, dashboard settings.
**Builder:** Claude. Code and content drafts. New Uzbek and Russian copy waits on a branch until the owner has read it. It is listed in one review message per branch, and nothing merges before that read. The repo rule in `docs/marketing/README.md` stands. The owner's reading time comes out of the 10–20 h/week, not the 2–3 h off-site budget.

## Intent

When someone in Uzbekistan searches for, or asks an AI about, the new alphabet, Alfavit should be the first result and the tool the answer names. The window is fixed by the law:

| Date | What happens | Source |
|--|--|--|
| 21 Oct 2026 | Law OʻRQ-1184 signed and officially published | [lex.uz/uz/docs/8548754](https://lex.uz/uz/docs/8548754) |
| by ~21 Dec 2026 | Cabinet approves the implementation programme. Article 3 gives it two months. | same |
| **22 Apr 2027** | **Law in force.** Article 4: six months after publication. Media and state bodies switch. | same; Gazeta, UzDaily |
| 2027–2031 | Textbooks move to the new alphabet | zamin.uz, gazeta.uz |

Interest peaks around the signing, again at 22 April, and then becomes a long tail of daily typing and schoolwork. Whoever the search engines and models learn to trust before 22 April keeps that position for years.

Monetisation is parked (owner, 22 Oct 2026).

## Goals

Measured with the same instruments as the baseline below. "Google" means google.com seen from Uzbekistan.

1. **Converter searches:** top 3 by 31 Jan 2027 and #1 by 22 Apr 2027. Queries: "yangi alifbo konvertor", "yangi alifboga oʻgirish", "kirilldan yangi lotinga", "конвертер в новый узбекский алфавит".
   - Bare "kirilldan lotinga" and "lotinga oʻgirish" are left out on purpose. Until 22 April most of those searchers want the 1995 Latin that is still in force (Toshkent, not Toşkent). The engine only outputs the 2026 alphabet, so those visitors would bounce.
   - A 1995-Latin output mode is out of scope here (builder's call).
2. **Typing searches:** #1 for "Ö Ğ Ş Ç klaviatura" and "telefonda … yozish" by 31 Jan 2027.
3. **Date searches:** #1, and quoted in Google's AI summary, for "yangi alifbo qachon kuchga kiradi" from now until 22 April.
4. **Alphabet searches:** top 3 for "lotin alifbosi", "oʻzbek alifbosi" and "uzbek alifbosi" by 22 Apr 2027. Both Wikipedia pages may stay above us. Being the first non-Wikipedia result counts as success.
5. **AI answers:** named or linked in ≥3 of the 10 fixed prompts (see Measurement) by 31 Jan 2027, and ≥7 by 22 Apr 2027. This is across ChatGPT (signed out), Perplexity (signed out) and Google's AI summary.

## Non-goals

- Revenue of any kind.
- Paid ads or paid placements.
- New apps. A native Android keyboard is a separate decision.
- Winning "yangi alifbo" on news days. Kun.uz and Daryo hold Top Stories and we don't compete for it.

## Anti-goals (failure even if rankings rise)

- Anything a reader or an editor would call spam: bought links, link exchanges, sock-puppet posts, fake reviews, comment spam, keyword-stuffed Uzbek.
- Adding links to alfavit.uz on Wikipedia. Wikipedia work is facts plus official sources only, done openly by the owner.
- Any legal claim not traceable to lex.uz or two news outlets. A wrong date on /status costs more trust than any ranking gains.
- Disparaging named competitors on our pages.
- Uzbek copy published without the owner's read.

## Constraints

- $0 budget.
- Owner time: 10–20 h/week in total. About **2–3 h/week for work outside the site** (posting, sending, dashboards). This was assumed; the owner did not state it.
- Static site on Cloudflare Pages. Prerendered pages with `vite-react-ssg`; uz (root), /ru, /en.
- Existing obligations stay in force:
  - the `/status` freshness build guard (45 days)
  - `PAGE_PATHS` lastmod dates
  - `signatureDrift` tests
  - `docs/signature-runbook.md` (re-used on 22 April for `STAGE = 'in-force'`)
- Automation limits:
  - Cloudflare dashboard and Search Console refuse automated clicks, so dashboard settings and "Request indexing" are owner-only.
  - Bing shows a captcha to automation; we never solve captchas.

## Baseline (22 Oct 2026, before today's changes took effect)

### Google Search Console, 28 days to 20 Oct

| Query group (contains) | Clicks | Impressions | CTR | Avg pos |
|--|--|--|--|--|
| konvertor | **0** | **0** | — | — |
| klaviatura | 0 | 0 | — | — |
| kuchga | 0 | 2 | 0% | 1.0 |
| kiril | 0 | 6 | 0% | 9.5 |
| yangi alifbo | 46 | 633 | 7.3% | 3.5 |
| …zbek alifbo… | 81 | 3,840 | 2.1% | 5.8 |
| lotin | 54 | 4,030 | 1.3% | 6.6 |
| jadval | 6 | 124 | 4.8% | 2.2 |
| алфавит (Uzbek and Russian written in Cyrillic) | 0 | 56 | 0% | 5.3 |

The biggest single queries are "lotin alifbosi" (1,429 impressions, 0.5% CTR, position 7.1), "alifbo lotin" (861, 0.6%) and "oʻzbek alifbosi" (825, 1.1%, position 5.6).

### What searchers see

- **"lotin alifbosi":** uz.wikipedia ×2, then alfavit.uz/alphabet (#3). Google's AI summary quotes Wikipedia and lex.uz and lists the *old* 26-letter alphabet.
- **"yangi alifbo konvertor" (Google):**
  - alifbochi.uz is #1 and is the main source of the AI summary.
  - tadqiq.uz, kiril-lotin.uz and lotin.uz follow, plus the iPhone app ÖzbekX.
  - Alfavit is not on pages 1–2.
- **"yangi alifbo konvertor" (Bing):**
  - Copilot names Oson Studio, Alifboçi's Chrome Web Store listing and a GitHub library.
  - The regular results are azakapro.github.io/alifbo, alifbochi.uz, osonstudio.uz, tadqiq.uz, yangicha.uz, imlogram.uz and translit.uz.
- **"yangi alifbo qachon kuchga kiradi":** the AI summary cites UzDaily, Yuz.uz, Daryo — and alfavit.uz (for the textbook timeline).
- **"telefonda ö ğ ş ç … yozish":** the AI summary cites tadqiq.uz.

### AI assistants, signed out

| Prompt | Answer named |
|--|--|
| Perplexity, uz: "Matnni yangi oʻzbek alifbosiga oʻgiradigan konvertor qaysi?" | alifbochi.uz, translit.uz, azakapro alifbo, kiril.uz |
| Perplexity, ru: "Как перевести текст на новый узбекский алфавит? Какой конвертер?" | UzOffice, Nova Studio, translit.uz, tadqiq.uz |
| Perplexity, en: "What is the best tool to convert Uzbek text to the new 2026 Latin alphabet?" | UzOffice |
| ChatGPT, uz: same as the first prompt | translit.uz, azakapro.github.io/alifbo, uzoffice.uz |

**Alfavit is named in 0 of 4.**

### Crawlers

- Until 22 Oct, Cloudflare AI Crawl Control returned 403 to GPTBot, ClaudeBot, CCBot, Amazonbot and Bytespider. The owner allowed them on 22 Oct; verified 200.
- ChatGPT-User fetched our pages 210 times in the week before. ChatGPT already opens alfavit.uz when it browses; it just doesn't pick us when asked to recommend.

## Diagnosis: why we lose today

1. **We didn't say the word.** The home page never used "konvertor". Fixed and deployed 22 Oct as 3fe43d3; it needs a re-crawl to count.
2. **AI answers recommend what the search indexes rank for "converter" queries.**
   - ChatGPT and Copilot search through Bing; Perplexity uses its own index plus others; Google's AI summary uses Google.
   - We are invisible on Bing for the category, and our Bing and Yandex indexing has never been checked (no Webmaster accounts).
   - Yandex sends **30% of our visits** and is measured nowhere.
3. **Competitors have pages that are only a converter, titled as one.** Our converter shared the home page with a brand headline. The other entry points (`/guide/cyrillic-to-latin`, `/guide/old-latin-to-new`) are instructions, not converters.
4. **Store and directory listings are cited.** Alifboçi's Chrome Web Store page is a Copilot source. Ours is unsubmitted.
5. **Wikipedia owns the head terms and is out of date.** uz.wikipedia "Oʻzbek lotin alifbosi" doesn't mention OʻRQ-1184 or the 28 letters, and Google's AI summary inherits that.
6. **Accuracy gaps a recommendation would expose.** Verified 22 Oct on the built engine; none of these is flagged as ambiguous:
   - Old-Latin s+h words become ş: *Ishoq → Işoq*, *Mushaf → Muşaf*, *Ashob → Aşob*.
   - Foreign names: *Washington → Waşington*, *Shakespeare → Şakespeare*.
   - Web and email addresses are rewritten: *www.shahar.uz → www.şahar.uz*.
   - Apostrophe variants, capitals, Cyrillic Исҳоқ → Ishoq, and maʼsul are right.
   - The Cabinet's spelling rules are not yet published (`packages/engine/docs/official-mapping-source.md`), so some "right answers" have no primary source yet.
7. **Nobody outside links to us.** News explainers name no tools, and short videos on Instagram dominate the video slots.

## Workstreams

Each item says who does it and roughly how long it takes.

### A. Get indexed everywhere (week 1, owner, about 1 hour total)

- **A1. Bing Webmaster Tools:** add alfavit.uz by importing from Search Console, submit `sitemap.xml`, and run URL Inspection on the four pages changed on 22 Oct.
- **A2. Yandex Webmaster:** verify (DNS or meta tag; Claude adds the tag if needed) and submit the sitemap.
- **A3. Cloudflare → Caching → Configuration → Crawler Hints: on.** This sends IndexNow pings to Bing and Yandex on every change; Yandex accepts IndexNow.
- **A4. After each deploy,** request indexing for the changed URLs in Search Console. Bing and Yandex are covered by A3.

### B. On-site: be the obvious converter (weeks 1–4, Claude; owner reads copy)

- **B1. Converter-first landing pages.** Re-use the existing URLs, which already have some history:
  - `/guide/cyrillic-to-latin` (uz/ru/en) and `/guide/old-latin-to-new` (uz/ru/en) become "converter at the top, guide below".
  - Titles target "kirilldan lotinga oʻgirish", "eski lotindan yangi alifboga" and "конвертер кириллица латиница узбекский".
  - The converter component already exists and already reports `transliterate` with the page path, so each page's conversions are measurable.
- **B2. One Uzbek-Cyrillic landing page** for the Cyrillic-reading majority: Kun.uz's Cyrillic channel gets 17× the views of its Latin one, and our Cyrillic-script queries get 0 clicks.
  - Scope: a single page, not a fourth locale.
  - Approved ("go with your recommendations", 22 Oct).
- **B3. "Tricky cases" page.** This ships after E1 and E2, and shows only cases the released engine gets right.
  - Each case is framed as "how Alfavit handles it". It doesn't call a case "the rule" unless the rule is published.
  - Foreign names wait for the Cabinet's spelling rules (E3).
  - What the page covers, all cases that simple letter-swappers get wrong:
    - *ishoq* (s+h, not ş, after E2), *Mas'ul* and the tutuq belgisi
    - apostrophe look-alikes (ʻ ' ‘ `) and ng
    - web and email addresses left alone (after E1), capitals (SH → Ş), mixed Cyrillic and Latin
  - Each case gives input, output and a short explanation, generated from the engine so it can't drift.
  - It's the reason an AI would recommend us over "a converter", and it's linkable.
  - No competitor is named.
- **B1b. Word documents.** `/files` (the file converter) gets the same treatment, for "Word hujjatini yangi alifboga oʻgirish" and fixed prompt 9. It replaces the unbuilt `/guide/word-documents` from `docs/marketing/content-calendar.md`.
  - This plan supersedes that calendar's unbuilt guide list (builder's call). Its `/guide/spelling` folds into B3.
- **B4. Answer-first sections** for the questions searchers ask next, each as a visible heading plus a 1–2 sentence answer:
  - "lotin alifbosi yozma harflar", "lotin alifbosi rasmi", "nechta harf" (done), "eski lotin alifbosi", "lotin alifbosi qachon qabul qilingan", "Ö harfi qanday yoziladi"
  - They go on `/alphabet` and `/reform`, and the `/alphabet` FAQ JSON-LD follows them.
- **B5. `llms.txt`:**
  - Add a "Tools" section naming the converter, its URLs per direction, the apps, the bot and the API, with one line on what each does.
  - Add `llms-full.txt`, the full text of /alphabet, /status, /reform and the keyboard guide. Crawlers already request it and get 404.
- **B6. Image search:** the chart is indexed (2.04k impressions in 28 days) but ranks at position ~27.
  - Show the chart on `/reform` and the keyboard guide too.
  - Give each an `ImageObject` with caption and `contentUrl`.
  - Keep alt text in the user's language.
  - Measure in Search Console with `search_type=IMAGE`.
- **B7. Submit the Chrome extension** (owner, $5 one-time developer fee, already planned). The store listing itself becomes a page AI answers cite.
  - The $5 is the only cost in this plan and was approved in September.

### C. Off-site: get mentioned (owner posts and sends, Claude drafts; ~2–3 h/week)

- **C1. Press, now through December.** Pitch Kun.uz, Gazeta, Daryo, Spot, UzDaily and Zamin with things they can use:
  - the countdown to 22 April
  - "how to type Ö Ğ Ş Ç on your phone"
  - "how to convert a document"
  - Offer to be a source on the digital side of the change.
  - One outlet per email, signed as the builder (existing rule in `docs/marketing/`).
- **C2. Telegram.**
  - Post the countdown and the how-to on our channel.
  - Offer `@alfavit_uz_bot` inline mode to channel admins who will have to publish in the new alphabet.
  - Reach teachers' channels with the printable chart.
- **C3. Short videos.** Three 30-second clips for Instagram and Telegram, re-cut for YouTube Shorts: typing ö on a phone, converting a document, the 22 April countdown. Instagram holds the video slots for these searches.
  - Owner's decision: **screen recordings with captions only**, no voice or face.
  - Claude scripts the captions (uz first, ru second). The owner records on their own phone and computer, using the tooling in `docs/marketing/record-demo.sh` where it applies.
- **C4. Wikipedia, facts only.** The owner updates uz.wikipedia "Oʻzbek lotin alifbosi" with the law, its date, the 28 letters and the in-force date, citing lex.uz and news.
  - No link to alfavit.uz.
  - The owner discloses who they are on the talk page if asked.
  - Assumed yes from "go with your recommendations"; confirm before week 2. Claude drafts the edit and its citations.
  - This fixes what Google's AI summary repeats, even though it doesn't link to us.
- **C5. Developer and directory listings.** README and npm keywords for "Uzbek new alphabet converter", plus awesome-lists for Uzbek and Turkic tools. Only where genuinely relevant.

### E. Engine accuracy (weeks 1–2, Claude; owner reviews the word list)

Approved 22 Oct 2026. Recommending a converter is only safe if it is right, so these come before B3 and before the Chrome Web Store submission (B7).

- **E1. Leave web and email addresses alone.** URLs, domains and email addresses pass through unchanged in every source script. This is unambiguous; tests cover `www.shahar.uz`, `https://…/choy`, `info@shahar.uz` and Markdown links.
- **E2. s+h words that are two sounds.**
  - A reviewed exception list in `packages/engine/src/dictionary.ts`: *ishoq/Is'hoq, mushaf, ashob, …*. Matching is whole-word with suffixes, so *Ishoqning* is also caught.
  - It is built from the Cyrillic forms, where сҳ marks the boundary, so every entry has a source.
  - Words not on the list and not certain are **flagged** as ambiguous rather than silently converted.
  - The owner reviews the list before release.
- **E3. Foreign names (deferred).** Waits for the Cabinet's spelling rules, expected around 21 Dec 2026. Until then, Latin words with no Uzbek reading (e.g. *Washington*) are flagged, not rewritten, if that can be detected safely.
- **E4. Release across every channel.** The engine is shared, so one change means:
  - web, bot and API redeploy on merge
  - npm `@alfavit/engine` patch (owner publishes; OTP)
  - rebuild the extension zip before B7
  - rebuild and rehost the Mac and Windows installers by hand. They don't auto-update; follow the six-step checklist from the desktop release notes.

### D. 22 April 2027: Wave 3

- Run `docs/signature-runbook.md` with `STAGE = 'in-force'` in the morning.
- **Switch the site's own Uzbek text to the new alphabet that day** (owner's decision, 22 Oct).
  - Titles and meta descriptions carry both spellings for a transition of a few months, e.g. "Özbek alifbosi (Oʻzbek alifbosi)", because people keep typing oʻ and sh.
  - The switch should be scripted through the engine and then owner-read, not hand-edited page by page.
  - Copy written before April is written so that the script can convert it.
- Press and posts that day.
- Request indexing for `/status` and `/reform` within the hour.

## Measurement

- **Monthly, first Monday.** Re-run the baseline exactly:
  - The Search Console filters above (URL pattern `…/search-analytics?resource_id=sc-domain%3Aalfavit.uz&num_of_days=28&breakdown=query&query=*<term>`), plus `search_type=IMAGE`.
  - Google searches from the owner's Chrome for the five queries in "What searchers see".
  - **10 fixed prompts**, each asked to ChatGPT (signed out, built-in browser), Perplexity (signed out) and checked in Google's AI summary:
    1. "Matnni yangi oʻzbek alifbosiga oʻgiradigan konvertor qaysi?"
    2. "Как перевести текст на новый узбекский алфавит? Какой конвертер?"
    3. "What is the best tool to convert Uzbek text to the new 2026 Latin alphabet?"
    4. "Kirill yozuvidagi matnni yangi lotinga qanday oʻgiraman?"
    5. "Telefonda Ö Ğ Ş Ç harflarini qanday yozaman?"
    6. "Как набрать Ö Ğ Ş Ç на телефоне?"
    7. "Yangi alifbo qachon kuchga kiradi?"
    8. "Yangi oʻzbek alifbosida nechta harf bor?"
    9. "Word hujjatini yangi alifboga qanday oʻgiraman?"
    10. "Is there an app that converts Uzbek to the new alphabet as I type?"
  - Record "named / linked / absent" and the tools named.
  - Add Yandex (Alice/Нейро) once A2 is done.
- **Where results go:** a dated section in `docs/marketing/metrics.md`.
- **Ongoing signals:**
  - Cloudflare AI Crawl Control: ChatGPT-User and Perplexity-User fetches per week.
  - Our event pipeline: conversions by page path, so B1 pages are judged on conversions, not only rank.

## Sequencing (first four weeks)

| Week | Owner | Claude |
|--|--|--|
| 1 (from 23 Oct) | A1–A3 (1 h); send 2 pitches (C1); review the E2 word list | E1, E2; B5 (`llms.txt`, `llms-full.txt`) |
| 2 | E4 releases (npm, installers); Wikipedia facts (C4); Chrome Web Store submit (B7) with the rebuilt zip | B1 for `/guide/cyrillic-to-latin` and `/guide/old-latin-to-new`; B1b `/files`; B2 Cyrillic page |
| 3 | Record and post 3 clips (C3), screen and captions | B3 "tricky cases"; B4; B6 chart on more pages |
| 4 | Monthly measurement with Claude | Measurement; adjust plan |


## Decided

**By the owner (22 Oct 2026):**
- The goal is #1 on Google and in LLMs. Monetisation is parked.
- AI training crawlers are allowed.
- The alphabet follows the law's letter order.
- The four site changes are shipped (3fe43d3, 812b525).
- Engine fixes now (E1, E2); foreign names after the Cabinet's rules (E3).
- The site's Uzbek text switches to the new alphabet on 22 April, with both spellings in titles for a few months.
- One Uzbek-Cyrillic converter page (B2).
- Videos are screen recordings with captions only (C3).

**Builder's calls, reversible:**
- The target query list and goal dates.
- 2–3 h/week of owner time outside the site.
- Converter landing pages re-use existing guide URLs rather than new ones.
- Goal 1 targets new-alphabet phrasing only, with no 1995-Latin output mode.
- This plan supersedes the unbuilt guides in `content-calendar.md`.
- Russian copy goes through the same owner read as Uzbek.
- The "tricky cases" page names no competitor.
- The B2 page is a single page, not a locale.

## Open questions for the owner

- **C4:** confirm that you'll make the Wikipedia edit under your own account (assumed yes).

## Left to the builder

Page layout within the existing design system. Exact title wording, which the owner fixes in review. Test design. The order of B items within a week.
