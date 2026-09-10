# Developer launch

Days 3–7 of Wave 1, after the repo is public and the packages are on npm. Developers are a small audience here, but they are the ones who will embed the engine in CMSs, keyboards and government systems.

## Repo checklist (do before anything below)

- [ ] `LICENSE` (MIT), `CONTRIBUTING.md`, package READMEs are on `main` (they are, after the launch-gtm merge).
- [ ] GitHub → Settings → make the repository **Public**.
- [ ] Repo description: `Uzbek Cyrillic / old Latin → 2026 Latin alphabet converter. Web, Telegram, Chrome, macOS, API. Open-source engine.`
- [ ] Topics: `uzbek` `transliteration` `alphabet` `uzbekistan` `typescript` `cloudflare-workers` `tauri` `react` `grammy`
- [ ] Publish the draft release `desktop-v0.1.1` (Releases → edit draft → Publish). The site keeps serving the `.dmg` from `alfavit.uz/download/Alfavit.dmg`.
- [ ] npm: `npm login`, create org `alfavit` (npmjs.com → Add Organization, free), then:
  ```bash
  pnpm turbo run build --filter=@alfavit/engine --filter=@alfavit/sdk
  pnpm --filter @alfavit/engine publish --no-git-checks
  pnpm --filter @alfavit/sdk publish --no-git-checks
  ```
- [ ] Check `https://www.npmjs.com/package/@alfavit/engine` renders the README.

## Show HN

Post on a weekday between 14:00 and 16:00 Tashkent time (morning US East). Title ≤ 80 characters, no marketing words.

**Title:** `Show HN: Open-source engine for Uzbekistan's new Latin alphabet (ş ç ö ğ)`

**Text:**
```
Uzbekistan is changing its Latin alphabet: the Senate approved the law this week, replacing the digraphs sh/ch and the apostrophe letters oʻ/gʻ with ş ç ö ğ (28 letters + one apostrophe sign). Media and official documents switch after the President signs; textbooks roll over from 2027 to 2031.

I built Alfavit in July when parliament passed the law: a dependency-free TypeScript engine that converts Cyrillic or the 1995 Latin into the new alphabet, plus the surfaces people actually use it from — a web app, a Telegram bot that works inline in any chat, a Chrome extension, a Tauri macOS app that converts as you type, and a small Cloudflare Workers API.

The interesting problems were not the letter table:
- Cyrillic е is e or ye depending on position (word-initial or after a vowel/ъ/ь).
- The old apostrophe in oʻ/gʻ was typed at least ten different ways (ʻ ʼ ' ‘ ’ ` …), so normalization comes first.
- Real text is mixed-script: Russian sentences inside Uzbek, Latin brands inside Cyrillic. The engine segments runs and converts each.
- Some choices are genuinely ambiguous (Cyrillic ц), so the engine returns flags with alternatives instead of guessing silently.

Engine: https://github.com/AbdumajidRashidov/alfavit?utm_source=hn&utm_medium=post&utm_campaign=senate-2026-09 (MIT, npm @alfavit/engine)
Try it: https://alfavit.uz/?utm_source=hn&utm_medium=post&utm_campaign=senate-2026-09

I would like feedback on the ambiguity-flag API and on how you would ship a keyboard layout for four new letters to a whole country.
```

Reply policy: answer every comment for the first three hours; technical questions get code links, not summaries.

## Habr article (ru) — outline

Working title: **«Узбекистан меняет алфавит: почему четыре буквы ломали поиск и как мы написали конвертер»**

1. **33 года перехода** — 1993/1995 latinization, why Cyrillic never disappeared, and what the 2026 law actually changes (four letters, ng, 28 + 1). Two paragraphs, sourced.
2. **Почему oʻ и gʻ ломали всё** — a letter plus an apostrophe; 10+ Unicode variants people actually type; consequences for search, URLs, sorting, deduplication in databases. Show a hex dump of the same word typed three ways.
3. **Новые буквы в Unicode** — ş ç ö ğ code points, precomposed vs. combining, why they are safe for URLs and filenames now.
4. **Правило е/ye как конечный автомат** — the position-dependent rule with the actual code from `convert-cyrillic.ts`.
5. **Смешанные тексты** — segmentation by script run, what counts as "foreign", and the traps (Latin brand names, numbers, punctuation).
6. **Флаги неоднозначности вместо тихих догадок** — the `flags` array, why the UI shows them, the ц case.
7. **Один движок — пять поверхностей** — web (vite-react-ssg), Telegram inline (grammY on Workers), Chrome MV3, Tauri live transform, Hono API; how the monorepo keeps them on one implementation.
8. **Что дальше** — keyboards, mobile, what a country-scale transition needs from software. Invitation to contribute.

Length: 12–15 minutes read. Publish in hubs: Программирование, TypeScript, Open source. Link with `utm_source=habr`.

## npm / README announcement lines

For the npm README top and the dev.to variant:

```
@alfavit/engine — convert Uzbek Cyrillic or 1995 Latin to the 2026 alphabet (ş ç ö ğ). Zero dependencies, deterministic, returns ambiguity flags. Used by alfavit.uz, the Telegram bot, the Chrome extension and the macOS app.
```

**dev.to variant (en):** reuse the Show HN text with the title `I built an open-source converter for Uzbekistan's new alphabet — here is what was hard` and add one screenshot of the converter and one code block from the README.

## Tracker

Log Show HN, Habr and dev.to in `private/trackers.md` (gitignored): date, URL, comments answered, stars and downloads after 7 days.
