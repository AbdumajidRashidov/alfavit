# Launch & Go-To-Market Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the product/distribution fixes and the marketing kit that let Alfavit launch on the Senate's 10 September 2026 approval of the 28-letter alphabet, per the approved spec.

**Architecture:** Web changes are additive React components and content modules inside the existing vite-react-ssg site (uz/ru/en, `translations.ts` as the single string source, `PAGE_PATHS` as the single route/sitemap source). The bot gains a pure `buildReplyKeyboard` helper wired into the existing text handler. Extension and packages get metadata-only changes plus READMEs. Marketing copy lives as Markdown under `docs/marketing/` drawn from one fact base.

**Tech Stack:** pnpm 9 + Turborepo, TypeScript (strict), React 18, vite-react-ssg, Tailwind utility classes, Vitest + Testing Library, grammY 1.44, esbuild (extension), Cloudflare Pages/Workers (deploy via CI on `main`).

**Spec:** `docs/specs/2026-09-10-launch-gtm-design.md`

## Global Constraints

- Branch: all work on `launch-gtm` (already created from `main`). One commit per task, Conventional Commits style used in this repo (`feat(web): …`, `feat(bot): …`, `chore(extension): …`, `docs(marketing): …`).
- i18n: every new UI string exists in **all three** locales in `apps/web/src/i18n/translations.ts`, added to `en` first (`TranslationKey = keyof typeof translations.en`). Keep keys sorted next to their siblings; each locale block ends with `'alphabet.loanword.note'` (en line 101, uz line 200, ru line 299 at the time of writing) — append new keys after it.
- Uzbek apostrophes: `ʻ` (U+02BB) inside old-Latin words (`oʻzbek`, `gʻalaba`); `ʼ` (U+02BC) as tutuq belgisi in Uzbek prose (`maʼqulladi`, `eʼlon`). Never a straight `'`.
- Content accuracy (spec decision): public copy states **four** letter changes (sh→ş, ch→ç, gʻ→ğ, oʻ→ö) plus "ng is no longer a separate letter". No "ts→c" presented as a letter change anywhere (site, README, llms.txt, extension listing). Cyrillic ц is described only as engine behaviour: written `s`, `c` flagged as an alternative.
- Verified facts (use verbatim; do not invent dates): Legislative Chamber adopted the law **7 July 2026**; Senate approved and sent it to the President **10 September 2026**; 28 letters + 1 apostrophe sign (was 26 letters + 3 letter combinations); after entry into force media, state bodies and official correspondence switch, personal use stays free, documents in the current alphabet stay valid; first-grade textbooks **2027/28 school year**; all textbooks **2031**.
- UTM scheme for every marketing link: `utm_source` ∈ {gazeta, spot, kun, daryo, zamin, uzdaily, podrobno, telegram, reddit, linkedin, x, hn, habr, npm, bot, extension, share}, `utm_medium` ∈ {press, post, referral, button}, `utm_campaign=senate-2026-09` (Wave 1) or `signing-2026` (Wave 2). Example: `https://alfavit.uz/?utm_source=gazeta&utm_medium=press&utm_campaign=senate-2026-09`.
- No new runtime dependencies. No changes to Windows/mobile/signing/privacy-page localization.
- Tests must stay green: `pnpm turbo run test` (baseline: 8 turbo tasks OK; web 16 files / 52 tests), `pnpm build`, `pnpm --dir apps/web test:dist`.
- Owner (native speaker) verifies all Uzbek copy before merge; the plan drafts it.

## Fact base for marketing tasks (Tasks 8–11)

- Product: Alfavit — converter for the 2026 Uzbek alphabet. Channels: web `https://alfavit.uz` (uz/ru/en, on-device, free), Telegram `@alfavit_uz_bot` (DM + inline in any chat), Chrome extension (popup + right-click, pending store review), macOS app (`https://alfavit.uz/download/Alfavit.dmg`, universal, unsigned, live transform converts as you type), files `.docx .txt .srt` at `https://alfavit.uz/files`, API `POST https://api.alfavit.uz/v1/transliterate` (no key, 60 req/min, 100k chars), SDK `@alfavit/sdk`, engine `@alfavit/engine` (MIT, npm, GitHub `https://github.com/AbdumajidRashidov/alfavit`).
- Differentiator: as of 10 Sep 2026 no other public converter (kirillotin.uz, lotin.uz, transliterator.uz, kiril-lotin.uz, parsing.uz, lotincha.uz, uzlatin.uz) mentions ş ç ö ğ; Alfavit is the only multi-channel converter for the 2026 alphabet. Engine handles the position-dependent e/ye rule and returns ambiguity flags.
- Press hooks from 10 Sep coverage: gazeta.uz and spot.uz describe the keyboard pain (typing ö takes up to six keystrokes), a layout proposal placing Ö Ğ Ş Ç on unused punctuation keys, and "private IT specialists have started building programs" — unnamed. Media outlets must switch after the law takes effect (gazeta.uz `oav-alifbo`).
- Outlet contacts (verified): Gazeta.uz `info@gazeta.uz`, Telegram `https://t.me/gazetauz_ozb`; Spot.uz `info@spot.uz`, Telegram `https://t.me/spotuz_uz`. Kun.uz, Daryo.uz, Zamin.uz, UzDaily.uz, Podrobno.uz: take the editorial email from each site's footer/contact page (mark "verify" in the tracker).
- Source articles: `https://www.gazeta.uz/oz/2026/09/10/uzb-alphabet/`, `https://www.gazeta.uz/oz/2026/09/10/oav-alifbo/`, `https://www.gazeta.uz/oz/2026/09/10/keyboard-uzb/`, `https://www.spot.uz/oz/2026/09/10/uzbek-alphabet`, `https://www.spot.uz/oz/2026/09/10/alphabet`, `https://daryo.uz/fxq5yS_DR`, `https://zamin.uz/en/uzbekistan/220841-major-change-in-schools-all-textbooks-to-be-transferred-to-the-new-alphabet-by-2031.html`, `https://kun.uz/news/2026/07/07/ozbekistonda-alifbo-islohoti-boyicha-qonun-qabul-qilindi-4cf07b`.
- Communities (handles to verify before posting): IT Masters (`t.me/itmastersuz`), IT specialist (`t.me/Itspecuz`), Uzbekistan Developers Community, Python Uzbekistan, Xinux (Linux), r/Uzbekistan, LinkedIn, X, Hacker News (Show HN), Habr (ru).
- Assets on disk: `apps/web/public/logo.png`, `apps/web/public/og.png` (1200×630, "Uzbek text, in the new Latin alphabet."), `alfavit-bot-logo-512.png` (repo root, untracked), `docs/chrome-web-store/screenshots/*.png`.

## File Structure

**Web (`apps/web/src`)**
- `content/types.ts` — add `TimelineItem`, `GuideLetter`; extend `Guide` with `letters?`, `note?`.
- `content/timeline.ts` (new) — reform timeline rows per locale.
- `content/reform.ts` — drop the `ts` spotlight in all locales.
- `content/faq.ts` — four-change wording, Senate date.
- `content/guides/keyboard.ts` (new) — keyboard guide content per locale.
- `i18n/translations.ts` — updated and new keys (reform, news, guide, converter.share).
- `components/NewsStrip.tsx` (new) — one-line banner.
- `components/GuidePage.tsx` — letters strip + note rendering.
- `components/Converter.tsx` — Share button + `telegramShareHref`.
- `components/Channels.tsx` — `EXTENSION_STORE_URL` + `extensionStoreUrl` prop.
- `pages/ReformPage.tsx` — law text, ng note, timeline, sources, guide link.
- `pages/HomePage.tsx` — render `NewsStrip`.
- `pages/GuideKeyboardPage.tsx` (new), `router.tsx`, `seo/config.ts` — route + sitemap.
- `pages/AlphabetPage.tsx` — link to the keyboard guide.
- Tests: `tests/ReformPage.test.tsx` (new), `tests/NewsStrip.test.tsx` (new), `tests/GuideKeyboardPage.test.tsx` (new), `tests/Converter.test.tsx`, `tests/Channels.test.tsx`, `tests/seo.test.ts`, `tests/reform-build.test.ts`, `tests/guides-build.test.ts`, `tests/sitemap-build.test.ts`.
- `public/llms.txt` — mapping + status + new guide.

**Bot (`apps/bot/src`)**: `handlers.ts` (+`buildReplyKeyboard`), `bot.ts`, `i18n.ts`, `config.ts`, `setup-config.ts` (new), `package.json`, `tests/handlers.test.ts`.

**Extension**: `apps/extension/manifest.json`, `docs/chrome-web-store/LISTING.md`, `docs/chrome-web-store/alfavit-extension-v0.1.1.zip` (new; v0.1.0 zip deleted).

**Open source**: `LICENSE` (new), `CONTRIBUTING.md` (new), `README.md`, `packages/engine/package.json`, `packages/engine/src/index.ts`, `packages/engine/README.md` (new), `packages/sdk/package.json`, `packages/sdk/README.md` (new).

**Marketing (`docs/marketing/`, all new)**: `README.md`, `metrics.md`, `demo-shotlist.md`, `press-kit.md`, `press-outreach.md`, `launch-posts.md`, `community-seeding.md`, `developer-launch.md`, `wave-2-signing-kit.md`, `content-calendar.md`.

---

### Task 1: Reform page — accuracy fix, Senate update, timeline

**Files:**
- Modify: `apps/web/src/content/types.ts`
- Create: `apps/web/src/content/timeline.ts`
- Modify: `apps/web/src/content/reform.ts` (lines 10, 17, 24 — the `id: 'ts'` entries)
- Modify: `apps/web/src/content/faq.ts` (en/uz/ru entries "What changed", "When was the reform adopted", "Which letters changed")
- Modify: `apps/web/src/i18n/translations.ts`
- Modify: `apps/web/src/pages/ReformPage.tsx`
- Modify: `apps/web/src/tests/reform-build.test.ts`
- Create: `apps/web/src/tests/ReformPage.test.tsx`
- Modify: `apps/web/public/llms.txt`, `README.md` (root, line 4)

**Interfaces:**
- Produces: `TimelineItem { date: string; body: string }` and `timeline: Record<Locale, TimelineItem[]>` exported from `content/timeline.ts`; translation keys `reform.timelineLabel`, `reform.updated`, `reform.ngNote` (used only here).

- [ ] **Step 1: Write the failing unit test**

Create `apps/web/src/tests/ReformPage.test.tsx`:

```tsx
import { screen } from '@testing-library/react'
import { expect, test, beforeEach } from 'vitest'
import { renderWithLocale } from './renderApp'
import { ReformPage } from '../pages/ReformPage'

beforeEach(() => {
  localStorage.clear()
  Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true })
})

test('states the Senate approval and the pending signature', () => {
  renderWithLocale(<ReformPage />, '/en')
  expect(screen.getByText(/approved by the Senate on 10 September 2026/)).toBeInTheDocument()
  expect(screen.getByText('Updated 10 September 2026')).toBeInTheDocument()
})

test('renders the transition timeline', () => {
  renderWithLocale(<ReformPage />, '/en')
  expect(screen.getByText('Timeline')).toBeInTheDocument()
  expect(screen.getByText('10 September 2026')).toBeInTheDocument()
  expect(screen.getByText('2031')).toBeInTheDocument()
})

test('lists four letter changes, the ng note, and no ts→c row', () => {
  renderWithLocale(<ReformPage />, '/en')
  expect(screen.getByText('Ş ş')).toBeInTheDocument()
  expect(screen.queryByText('C c')).not.toBeInTheDocument()
  expect(screen.getByText(/ng is no longer listed/)).toBeInTheDocument()
})

test('uz locale carries the Senate date', () => {
  renderWithLocale(<ReformPage />, '/')
  expect(screen.getByText(/2026-yil 10-sentabrda maʼqulladi/)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --dir apps/web exec vitest run src/tests/ReformPage.test.tsx`
Expected: FAIL — "Unable to find an element with the text: /approved by the Senate/" (the `C c` assertion also fails because the row still exists).

- [ ] **Step 3: Add the timeline type and content**

In `apps/web/src/content/types.ts` append:

```ts
export interface TimelineItem {
  date: string
  body: string
}
```

Create `apps/web/src/content/timeline.ts`:

```ts
import type { Locale } from '../seo/config'
import type { TimelineItem } from './types'

// Verified against gazeta.uz / spot.uz / daryo.uz (10 Sep 2026) and zamin.uz (textbooks).
export const timeline: Record<Locale, TimelineItem[]> = {
  en: [
    { date: '7 July 2026', body: 'The Legislative Chamber adopts the law changing the Latin-based Uzbek alphabet.' },
    { date: '10 September 2026', body: 'The Senate approves the law and sends it to the President.' },
    { date: 'Next', body: 'Presidential signature and official publication; the law enters into force after a transition period.' },
    { date: 'After entry into force', body: 'Media, state bodies and official correspondence switch to the new alphabet. Documents issued in the current alphabet stay valid; personal use is free.' },
    { date: '2027/28 school year', body: 'First-grade textbooks are printed in the new alphabet.' },
    { date: '2031', body: 'All school textbooks are converted.' },
  ],
  uz: [
    { date: '2026-yil 7-iyul', body: 'Qonunchilik palatasi lotin yozuviga asoslangan oʻzbek alifbosini oʻzgartirish haqidagi qonunni qabul qildi.' },
    { date: '2026-yil 10-sentabr', body: 'Senat qonunni maʼqullab, Prezidentga yubordi.' },
    { date: 'Keyingi qadam', body: 'Prezident imzosi va rasmiy eʼlon qilinishi; qonun oʻtish davridan soʻng kuchga kiradi.' },
    { date: 'Kuchga kirgach', body: 'OAV, davlat organlari va rasmiy yozishmalar yangi alifboga oʻtadi. Amaldagi alifboda berilgan hujjatlar kuchini saqlaydi; shaxsiy yozishmalarda tanlov erkin.' },
    { date: '2027/28 oʻquv yili', body: '1-sinf darsliklari yangi alifboda chop etiladi.' },
    { date: '2031', body: 'Barcha maktab darsliklari yangi alifboga oʻtkaziladi.' },
  ],
  ru: [
    { date: '7 июля 2026', body: 'Законодательная палата принимает закон об изменении узбекского алфавита на основе латиницы.' },
    { date: '10 сентября 2026', body: 'Сенат одобряет закон и направляет его Президенту.' },
    { date: 'Далее', body: 'Подпись Президента и официальное опубликование; закон вступает в силу после переходного периода.' },
    { date: 'После вступления в силу', body: 'СМИ, госорганы и официальная переписка переходят на новый алфавит. Документы на действующем алфавите остаются в силе; в личной переписке выбор свободный.' },
    { date: '2027/28 учебный год', body: 'Учебники для 1-го класса печатаются на новом алфавите.' },
    { date: '2031', body: 'Все школьные учебники переведены на новый алфавит.' },
  ],
}
```

- [ ] **Step 4: Update translations (all three locales)**

In `apps/web/src/i18n/translations.ts` replace the values of these existing keys:

`en`:
```ts
    'reform.law': 'Adopted by the Legislative Chamber on 7 July 2026 and approved by the Senate on 10 September 2026; it now awaits the President’s signature. The alphabet has 28 letters and one apostrophe sign (was 26 letters and 3 letter combinations).',
    'meta.reform.desc': 'Uzbekistan’s 2026 Latin alphabet reform, letter by letter: what changed, what the Senate approved on 10 September 2026, and the transition timeline.',
    'alphabet.loanword.note': 'In loanwords, Cyrillic ц is written s; Alfavit marks c as an alternative so you can choose.',
```
`uz`:
```ts
    'reform.law': 'Qonunchilik palatasi 2026-yil 7-iyulda qabul qildi, Senat 2026-yil 10-sentabrda maʼqulladi; endi Prezident imzosi kutilmoqda. Alifboda 28 ta harf va bitta tutuq belgisi bor (avval 26 ta harf va 3 ta harf birikmasi edi).',
    'meta.reform.desc': 'Oʻzbekistonning 2026-yilgi lotin alifbosi islohoti harfma-harf: nima oʻzgardi, Senat 2026-yil 10-sentabrda nimani maʼqulladi va oʻtish bosqichlari.',
    'alphabet.loanword.note': 'Oʻzlashma soʻzlarda kirillcha ц harfi s bilan yoziladi; Alfavit c variantini ham belgilab koʻrsatadi — tanlov sizda.',
```
`ru`:
```ts
    'reform.law': 'Принят Законодательной палатой 7 июля 2026 года и одобрен Сенатом 10 сентября 2026 года; теперь ожидает подписи Президента. В алфавите 28 букв и один знак апострофа (было 26 букв и 3 буквосочетания).',
    'meta.reform.desc': 'Реформа узбекской латиницы 2026 года буква за буквой: что изменилось, что одобрил Сенат 10 сентября 2026 года и этапы перехода.',
    'alphabet.loanword.note': 'В заимствованиях кириллическая ц передаётся как s; Alfavit отмечает c как альтернативу, чтобы вы могли выбрать.',
```

Append **after** `'alphabet.loanword.note'` in each block:

`en`:
```ts
    'reform.timelineLabel': 'Timeline',
    'reform.updated': 'Updated 10 September 2026',
    'reform.ngNote': 'The combination ng is no longer listed as a separate letter; it stays in spelling as n + g.',
```
`uz`:
```ts
    'reform.timelineLabel': 'Bosqichlar',
    'reform.updated': '2026-yil 10-sentabrda yangilandi',
    'reform.ngNote': 'ng birikmasi endi alifboda alohida harf sifatida berilmaydi; imloda n + g tarzida yoziladi.',
```
`ru`:
```ts
    'reform.timelineLabel': 'Хронология',
    'reform.updated': 'Обновлено 10 сентября 2026 года',
    'reform.ngNote': 'Сочетание ng больше не считается отдельной буквой; в написании остаётся как n + g.',
```

- [ ] **Step 5: Remove the ts spotlight and fix the FAQ**

In `apps/web/src/content/reform.ts` delete the three lines starting with `{ id: 'ts', from: 'ts', to: 'c', …` (one per locale).

In `apps/web/src/content/faq.ts` replace these entries (match on `q`):

`en`:
```ts
    { q: 'What changed in the 2026 Uzbek alphabet reform?', a: 'Uzbekistan replaced the 1995 digraphs and apostrophe-letters with single letters: sh→ş, ch→ç, gʻ→ğ, oʻ→ö; ng is no longer a separate letter. The alphabet now has 28 letters and one apostrophe sign.' },
    { q: 'When was the reform adopted?', a: 'The Legislative Chamber adopted the law on 7 July 2026 and the Senate approved it on 10 September 2026. It takes effect once the President signs it.' },
    { q: 'Which letters changed?', a: 'Four: sh→ş, ch→ç, gʻ→ğ, oʻ→ö. The combination ng is no longer counted as a separate letter.' },
```
`uz`:
```ts
    { q: '2026-yilgi oʻzbek alifbosi islohotida nima oʻzgardi?', a: 'Oʻzbekiston 1995-yildagi qoʻsh harflar va apostrofli harflarni bitta harfga almashtirdi: sh→ş, ch→ç, gʻ→ğ, oʻ→ö; ng endi alohida harf hisoblanmaydi. Endi alifboda 28 ta harf va bitta tutuq belgisi bor.' },
    { q: 'Islohot qachon qabul qilindi?', a: 'Qonunchilik palatasi qonunni 2026-yil 7-iyulda qabul qildi, Senat 2026-yil 10-sentabrda maʼqulladi. Qonun Prezident imzolagach kuchga kiradi.' },
    { q: 'Qaysi harflar oʻzgardi?', a: 'Toʻrtta: sh→ş, ch→ç, gʻ→ğ, oʻ→ö. ng birikmasi endi alohida harf sifatida sanalmaydi.' },
```
`ru`:
```ts
    { q: 'Что изменилось в реформе узбекского алфавита 2026 года?', a: 'Узбекистан заменил диграфы и буквы с апострофом образца 1995 года одиночными буквами: sh→ş, ch→ç, gʻ→ğ, oʻ→ö; ng больше не считается отдельной буквой. Теперь в алфавите 28 букв и один знак апострофа.' },
    { q: 'Когда принята реформа?', a: 'Законодательная палата приняла закон 7 июля 2026 года, Сенат одобрил его 10 сентября 2026 года. Закон вступит в силу после подписи Президента.' },
    { q: 'Какие буквы изменились?', a: 'Четыре: sh→ş, ch→ç, gʻ→ğ, oʻ→ö. Сочетание ng больше не считается отдельной буквой.' },
```

Then confirm nothing else in the web app presents ts→c as a change: `grep -rn "ts→c\|ts → c" apps/web/src apps/web/public README.md` must return only lines you are about to edit (llms.txt, README).

- [ ] **Step 6: Update the Reform page**

In `apps/web/src/pages/ReformPage.tsx`:

Add the import:
```tsx
import { timeline } from '../content/timeline'
```
Replace `SOURCES` and `CHANGES`:
```tsx
const SOURCES: Array<[string, string]> = [
  ['gazeta.uz — Senate approval, 10 Sep 2026', 'https://www.gazeta.uz/oz/2026/09/10/uzb-alphabet/'],
  ['spot.uz — Senate approval, 10 Sep 2026', 'https://www.spot.uz/oz/2026/09/10/uzbek-alphabet'],
  ['daryo.uz — Senate approval, 10 Sep 2026', 'https://daryo.uz/fxq5yS_DR'],
  ['zamin.uz — textbook timeline to 2031', 'https://zamin.uz/en/uzbekistan/220841-major-change-in-schools-all-textbooks-to-be-transferred-to-the-new-alphabet-by-2031.html'],
  ['gazeta.uz — law adopted, 7 Jul 2026', 'https://www.gazeta.uz/en/2026/07/09/alphabet/'],
  ['kun.uz — law adopted, 7 Jul 2026', 'https://kun.uz/news/2026/07/07/ozbekistonda-alifbo-islohoti-boyicha-qonun-qabul-qilindi-4cf07b'],
  ['Wikipedia', 'https://en.wikipedia.org/wiki/Uzbek_alphabet'],
]

const CHANGES: Array<[string, string]> = [
  ['Sh sh', 'Ş ş'],
  ['Ch ch', 'Ç ç'],
  ['Gʻ gʻ', 'Ğ ğ'],
  ['Oʻ oʻ', 'Ö ö'],
]
```
Directly after the intro paragraph (`<p className="mt-6 …">{t('reform.intro')}</p>`) add:
```tsx
        <p className="mt-3 text-sm text-muted">{t('reform.updated')}</p>
```
Directly after the closing `</div>` of the CHANGES table add:
```tsx
        <p className="mt-3 text-sm text-muted">{t('reform.ngNote')}</p>
```
Between the spotlights block (`</div>` closing `space-y-10`) and `<p className="mt-16 …">{t('reform.law')}</p>` add:
```tsx
        <h2 className="mt-16 text-sm font-medium uppercase tracking-wider text-muted">{t('reform.timelineLabel')}</h2>
        <ol className="mt-4 divide-y divide-black/10 border-t border-black/10">
          {timeline[locale].map((item) => (
            <li key={item.date} className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr] sm:gap-6">
              <span className="font-medium text-foreground">{item.date}</span>
              <span className="leading-relaxed text-muted">{item.body}</span>
            </li>
          ))}
        </ol>
```

- [ ] **Step 7: Fix the build test, llms.txt and README line**

`apps/web/src/tests/reform-build.test.ts`, first test body becomes:
```ts
  const html = dist('reform.html')
  expect(html).toContain('id="sh"')
  expect(html).toContain('id="oh"')
  expect(html).not.toContain('id="ts"')
  expect(html).toContain('"@type":"Article"')
  expect(html).toContain('şahar')
  expect(html).toContain('Senat')
```
`apps/web/public/llms.txt`: delete the line `- loanword ts → c`; replace the paragraph starting `The 2026 reform (adopted 7 July 2026)` with:
```
The 2026 reform replaced the 1995 digraphs and apostrophe-letters with single letters: 28 letters and one apostrophe sign; ng is no longer a separate letter. The law was adopted by the Legislative Chamber on 7 July 2026 and approved by the Senate on 10 September 2026; it awaits the President's signature.
```
`README.md` line 4: change `` (`sh→ş`, `ch→ç`, `gʻ→ğ`, `oʻ→ö`, loanword `ts→c`) `` to `` (`sh→ş`, `ch→ç`, `gʻ→ğ`, `oʻ→ö`) ``.

- [ ] **Step 8: Run tests**

Run: `pnpm --dir apps/web test` then `pnpm --dir apps/web test:dist`
Expected: all PASS (web unit now 17 files; dist tests PASS with `id="oh"` and `Senat`).

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/content apps/web/src/i18n/translations.ts apps/web/src/pages/ReformPage.tsx apps/web/src/tests/ReformPage.test.tsx apps/web/src/tests/reform-build.test.ts apps/web/public/llms.txt README.md
git commit -m "feat(web): reform page — Senate approval, transition timeline, four official letter changes"
```

---

### Task 2: Home page news strip

**Files:**
- Create: `apps/web/src/components/NewsStrip.tsx`
- Modify: `apps/web/src/pages/HomePage.tsx`, `apps/web/src/i18n/translations.ts`
- Create: `apps/web/src/tests/NewsStrip.test.tsx`

**Interfaces:**
- Produces: `<NewsStrip />` (no props); translation key `news.senate` (Wave 2 changes only this value).

- [ ] **Step 1: Write the failing test**

```tsx
import { screen } from '@testing-library/react'
import { expect, test, beforeEach } from 'vitest'
import { renderWithLocale } from './renderApp'
import { NewsStrip } from '../components/NewsStrip'

beforeEach(() => {
  localStorage.clear()
  Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true })
})

test('links to the localized reform page (en)', () => {
  renderWithLocale(<NewsStrip />, '/en')
  expect(screen.getByRole('link', { name: /Senate approved the 28-letter alphabet/ })).toHaveAttribute('href', '/en/reform')
})

test('uz is the default locale at the root path', () => {
  renderWithLocale(<NewsStrip />, '/')
  expect(screen.getByRole('link', { name: /Senat/ })).toHaveAttribute('href', '/reform')
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --dir apps/web exec vitest run src/tests/NewsStrip.test.tsx`
Expected: FAIL — cannot resolve `../components/NewsStrip`.

- [ ] **Step 3: Add strings and the component**

Append after `'reform.ngNote'` in each locale of `translations.ts`:

```ts
    'news.senate': '10 September: the Senate approved the 28-letter alphabet. What changes →',   // en
    'news.senate': '10-sentabr: Senat 28 harfli yangi alifboni maʼqulladi. Nima oʻzgaradi →',      // uz
    'news.senate': '10 сентября: Сенат одобрил алфавит из 28 букв. Что меняется →',              // ru
```

Create `apps/web/src/components/NewsStrip.tsx`:
```tsx
import { Link } from 'react-router-dom'
import { useT } from '../i18n/useT'
import { useLocalePath } from '../i18n/useLocalePath'

/** One-line news banner above the hero. The text is a single i18n key so the
 * Wave-2 (presidential signature) update is a string change, not a code change. */
export function NewsStrip() {
  const { t } = useT()
  const lp = useLocalePath()
  return (
    <div className="border-b border-black/10 bg-black/[0.03] px-6 py-2.5 text-center text-sm text-foreground">
      <Link to={lp('/reform')} className="underline decoration-black/30 underline-offset-4 transition-colors hover:text-muted">
        {t('news.senate')}
      </Link>
    </div>
  )
}
```

In `apps/web/src/pages/HomePage.tsx` import `{ NewsStrip } from '../components/NewsStrip'` and render `<NewsStrip />` immediately before `<Hero />`.

- [ ] **Step 4: Run tests**

Run: `pnpm --dir apps/web test`
Expected: PASS (NewsStrip 2 tests; routing tests still green — Home renders the strip).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/NewsStrip.tsx apps/web/src/pages/HomePage.tsx apps/web/src/i18n/translations.ts apps/web/src/tests/NewsStrip.test.tsx
git commit -m "feat(web): news strip on the home page for the Senate vote"
```

---

### Task 3: Keyboard guide — `/guide/keyboard`

**Files:**
- Modify: `apps/web/src/content/types.ts`, `apps/web/src/components/GuidePage.tsx`, `apps/web/src/router.tsx`, `apps/web/src/seo/config.ts`, `apps/web/src/i18n/translations.ts`, `apps/web/src/pages/ReformPage.tsx`, `apps/web/src/pages/AlphabetPage.tsx`, `apps/web/public/llms.txt`
- Create: `apps/web/src/content/guides/keyboard.ts`, `apps/web/src/pages/GuideKeyboardPage.tsx`
- Test: create `apps/web/src/tests/GuideKeyboardPage.test.tsx`; modify `tests/seo.test.ts`, `tests/sitemap-build.test.ts`, `tests/guides-build.test.ts`

**Interfaces:**
- Consumes: `Guide` type (existing), `GuidePage` props `{ guide, pagePath, titleKey, descKey }`.
- Produces: `GuideLetter { upper: string; lower: string; codePoint: string }`; `Guide.letters?: GuideLetter[]`, `Guide.note?: string`; `keyboard: Record<Locale, Guide>`; route `guide/keyboard`; keys `meta.guide.keyboard.title`, `meta.guide.keyboard.desc`, `guides.keyboard`.

- [ ] **Step 1: Write the failing tests**

Create `apps/web/src/tests/GuideKeyboardPage.test.tsx`:
```tsx
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi, beforeEach } from 'vitest'
import { renderWithLocale, renderApp } from './renderApp'
import { GuideKeyboardPage } from '../pages/GuideKeyboardPage'

beforeEach(() => {
  localStorage.clear()
  Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true })
})

test('renders the title, five steps and the four letter buttons', () => {
  renderWithLocale(<GuideKeyboardPage />, '/en')
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('How to type Ş, Ç, Ö, Ğ')
  expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(5)
  for (const pair of ['Ş ş', 'Ç ç', 'Ö ö', 'Ğ ğ']) expect(screen.getByText(pair)).toBeInTheDocument()
  expect(screen.getByText(/Turkish Q layout is the practical choice/)).toBeInTheDocument()
})

test('clicking a letter copies its lowercase form', async () => {
  const user = userEvent.setup()
  renderWithLocale(<GuideKeyboardPage />, '/en')
  const writeText = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
  await user.click(screen.getByRole('button', { name: 'Copy ş' }))
  expect(writeText).toHaveBeenCalledWith('ş')
  expect(screen.getByText('Copied')).toBeInTheDocument()
})

test('is routed under every locale', () => {
  renderApp('/ru/guide/keyboard')
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Как набирать буквы Ş, Ç, Ö, Ğ')
})
```

Add to `apps/web/src/tests/seo.test.ts`:
```ts
test('keyboard guide is in PAGE_PATHS for all locales and in the sitemap', () => {
  expect(localesForPath('guide/keyboard')).toEqual(['uz', 'ru', 'en'])
  const xml = generateSitemapXml()
  expect(xml).toContain('<loc>https://alfavit.uz/guide/keyboard</loc>')
  expect(xml).toContain('<loc>https://alfavit.uz/ru/guide/keyboard</loc>')
  expect(xml).toContain('<loc>https://alfavit.uz/en/guide/keyboard</loc>')
})
```
In `apps/web/src/tests/sitemap-build.test.ts` change the test name and count: `'dist/sitemap.xml has all 30 locale URLs'` and `toBe(30)`.

Add to `apps/web/src/tests/guides-build.test.ts`:
```ts
test('keyboard guide built for uz + ru + en with HowTo schema', () => {
  const uz = dist('guide/keyboard.html')
  expect(uz).toContain('Ş, Ç, Ö, Ğ harflarini qanday yozish')
  expect(uz).toContain('"@type":"HowTo"')
  expect(dist('ru/guide/keyboard.html')).toContain('Как набирать буквы Ş, Ç, Ö, Ğ')
  expect(dist('en/guide/keyboard.html')).toContain('How to type Ş, Ç, Ö, Ğ')
})
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --dir apps/web exec vitest run src/tests/GuideKeyboardPage.test.tsx src/tests/seo.test.ts`
Expected: FAIL — cannot resolve `../pages/GuideKeyboardPage`; `localesForPath('guide/keyboard')` passes by accident (unknown paths default to all locales) but the sitemap `toContain` assertions fail.

- [ ] **Step 3: Extend the Guide type and GuidePage**

`apps/web/src/content/types.ts` — replace the `Guide` interface:
```ts
export interface GuideLetter {
  upper: string
  lower: string
  codePoint: string
}

export interface Guide {
  title: string
  intro: string
  steps: { heading: string; body: string }[]
  examples: [string, string][]
  /** Optional strip of copyable letters rendered above the steps. */
  letters?: GuideLetter[]
  /** Optional muted note rendered after the steps. */
  note?: string
}
```

`apps/web/src/components/GuidePage.tsx` — full replacement:
```tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useT } from '../i18n/useT'
import { useLocalePath } from '../i18n/useLocalePath'
import { Seo } from './Seo'
import { howToLd } from '../seo/jsonld'
import type { Guide } from '../content/types'
import type { TranslationKey } from '../i18n/translations'

interface GuidePageProps {
  guide: Guide
  pagePath: string
  titleKey: TranslationKey
  descKey: TranslationKey
}

export function GuidePage({ guide, pagePath, titleKey, descKey }: GuidePageProps) {
  const { t } = useT()
  const lp = useLocalePath()
  const [copied, setCopied] = useState<string | null>(null)

  const copyLetter = async (lower: string) => {
    await navigator.clipboard.writeText(lower)
    setCopied(lower)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <>
      <Seo titleKey={titleKey} descKey={descKey} pagePath={pagePath} jsonLd={howToLd(guide.title, guide.steps)} breadcrumb />
      <section className="mx-auto max-w-3xl px-6 py-24">
        <h1 className="font-serif text-4xl sm:text-5xl text-foreground">{guide.title}</h1>
        <p className="mt-6 text-lg leading-relaxed text-muted">{guide.intro}</p>

        {guide.letters && (
          <div data-testid="letters" className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {guide.letters.map((L) => (
              <button
                key={L.lower}
                type="button"
                onClick={() => copyLetter(L.lower)}
                aria-label={`${t('converter.copy')} ${L.lower}`}
                className="rounded-2xl border border-black/10 px-4 py-5 text-center transition-colors hover:border-black/30"
              >
                <span className="block font-serif text-4xl text-foreground">{`${L.upper} ${L.lower}`}</span>
                <span className="mt-2 block font-mono text-xs text-muted">{copied === L.lower ? t('converter.copied') : L.codePoint}</span>
              </button>
            ))}
          </div>
        )}

        <ol className="mt-12 space-y-6">
          {guide.steps.map((step, i) => (
            <li key={step.heading} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-sm text-background">{i + 1}</span>
              <div>
                <h2 className="font-medium text-foreground">{step.heading}</h2>
                <p className="mt-1 leading-relaxed text-muted">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        {guide.note && <p className="mt-8 text-sm leading-relaxed text-muted">{guide.note}</p>}

        <div className="mt-12 rounded-2xl border border-black/10 p-6">
          <div className="flex flex-col gap-2 font-mono text-sm">
            {guide.examples.map(([from, to]) => (
              <div key={`${from}-${to}`} className="flex items-center gap-3">
                <span className="text-muted">{from}</span>
                <span aria-hidden="true" className="text-muted">→</span>
                <span className="text-foreground">{to}</span>
              </div>
            ))}
          </div>
        </div>

        <Link to={lp('/')} className="mt-10 inline-flex rounded-full bg-foreground px-6 py-2.5 text-sm text-background transition-transform hover:scale-[1.03]">
          {t('nav.cta')}
        </Link>
      </section>
    </>
  )
}
```
Note the `aria-label` uses the existing `converter.copy` key ("Copy" / "Nusxa olish" / "Копировать"), so the en button name is exactly `Copy ş`.

- [ ] **Step 4: Write the guide content**

Create `apps/web/src/content/guides/keyboard.ts`:
```ts
import type { Guide, GuideLetter } from '../types'
import type { Locale } from '../../seo/config'

const LETTERS: GuideLetter[] = [
  { upper: 'Ş', lower: 'ş', codePoint: 'U+015E / U+015F' },
  { upper: 'Ç', lower: 'ç', codePoint: 'U+00C7 / U+00E7' },
  { upper: 'Ö', lower: 'ö', codePoint: 'U+00D6 / U+00F6' },
  { upper: 'Ğ', lower: 'ğ', codePoint: 'U+011E / U+011F' },
]

const EXAMPLES: [string, string][] = [['shahar', 'şahar'], ['choy', 'çoy'], ['oʻzbek', 'özbek'], ['gʻalaba', 'ğalaba']]

// Keyboard facts: Turkish Q layout puts ğ on [, ş on ;, ö on , and ç on . (macOS and Windows).
// macOS U.S. layout: Option+U then O → ö, Option+C → ç. Word: hex code then Alt+X.
export const keyboard: Record<Locale, Guide> = {
  en: {
    title: 'How to type Ş, Ç, Ö, Ğ',
    intro: 'Four ways to type the four new Uzbek letters on Mac, Windows, iPhone and Android — or let Alfavit type them for you.',
    letters: LETTERS,
    steps: [
      { heading: 'Copy the letters from this page', body: 'Tap a letter above to copy it, then paste it where you write. Handy for a name, a heading or a form field.' },
      { heading: 'Mac', body: 'On the U.S. layout, Option+U then O gives ö and Option+C gives ç. For ş and ğ add the Turkish Q input source (System Settings → Keyboard → Input Sources): ğ sits on the [ key, ş on ;, ö on , and ç on the . key. The Character Viewer (Control+Command+Space) also has all four.' },
      { heading: 'Windows', body: 'Add the Turkish Q keyboard (Settings → Time & Language → Language & region → Add a keyboard) and use the same keys: ğ on [, ş on ;, ö on , and ç on the . key. In Word, type 015f then Alt+X for ş and 011f then Alt+X for ğ. With a numeric keypad, Alt+0246 gives ö and Alt+0231 gives ç.' },
      { heading: 'iPhone and Android', body: 'Add the Turkish keyboard (iOS: Settings → General → Keyboard → Keyboards; Android: Gboard → Languages). Ş, ç, ö and ğ are on it directly, and long-pressing s, c, o and g shows them too.' },
      { heading: 'Or let Alfavit type them', body: 'Keep typing the old way and convert: the Mac app converts as you type anywhere on your Mac; the web converter, Telegram bot and Chrome extension convert pasted or selected text.' },
    ],
    note: 'The official layout proposal places Ö, Ğ, Ş and Ç on punctuation keys that are unused in Uzbek. Until keyboards and operating systems ship it, the Turkish Q layout is the practical choice: it already has all four letters.',
    examples: EXAMPLES,
  },
  uz: {
    title: 'Ş, Ç, Ö, Ğ harflarini qanday yozish',
    intro: 'Yangi alifbodagi toʻrt harfni Mac, Windows, iPhone va Android klaviaturasida yozish yoʻllari — yoki Alfavit ularni siz uchun yozib bersin.',
    letters: LETTERS,
    steps: [
      { heading: 'Harflarni shu sahifadan nusxalang', body: 'Yuqoridagi harfga bosing — u nusxalanadi; keyin kerakli joyga qoʻying. Ism, sarlavha yoki forma maydoni uchun qulay.' },
      { heading: 'Mac', body: 'AQSh (U.S.) joylashuvida Option+U, keyin O — ö; Option+C — ç. ş va ğ uchun Turkish Q kiritish manbasini qoʻshing (System Settings → Keyboard → Input Sources): ğ — [ tugmasida, ş — ; tugmasida, ö — , tugmasida, ç — . tugmasida. Character Viewer (Control+Command+Space) da ham toʻrttala harf bor.' },
      { heading: 'Windows', body: 'Turkish Q klaviaturasini qoʻshing (Settings → Time & Language → Language & region → Add a keyboard) va shu tugmalardan foydalaning: ğ — [, ş — ;, ö — , va ç — . tugmasida. Word dasturida 015f yozib Alt+X bossangiz ş, 011f yozib Alt+X bossangiz ğ chiqadi. Raqamli klaviaturada Alt+0246 — ö, Alt+0231 — ç.' },
      { heading: 'iPhone va Android', body: 'Turk (Türkçe) klaviaturasini qoʻshing (iOS: Settings → General → Keyboard → Keyboards; Android: Gboard → Languages). Ş, ç, ö, ğ unda bevosita bor; s, c, o, g tugmalarini bosib turganda ham chiqadi.' },
      { heading: 'Yoki Alfavit yozib bersin', body: 'Odatdagidek yozing va oʻgiring: Mac ilovasi yozayotganingizda kompyuterning istalgan joyida avtomatik oʻgiradi; veb oʻgirgich, Telegram bot va Chrome kengaytmasi joylangan yoki belgilangan matnni oʻgiradi.' },
    ],
    note: 'Rasmiy taklifga koʻra Ö, Ğ, Ş, Ç harflari oʻzbek tilida ishlatilmaydigan tinish belgisi tugmalariga joylashtiriladi. Klaviaturalar va operatsion tizimlar buni joriy qilgunga qadar amaliy yechim — Turkish Q joylashuvi: unda toʻrttala harf allaqachon bor.',
    examples: EXAMPLES,
  },
  ru: {
    title: 'Как набирать буквы Ş, Ç, Ö, Ğ',
    intro: 'Способы набрать четыре новые узбекские буквы на Mac, Windows, iPhone и Android — или пусть Alfavit сделает это за вас.',
    letters: LETTERS,
    steps: [
      { heading: 'Скопируйте буквы с этой страницы', body: 'Нажмите на букву выше — она скопируется; вставьте её там, где пишете. Удобно для имени, заголовка или поля формы.' },
      { heading: 'Mac', body: 'В раскладке U.S. Option+U, затем O даёт ö, Option+C — ç. Для ş и ğ добавьте источник ввода Turkish Q (System Settings → Keyboard → Input Sources): ğ на клавише [, ş на ;, ö на , и ç на клавише «.». В Character Viewer (Control+Command+Space) тоже есть все четыре.' },
      { heading: 'Windows', body: 'Добавьте клавиатуру Turkish Q (Settings → Time & Language → Language & region → Add a keyboard) и используйте те же клавиши: ğ на [, ş на ;, ö на , и ç на клавише «.». В Word наберите 015f и нажмите Alt+X для ş, 011f и Alt+X для ğ. На цифровой клавиатуре Alt+0246 даёт ö, Alt+0231 — ç.' },
      { heading: 'iPhone и Android', body: 'Добавьте турецкую клавиатуру (iOS: Settings → General → Keyboard → Keyboards; Android: Gboard → Languages). Ş, ç, ö и ğ есть на ней напрямую, а долгое нажатие на s, c, o и g тоже показывает их.' },
      { heading: 'Или пусть их наберёт Alfavit', body: 'Пишите как раньше и конвертируйте: приложение для Mac преобразует текст по мере ввода в любой программе; веб-конвертер, Telegram-бот и расширение Chrome конвертируют вставленный или выделенный текст.' },
    ],
    note: 'Официальное предложение размещает Ö, Ğ, Ş и Ç на клавишах знаков препинания, не используемых в узбекском. Пока клавиатуры и операционные системы его не поддерживают, практичный выбор — раскладка Turkish Q: в ней уже есть все четыре буквы.',
    examples: EXAMPLES,
  },
}
```

- [ ] **Step 5: Page, route, sitemap, strings, links**

Create `apps/web/src/pages/GuideKeyboardPage.tsx`:
```tsx
import { useT } from '../i18n/useT'
import { GuidePage } from '../components/GuidePage'
import { keyboard } from '../content/guides/keyboard'

export function GuideKeyboardPage() {
  const { locale } = useT()
  return <GuidePage guide={keyboard[locale]} pagePath="guide/keyboard" titleKey="meta.guide.keyboard.title" descKey="meta.guide.keyboard.desc" />
}
```
`apps/web/src/router.tsx`: add `import { GuideKeyboardPage } from './pages/GuideKeyboardPage'` and, after the old-latin guide entry in `PAGES`, `{ path: 'guide/keyboard', Component: GuideKeyboardPage },`.

`apps/web/src/seo/config.ts`: after the `guide/old-latin-to-new` row add `{ path: 'guide/keyboard', priority: 0.7, locales: LOCALES },`.

`translations.ts` — append after `'news.senate'` in each locale:

en:
```ts
    'meta.guide.keyboard.title': 'How to type Ş, Ç, Ö, Ğ — Alfavit',
    'meta.guide.keyboard.desc': 'Type the four new Uzbek letters on Mac, Windows, iPhone and Android: copy buttons, keyboard layouts, shortcuts — or let Alfavit convert as you type.',
    'guides.keyboard': 'How to type ş ç ö ğ',
```
uz:
```ts
    'meta.guide.keyboard.title': 'Ş, Ç, Ö, Ğ harflarini qanday yozish — Alfavit',
    'meta.guide.keyboard.desc': 'Yangi toʻrt harfni Mac, Windows, iPhone va Android da yozish: nusxalash tugmalari, klaviatura joylashuvlari, tezkor tugmalar — yoki Alfavit yozayotganingizda oʻgirsin.',
    'guides.keyboard': 'ş ç ö ğ harflarini yozish',
```
ru:
```ts
    'meta.guide.keyboard.title': 'Как набирать Ş, Ç, Ö, Ğ — Alfavit',
    'meta.guide.keyboard.desc': 'Четыре новые узбекские буквы на Mac, Windows, iPhone и Android: кнопки копирования, раскладки, сочетания клавиш — или пусть Alfavit конвертирует по мере ввода.',
    'guides.keyboard': 'Как набирать ş ç ö ğ',
```

`apps/web/src/pages/ReformPage.tsx` — inside the `hasGuides` block add a third link after the old-latin one:
```tsx
              <Link to={lp('/guide/keyboard')} className="font-serif text-2xl text-foreground transition-colors hover:text-muted">
                {t('guides.keyboard')} →
              </Link>
```
`apps/web/src/pages/AlphabetPage.tsx` — inside the note box, after the `alphabet.loanword.note` paragraph:
```tsx
          <p className="mt-3 text-sm">
            <Link to={lp('/guide/keyboard')} className="text-muted underline hover:text-foreground">{t('guides.keyboard')} →</Link>
          </p>
```
`apps/web/public/llms.txt` — under `## Pages`, after the old-Latin guide line add:
```
- [How to type ş ç ö ğ](https://alfavit.uz/guide/keyboard): keyboard layouts and shortcuts for the four new letters on Mac, Windows, iPhone, Android
```

- [ ] **Step 6: Run tests, build, dist tests**

Run: `pnpm --dir apps/web test && pnpm --dir apps/web test:dist`
Expected: PASS — GuideKeyboardPage 3 tests, seo 6 tests, sitemap count 30, guides-build 3 tests.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src apps/web/public/llms.txt
git commit -m "feat(web): keyboard guide for Ş Ç Ö Ğ with copyable letters; route + sitemap"
```

---

### Task 4: Web converter — Share button

**Files:**
- Modify: `apps/web/src/components/Converter.tsx`, `apps/web/src/i18n/translations.ts`
- Test: `apps/web/src/tests/Converter.test.tsx`

**Interfaces:**
- Produces: `telegramShareHref(text: string): string` (named export from `Converter.tsx`); key `converter.share`.

- [ ] **Step 1: Write the failing test** (append to `Converter.test.tsx`)

```tsx
import { telegramShareHref } from '../components/Converter'   // add to the existing import line for Converter

test('Share link appears with output and opens Telegram share with the text', async () => {
  const user = userEvent.setup()
  renderConverter()
  expect(screen.queryByRole('link', { name: /Share|Ulashish|Поделиться/ })).not.toBeInTheDocument()
  await user.type(screen.getByRole('textbox'), 'чой')
  await screen.findByText('çoy')
  const link = screen.getByRole('link', { name: /Share|Ulashish|Поделиться/ })
  expect(link).toHaveAttribute('href', telegramShareHref('çoy'))
  expect(link.getAttribute('href')).toContain('https://t.me/share/url?url=')
  expect(link.getAttribute('href')).toContain(encodeURIComponent('çoy'))
  expect(link).toHaveAttribute('target', '_blank')
})
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --dir apps/web exec vitest run src/tests/Converter.test.tsx`
Expected: FAIL — `telegramShareHref` is not exported.

- [ ] **Step 3: Implement**

Append after `'guides.keyboard'` in each locale:
```ts
    'converter.share': 'Share',        // en
    'converter.share': 'Ulashish',     // uz
    'converter.share': 'Поделиться',   // ru
```

`apps/web/src/components/Converter.tsx` — add above the component:
```tsx
const SHARE_URL = 'https://alfavit.uz/?utm_source=share&utm_medium=telegram&utm_campaign=senate-2026-09'
const SECONDARY_BTN = 'rounded-full border border-black/15 px-5 py-2 text-sm text-foreground transition-colors hover:border-black/40'

/** Telegram's share endpoint: pre-fills a message with the converted text + our link. */
export function telegramShareHref(text: string): string {
  return `https://t.me/share/url?url=${encodeURIComponent(SHARE_URL)}&text=${encodeURIComponent(text)}`
}
```
Inside the component, after `copy`:
```tsx
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'
  const share = async () => {
    try {
      await navigator.share({ text, url: SHARE_URL })
    } catch {
      /* user dismissed the share sheet */
    }
  }
```
Replace the header row of the output column:
```tsx
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm text-muted">{t('converter.outputLabel')}</label>
            <div className="flex items-center gap-2">
              {text && (canShare ? (
                <button type="button" onClick={share} className={SECONDARY_BTN}>{t('converter.share')}</button>
              ) : (
                <a href={telegramShareHref(text)} target="_blank" rel="noopener noreferrer" className={SECONDARY_BTN}>{t('converter.share')}</a>
              ))}
              <button
                onClick={copy}
                className="rounded-full bg-foreground px-5 py-2 text-sm text-background transition-transform hover:scale-[1.03]"
              >
                {copied ? t('converter.copied') : t('converter.copy')}
              </button>
            </div>
          </div>
```

- [ ] **Step 4: Run tests**

Run: `pnpm --dir apps/web test`
Expected: PASS (Converter 3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/Converter.tsx apps/web/src/i18n/translations.ts apps/web/src/tests/Converter.test.tsx
git commit -m "feat(web): share converted text to Telegram (Web Share API when available)"
```

---

### Task 5: Telegram bot — share keyboard, richer copy, config script

**Files:**
- Modify: `apps/bot/src/handlers.ts`, `apps/bot/src/bot.ts`, `apps/bot/src/i18n.ts`, `apps/bot/src/config.ts`, `apps/bot/package.json`
- Create: `apps/bot/src/setup-config.ts`
- Test: `apps/bot/src/tests/handlers.test.ts`

**Interfaces:**
- Produces: `buildReplyKeyboard(converted: string, locale: Locale): InlineKeyboardMarkup`, `INLINE_QUERY_MAX = 256`, `SITE_URL` (handlers.ts); `Strings.share`, `Strings.site` (i18n.ts).

- [ ] **Step 1: Write the failing tests** (append to `apps/bot/src/tests/handlers.test.ts`)

```ts
import { buildReplyKeyboard, INLINE_QUERY_MAX } from '../handlers'   // extend the existing import

test('buildReplyKeyboard offers Share (inline, prefilled) and the site link for short results', () => {
  const kb = buildReplyKeyboard('çoy', 'uz')
  expect(kb.inline_keyboard).toHaveLength(2)
  const share = kb.inline_keyboard[0][0] as { text: string; switch_inline_query_chosen_chat: { query: string; allow_group_chats?: boolean } }
  expect(share.text).toBe('Ulashish')
  expect(share.switch_inline_query_chosen_chat.query).toBe('çoy')
  expect(share.switch_inline_query_chosen_chat.allow_group_chats).toBe(true)
  const site = kb.inline_keyboard[1][0] as { text: string; url: string }
  expect(site.text).toBe('alfavit.uz')
  expect(site.url).toContain('https://alfavit.uz/?utm_source=bot')
})

test('buildReplyKeyboard drops Share above the inline-query limit', () => {
  const kb = buildReplyKeyboard('a'.repeat(INLINE_QUERY_MAX + 1), 'en')
  expect(kb.inline_keyboard).toHaveLength(1)
  expect(kb.inline_keyboard[0][0].text).toBe('alfavit.uz')
})
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --dir apps/bot test`
Expected: FAIL — `buildReplyKeyboard` is not exported.

- [ ] **Step 3: Strings**

`apps/bot/src/i18n.ts` — extend `Strings` with `share: string` and `site: string`, and update the three locales:

```ts
  uz: {
    start: 'Salom! Menga kirill yoki eski lotinda matn yuboring — yangi lotin yozuviga oʻgirib beraman. Istalgan chatda @alfavit_uz_bot deb yozib, ichki rejimda ham foydalaning. Fayllar (.docx, .txt, .srt): alfavit.uz/files · Mac ilovasi: alfavit.uz/apps',
    help: 'Matn yuboring — men uni 2026-yilgi yangi lotin alifbosiga oʻgiraman. Ichki rejim: istalgan chatda "@alfavit_uz_bot matn". Fayllar: alfavit.uz/files · Mac: alfavit.uz/apps',
    inlineTitle: 'Yangi lotin',
    inlineEmptyTitle: 'Oʻgirish uchun matn yozing',
    emptyHint: 'Oʻzbekcha matn yuboring — yangi lotin yozuviga oʻgiraman.',
    share: 'Ulashish',
    site: 'alfavit.uz',
  },
  ru: {
    start: 'Привет! Отправьте мне текст на кириллице или старой латинице — верну в новой латинице. Также работает в любом чате: наберите @alfavit_uz_bot текст. Файлы (.docx, .txt, .srt): alfavit.uz/files · Приложение для Mac: alfavit.uz/apps',
    help: 'Отправьте текст — я конвертирую его в новую латиницу 2026 года. Инлайн-режим: в любом чате «@alfavit_uz_bot текст». Файлы: alfavit.uz/files · Mac: alfavit.uz/apps',
    inlineTitle: 'Новая латиница',
    inlineEmptyTitle: 'Введите текст для конвертации',
    emptyHint: 'Отправьте узбекский текст — верну его в новой латинице.',
    share: 'Поделиться',
    site: 'alfavit.uz',
  },
  en: {
    start: 'Hi! Send me Uzbek text in Cyrillic or old Latin and I will convert it to the new Latin script. It also works inline — type @alfavit_uz_bot text in any chat. Files (.docx, .txt, .srt): alfavit.uz/files · Mac app: alfavit.uz/apps',
    help: 'Send text and I convert it to the reformed 2026 Latin script. Inline: type "@alfavit_uz_bot text" in any chat. Files: alfavit.uz/files · Mac: alfavit.uz/apps',
    inlineTitle: 'New Latin',
    inlineEmptyTitle: 'Type text to convert',
    emptyHint: 'Send Uzbek text and I will convert it to the new Latin script.',
    share: 'Share',
    site: 'alfavit.uz',
  },
```
(`handlers.test.ts` asserts the en `emptyHint` verbatim — unchanged above.)

- [ ] **Step 4: Keyboard helper and wiring**

`apps/bot/src/handlers.ts` — add:
```ts
import type { InlineQueryResult, InlineKeyboardMarkup } from 'grammy/types'   // extend the existing type import

/** Telegram caps inline queries at 256 characters; longer results get only the site button. */
export const INLINE_QUERY_MAX = 256
export const SITE_URL = 'https://alfavit.uz/?utm_source=bot&utm_medium=button&utm_campaign=senate-2026-09'

export function buildReplyKeyboard(converted: string, locale: Locale): InlineKeyboardMarkup {
  const rows: InlineKeyboardMarkup['inline_keyboard'] = []
  if (converted.length <= INLINE_QUERY_MAX) {
    rows.push([
      {
        text: strings[locale].share,
        switch_inline_query_chosen_chat: {
          query: converted,
          allow_user_chats: true,
          allow_bot_chats: false,
          allow_group_chats: true,
          allow_channel_chats: true,
        },
      },
    ])
  }
  rows.push([{ text: strings[locale].site, url: SITE_URL }])
  return { inline_keyboard: rows }
}
```
`apps/bot/src/bot.ts` — import `buildReplyKeyboard` and replace the text handler:
```ts
  bot.on('message:text', (ctx) => {
    const text = ctx.message.text
    if (text.startsWith('/')) return // ignore other commands
    const locale = pickLocale(ctx.from?.language_code)
    const converted = handleMessage(text, locale)
    // No keyboard on the empty-input hint: there is nothing to share.
    const reply_markup = text.trim() ? buildReplyKeyboard(converted, locale) : undefined
    return ctx.reply(converted, { reply_markup })
  })
```
`apps/bot/src/config.ts` — update `META[*].description` (≤ 512 chars):
```ts
  uz: description: 'Kirill yoki eski lotindagi oʻzbek matnini 2026-yilgi yangi lotin alifbosiga oʻgiraman. Menga matn yuboring yoki istalgan chatda ichki (inline) rejimda foydalaning. Fayllar, Chrome kengaytmasi va Mac ilovasi: alfavit.uz',
  ru: description: 'Конвертирую узбекский текст с кириллицы или старой латиницы в новую латиницу 2026 года. Отправьте мне текст или используйте инлайн-режим в любом чате. Файлы, расширение Chrome и приложение для Mac: alfavit.uz',
  en: description: 'I convert Uzbek text from Cyrillic or old Latin into the reformed 2026 Latin script. Send me text, or use inline mode in any chat. Files, Chrome extension and Mac app: alfavit.uz',
```
Create `apps/bot/src/setup-config.ts`:
```ts
import { Bot } from 'grammy'
import { applyBotConfig } from './config'

// Pushes the command menu + profile descriptions only — the webhook is untouched.
//   BOT_TOKEN=… pnpm --dir apps/bot setup:config
const token = process.env.BOT_TOKEN
if (!token) {
  console.error('BOT_TOKEN is not set.')
  process.exit(1)
}
const bot = new Bot(token)
await applyBotConfig(bot)
console.log('Command menu and descriptions configured.')
```
`apps/bot/package.json` scripts: add `"setup:config": "tsx src/setup-config.ts"`.

- [ ] **Step 5: Run tests and type-check**

Run: `pnpm --dir apps/bot test && pnpm --dir apps/bot build`
Expected: PASS (handlers 10 tests incl. 2 new; i18n key-parity test passes because all three locales gained `share` and `site`); `tsc` clean.

- [ ] **Step 6: Commit**

```bash
git add apps/bot/src apps/bot/package.json
git commit -m "feat(bot): share + site buttons on replies, richer start/help, setup:config script"
```

---

### Task 6: Chrome extension — listing fix, 0.1.1 zip, store-URL switch on the Apps page

**Files:**
- Modify: `apps/extension/manifest.json`, `docs/chrome-web-store/LISTING.md`, `apps/web/src/components/Channels.tsx`
- Create: `docs/chrome-web-store/alfavit-extension-v0.1.1.zip`; Delete: `docs/chrome-web-store/alfavit-extension-v0.1.0.zip`
- Test: `apps/web/src/tests/Channels.test.tsx`

**Interfaces:**
- Produces: `EXTENSION_STORE_URL: string | null` (exported const, `null` until approval) and `Channels({ extensionStoreUrl? })` prop defaulting to it.

- [ ] **Step 1: Write the failing test** (append to `Channels.test.tsx`)

```tsx
test('extension card goes live when a store URL is provided', () => {
  const url = 'https://chromewebstore.google.com/detail/alfavit/abcdefghijklmnop'
  renderWithLocale(<Channels extensionStoreUrl={url} />, '/en')
  const openHrefs = screen.getAllByRole('link', { name: 'Open' }).map((a) => a.getAttribute('href'))
  expect(openHrefs).toContain(url)
  expect(screen.getAllByText('Coming soon')).toHaveLength(3)
})
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --dir apps/web exec vitest run src/tests/Channels.test.tsx`
Expected: FAIL — TypeScript/props: `extensionStoreUrl` is not a known prop; the `Open` list lacks the URL.

- [ ] **Step 3: Implement the switch**

In `apps/web/src/components/Channels.tsx`:
- Add above `GROUPS`:
```ts
/** Chrome Web Store listing URL. Stays null until Google approves the extension;
 * paste the store URL here to flip the card from "Coming soon" to a live "Open" link. */
export const EXTENSION_STORE_URL: string | null = null
```
- Turn `GROUPS` into a function `buildGroups(extensionStoreUrl: string | null): Group[]` with the same content, except the extension item:
```ts
      {
        nameKey: 'channels.extension.name',
        Icon: PuzzleIcon,
        live: extensionStoreUrl !== null,
        href: extensionStoreUrl ?? undefined,
      },
```
- Change the component signature to `export function Channels({ extensionStoreUrl = EXTENSION_STORE_URL }: { extensionStoreUrl?: string | null } = {})` and use `const groups = buildGroups(extensionStoreUrl)` wherever `GROUPS` was read.

- [ ] **Step 4: Extension metadata and listing**

`apps/extension/manifest.json`: set `"version": "0.1.1"` and add `"homepage_url": "https://alfavit.uz/apps",` after `"version"`.

Check the popup for stale wording: `grep -rn "ts →\|ts→" apps/extension/public apps/extension/src` — if any hit, delete that clause.

`docs/chrome-web-store/LISTING.md`:
- Line 3: `alfavit-extension-v0.1.0.zip` → `alfavit-extension-v0.1.1.zip`.
- Description first line: `sh → ş, ch → ç, gʻ → ğ, oʻ → ö, and loanword ts → c` → `sh → ş, ch → ç, gʻ → ğ, oʻ → ö`. Add as the last description paragraph: `Uzbekistan's Senate approved the 28-letter alphabet on 10 September 2026 — Alfavit converts your text to it today.`
- Privacy policy URL block → `https://alfavit.uz/privacy`; delete the blockquote about `PRIVACY.md` (the page is live).
- Add after the privacy URL: `**Website**` → `https://alfavit.uz`.
- Assets table: zip name → `alfavit-extension-v0.1.1.zip`.
- Checklist: replace the "Publish the privacy page…" item with `- [x] Privacy page live at https://alfavit.uz/privacy`; upload item → v0.1.1; last item → `On approval: paste the Web Store URL into EXTENSION_STORE_URL in apps/web/src/components/Channels.tsx`.

Build the zip (manifest must be at the zip root):
```bash
pnpm --dir apps/extension build
rm -f docs/chrome-web-store/alfavit-extension-v0.1.0.zip
(cd apps/extension/dist && zip -r ../../../docs/chrome-web-store/alfavit-extension-v0.1.1.zip .)
unzip -l docs/chrome-web-store/alfavit-extension-v0.1.1.zip | grep -E "manifest.json|background.js|popup.html"
```

- [ ] **Step 5: Run tests**

Run: `pnpm --dir apps/web test && pnpm --dir apps/extension test`
Expected: PASS (Channels 2 tests; extension suite green).

- [ ] **Step 6: Commit**

```bash
git add apps/extension/manifest.json apps/web/src/components/Channels.tsx apps/web/src/tests/Channels.test.tsx docs/chrome-web-store
git commit -m "chore(extension): 0.1.1 listing fixes (privacy URL, homepage), store-URL switch on Apps page"
```

---

### Task 7: Open-source readiness — license, package metadata, READMEs

**Files:**
- Create: `LICENSE`, `CONTRIBUTING.md`, `packages/engine/README.md`, `packages/sdk/README.md`
- Modify: `README.md`, `packages/engine/package.json`, `packages/engine/src/index.ts`, `packages/sdk/package.json`

- [ ] **Step 1: Check for a version assertion**

Run: `grep -rn "version" packages/engine/src/tests packages/sdk/src/tests | head`
If a test asserts `version === '0.0.1'`, update it to `'0.1.0'` in the same commit.

- [ ] **Step 2: License and metadata**

Create `LICENSE` with the MIT text, first lines:
```
MIT License

Copyright (c) 2026 Abdumajid Rashidov
```
(then the standard MIT permission/warranty paragraphs verbatim).

`packages/engine/package.json` — set `"version": "0.1.0"` and add:
```json
  "description": "Dependency-free transliteration engine for the 2026 Uzbek Latin alphabet: Cyrillic and 1995 Latin → new Latin (ş ç ö ğ), with ambiguity flags.",
  "license": "MIT",
  "repository": { "type": "git", "url": "https://github.com/AbdumajidRashidov/alfavit.git", "directory": "packages/engine" },
  "homepage": "https://alfavit.uz/developers",
  "keywords": ["uzbek", "transliteration", "cyrillic", "latin", "alphabet", "2026", "o'zbek", "alifbo"],
  "publishConfig": { "access": "public" },
  "sideEffects": false,
```
`packages/sdk/package.json` — same fields with `"directory": "packages/sdk"` and description `"Zero-dependency client for the Alfavit transliteration API (api.alfavit.uz)."`.

`packages/engine/src/index.ts`: `export const version = '0.1.0'`.

- [ ] **Step 3: Package READMEs**

`packages/engine/README.md`:
````markdown
# @alfavit/engine

Pure, dependency-free TypeScript engine that converts Uzbek text from **Cyrillic** or the **1995 Latin** alphabet into the **2026 Latin alphabet** (sh→ş, ch→ç, gʻ→ğ, oʻ→ö). Powers [alfavit.uz](https://alfavit.uz), the Telegram bot, the Chrome extension, the macOS app and the public API.

```bash
npm i @alfavit/engine
```

```ts
import { transliterate, detectScript } from '@alfavit/engine'

const r = transliterate('Ўзбекистон шаҳри')
r.text            // 'Özbekiston şahri'
r.flags           // [{ start: 3, end: 4, chosen: 'e', alternatives: ['ye'], reason: 'cyrillic-e-position' }]
detectScript("o'zbek")  // 'old-latin'
```

## API

- `transliterate(text, options?) → { text, segments, flags }`
  - `options.source`: `'auto' | 'cyrillic' | 'old-latin'` (default `'auto'`, detected per run of text)
  - `options.onAmbiguity`: `'first' | 'flag'`
  - `segments`: `{ source, output, script, start, end }[]` — mixed-script input is handled per segment; `foreign` runs pass through unchanged
  - `flags`: `{ start, end, chosen, alternatives, reason }[]` — positions where more than one spelling is possible; reasons include `cyrillic-e-position` (е → e/ye) and `cyrillic-ts` (ц → s, alternative c)
- `detectScript(text) → 'cyrillic' | 'old-latin' | 'foreign'`
- `version`

## Design notes

Old-Latin input is normalized first (all apostrophe variants for oʻ/gʻ are recognized). Conversion is deterministic and offline; no network, no locale data. Tests: `pnpm test`.

## License

MIT © Abdumajid Rashidov
````

`packages/sdk/README.md`:
````markdown
# @alfavit/sdk

Zero-dependency client for the free Alfavit transliteration API — Uzbek Cyrillic / old Latin → the 2026 Latin alphabet. No API key. Limits: 60 requests per minute per IP, 100,000 characters per request.

```bash
npm i @alfavit/sdk
```

```ts
import { createClient } from '@alfavit/sdk'

const alfavit = createClient({ baseUrl: 'https://api.alfavit.uz' })
const { text, detectedScript, flags } = await alfavit.transliterate('салом дунё')
// text === 'salom dunyo', detectedScript === 'cyrillic'
```

Pass your own `fetch` (Node < 18, tests) via `createClient({ baseUrl, fetch })`. Prefer running offline? Use [`@alfavit/engine`](https://www.npmjs.com/package/@alfavit/engine) directly.

## License

MIT © Abdumajid Rashidov
````

- [ ] **Step 4: Root README and CONTRIBUTING**

Replace `README.md` with:
````markdown
# Alfavit

[![CI](https://github.com/AbdumajidRashidov/alfavit/actions/workflows/ci.yml/badge.svg)](https://github.com/AbdumajidRashidov/alfavit/actions/workflows/ci.yml)
[![npm @alfavit/engine](https://img.shields.io/npm/v/@alfavit/engine)](https://www.npmjs.com/package/@alfavit/engine)
[![License: MIT](https://img.shields.io/badge/license-MIT-black)](LICENSE)

Convert Uzbek text from **Cyrillic** or the **1995 Latin** alphabet into the **2026 Latin alphabet** (`sh→ş`, `ch→ç`, `gʻ→ğ`, `oʻ→ö`). Free, on-device, open source.

**Use it:** [alfavit.uz](https://alfavit.uz) · Telegram [@alfavit_uz_bot](https://t.me/alfavit_uz_bot) (works inline in any chat) · [Files](https://alfavit.uz/files) (.docx .txt .srt) · [macOS app](https://alfavit.uz/apps) (converts as you type) · [API & SDK](https://alfavit.uz/developers)

The reform: the Legislative Chamber adopted the law on 7 July 2026, the Senate approved it on 10 September 2026; 28 letters + 1 apostrophe sign. Details: [alfavit.uz/reform](https://alfavit.uz/reform).

## Packages

| Path | Package | What |
|------|---------|------|
| `packages/engine` | [`@alfavit/engine`](packages/engine) | Pure, dependency-free TS transliteration engine with ambiguity flags |
| `packages/sdk` | [`@alfavit/sdk`](packages/sdk) | Zero-dependency client for the public API |
| `apps/web` | `@alfavit/web` | Static Vite + React site (vite-react-ssg): converter, files, guides, uz/ru/en |
| `apps/bot` | `@alfavit/bot` | grammY Telegram bot: DM + inline (Cloudflare Workers webhook) |
| `apps/api` | `@alfavit/api` | Hono on Cloudflare Workers: `POST /v1/transliterate`, rate-limited, no key |
| `apps/extension` | `@alfavit/extension` | Chrome/Edge MV3 extension: popup + right-click convert |
| `apps/desktop` | `@alfavit/desktop` | Tauri macOS menu-bar app with live transform |

## Develop

```bash
pnpm install
pnpm turbo run test        # all packages
pnpm turbo run build

pnpm --dir apps/web dev    # http://localhost:5173
pnpm --dir apps/bot start  # needs BOT_TOKEN (see apps/bot/.env.example if present)
```

## Deploy

See [docs/deployment.md](docs/deployment.md) — web → Cloudflare Pages, bot and API → Cloudflare Workers, desktop → GitHub Releases (`desktop-v*` tags).

Design specs and implementation plans live under [docs/specs](docs/specs) and [docs/plans](docs/plans); launch material under [docs/marketing](docs/marketing).

## Contributing

Issues and PRs welcome — see [CONTRIBUTING.md](CONTRIBUTING.md). Transliteration rules live in `packages/engine/src/mappings`; every rule change needs a test.

## License

[MIT](LICENSE) © 2026 Abdumajid Rashidov
````

Create `CONTRIBUTING.md`:
```markdown
# Contributing

- Node 20, pnpm 9. `pnpm install`, then `pnpm turbo run test`.
- Engine rules live in `packages/engine/src/mappings`. Add a failing test in `packages/engine/src/tests` before changing a rule; cite the orthography source in the PR.
- UI strings: add every key to all three locales in `apps/web/src/i18n/translations.ts`. Uzbek uses ʻ (U+02BB) in oʻ/gʻ and ʼ (U+02BC) as tutuq belgisi.
- Commits: Conventional Commits (`feat(web): …`, `fix(engine): …`).
- Bugs in conversion: open an issue with the input text, expected output, and a source for the rule.
```

- [ ] **Step 5: Verify publishability**

Run:
```bash
pnpm turbo run build --filter=@alfavit/engine --filter=@alfavit/sdk
pnpm --filter @alfavit/engine publish --dry-run --no-git-checks
pnpm --filter @alfavit/sdk publish --dry-run --no-git-checks
pnpm turbo run test
```
Expected: dry-runs list `dist/*`, `README.md`, `package.json` (no `src/`), and all tests pass.

- [ ] **Step 6: Commit**

```bash
git add LICENSE CONTRIBUTING.md README.md packages/engine packages/sdk
git commit -m "chore: open-source readiness — MIT license, package metadata + READMEs, root README"
```

---

### Task 8: Marketing kit — index, metrics, demo shot list

**Files:**
- Create: `docs/marketing/README.md`, `docs/marketing/metrics.md`, `docs/marketing/demo-shotlist.md`

Write copy from the **Fact base** above. English for the kit's structure; Uzbek/Russian only where a post will be published in that language.

- [ ] **Step 1: `docs/marketing/README.md`**

Sections, in order: (1) *What this kit is* — two sentences, the two waves, link to the spec. (2) *Ground rules* — the four official changes + ng removal; never claim ts→c; disclose you built it; one post per venue; answer every reply within a day; owner verifies Uzbek before posting. (3) *UTM scheme* — the table from Global Constraints with one full example URL per channel (gazeta, spot, kun, daryo, telegram, reddit, linkedin, x, hn, habr, npm). (4) *Files in this folder* — one line per file. (5) *Owner checklist for launch day* — the six items from the spec's owner checklist plus "run `setup:config` for the bot", "paste the store URL into `EXTENSION_STORE_URL` on approval", "verify Cloudflare Web Analytics is enabled".

- [ ] **Step 2: `docs/marketing/metrics.md`**

A KPI table with columns *Metric · Where to read it · 30-day target · Notes*: site visitors/day (Cloudflare Web Analytics → step change vs. baseline, note the pre-launch daily number on launch day), top referrers and UTM paths (same dashboard), bot request volume (Cloudflare Workers → alfavit-bot → Requests; target trend up; 2,000 users started is the proxy, counted by hand from `/start` volume if needed), API requests (Workers → alfavit-api), extension installs (Chrome Web Store dashboard → 300 within 30 days of approval), GitHub stars (50), npm weekly downloads (`https://www.npmjs.com/package/@alfavit/engine`), press mentions (≥ 3, logged in `press-outreach.md`). Then a *Weekly 30-minute review* template: date, numbers, what moved, one thing to try next week. Mac downloads: "not counted this cycle".

- [ ] **Step 3: `docs/marketing/demo-shotlist.md`**

Three 5-second clips, 1280×800, cursor visible, uz UI: (1) web — paste `Ўзбекистон Республикаси Президентининг қарори` into the converter, result appears; hover Copy; (2) Telegram — in any chat type `@alfavit_uz_bot Тошкент шаҳар ҳокимлиги`, pick the result, message sends with "via @alfavit_uz_bot"; (3) Mac — with live transform on, type `O'zbekiston sharqida choy` in Notes and watch it become `Özbekiston şarqida çoy`. Export: macOS Screenshot app (⇧⌘5) → trim in QuickTime → GIF with Gifski (free) at 15 fps, ≤ 8 MB; also keep the .mp4 for press. Save to `docs/marketing/assets/` (create the folder; do not commit files over 8 MB — link a Cloudflare Pages or Telegram-hosted copy instead).

- [ ] **Step 4: Commit**

```bash
git add docs/marketing/README.md docs/marketing/metrics.md docs/marketing/demo-shotlist.md
git commit -m "docs(marketing): kit index, metrics sheet, demo shot list"
```

---

### Task 9: Press kit and outreach

**Files:**
- Create: `docs/marketing/press-kit.md`, `docs/marketing/press-outreach.md`

- [ ] **Step 1: `docs/marketing/press-kit.md`**

Sections: (1) *One paragraph* (uz, ru, en) — what Alfavit is, who built it (Abdumajid Rashidov, Tashkent), free and on-device, all channels. (2) *Fact sheet* — bullet list: launch date of the site (July 2026), channels with URLs, formats (.docx .txt .srt), API limits, engine open source (MIT, GitHub, npm), what the engine does that others don't (2026 letters, e/ye rule, ambiguity flags), privacy (no upload). (3) *The reform in five lines* — the verified facts (dates, 28 letters, ng, transition, textbooks 2027/28 → 2031). (4) *Letter table* — Sh→Ş, Ch→Ç, Oʻ→Ö, Gʻ→Ğ with one example word each (shahar→şahar, choy→çoy, oʻzbek→özbek, gʻalaba→ğalaba). (5) *Quote bank* — six quotable lines from the founder, uz/ru/en, covering: why the old letters broke software and search; "the alphabet changed on paper today, on your keyboard it changes with one paste"; on the six-keystroke ö; on open-sourcing the engine so newsrooms and ministries can audit and reuse it; on the goal (make the transition boring); on privacy. (6) *Assets* — paths to logo, OG image, screenshots, demo GIF/MP4 (from Task 8), with sizes. (7) *Contact* — owner's name, email placeholder to be filled by the owner (`<your email>`), Telegram handle placeholder — these two are the only fields the owner fills in.

- [ ] **Step 2: `docs/marketing/press-outreach.md`**

Sections: (1) *Targets* table: Outlet · Language · Their 10 Sep article (URL from the fact base) · Contact (verified or "verify in footer") · Angle · Status · Date sent · Reply. Rows: Gazeta.uz (uz+ru; uzb-alphabet, keyboard-uzb, oav-alifbo; `info@gazeta.uz`), Spot.uz (uz+ru; alphabet, uzbek-alphabet; `info@spot.uz`), Kun.uz (uz; July law article), Daryo.uz (uz; `daryo.uz/fxq5yS_DR`), Zamin.uz (uz/en; textbooks), UzDaily.uz (en/ru), Podrobno.uz (ru). (2) *Pitch email* in uz, ru and en — subject line options (two each), 120–160 words: open with their own article (name it), one sentence on what Alfavit is, the three proof points (only 2026-alphabet converter, works in Telegram/Chrome/Mac/files/API, open source), the keyboard angle tied to their coverage, an offer of a short comment or demo, the demo GIF link, the press-kit facts. Sign-off with name and phone/Telegram placeholders. Every link carries `utm_source=<outlet>&utm_medium=press&utm_campaign=senate-2026-09`. (3) *Expert-comment offer* — 60 words (uz, ru) offering the builder as a source on the digital side of the reform (Unicode, search, databases, keyboards). (4) *Follow-up* — day 3, 50 words, uz and ru. (5) *Do/Don't* — send before 10:00 Tashkent time, one email per outlet, reply within an hour, never CC outlets together, log everything in the table.

- [ ] **Step 3: Commit**

```bash
git add docs/marketing/press-kit.md docs/marketing/press-outreach.md
git commit -m "docs(marketing): press kit, quote bank, outlet pitches and tracker"
```

---

### Task 10: Launch posts and community seeding

**Files:**
- Create: `docs/marketing/launch-posts.md`, `docs/marketing/community-seeding.md`

- [ ] **Step 1: `docs/marketing/launch-posts.md`**

For each item give the final text, ready to paste, with UTM links:
1. Telegram channel post, **uz** (≤ 900 chars): news line (Senat, 10-sentabr, 28 harf), what changes (four letters), "bugundan yozing" with the site, bot inline tip (`@alfavit_uz_bot matn` in any chat), Mac live transform, files; hashtags `#yangialifbo #alfavit`.
2. Telegram channel post, **ru** (same structure).
3. LinkedIn, **en** (≤ 1,300 chars): builder's-voice story — why the six-keystroke ö matters, what you built in July, what the Senate did today, open-source engine, ask for shares to anyone writing Uzbek.
4. LinkedIn, **ru**.
5. X thread, **en**, 5 tweets: the news; the four letters with examples; "no converter supported this until now"; the channels; open source + link.
6. r/Uzbekistan post, **en**: title + 150-word body; helpful, no hype; ask what breaks on their devices.
7. Article-comment template, **uz** and **ru** (≤ 300 chars): "Yangi alifboga oʻtkazish uchun bepul vosita…" — one link, no hashtags, disclose you built it.
8. Wave-1 site news-strip text (already live) and the OG image path, for reference.

- [ ] **Step 2: `docs/marketing/community-seeding.md`**

Sections: (1) *Venue list* grouped by segment with handle, size if known, how to post (channel admin DM vs. open group), and a *verify handle* flag: IT (IT Masters `t.me/itmastersuz`, IT specialist `t.me/Itspecuz`, Uzbekistan Developers Community, Python Uzbekistan, Xinux), education (teacher and linguist groups — owner to list 5), students (university groups — owner to list 5), diaspora (r/Uzbekistan, Facebook groups), professional (LinkedIn). (2) *Messages* — one per segment, uz (IT, education, students) and en (diaspora), ≤ 500 chars, each ending with one UTM link (`utm_source=telegram&utm_medium=post`). (3) *Etiquette* — read the rules first; ask admins before posting in groups; one post per venue ever; disclose you built it; answer questions for 48 h; never repost the same text twice in one venue; if removed, do not re-add. (4) *Tracker* table: Venue · Date · Message variant · Replies · Notes.

- [ ] **Step 3: Commit**

```bash
git add docs/marketing/launch-posts.md docs/marketing/community-seeding.md
git commit -m "docs(marketing): launch posts per channel and community seeding kit"
```

---

### Task 11: Developer launch, Wave-2 kit, content calendar

**Files:**
- Create: `docs/marketing/developer-launch.md`, `docs/marketing/wave-2-signing-kit.md`, `docs/marketing/content-calendar.md`

- [ ] **Step 1: `docs/marketing/developer-launch.md`**

(1) *Show HN* — title (≤ 80 chars, e.g. `Show HN: Open-source engine for Uzbekistan's new Latin alphabet (ş ç ö ğ)`) and a 200-word text: the reform in two sentences, the interesting problems (position-dependent е, apostrophe variants, mixed-script text, ambiguity flags), what's in the repo, what you'd like feedback on. Link `https://github.com/AbdumajidRashidov/alfavit?utm_source=hn&utm_medium=post&utm_campaign=senate-2026-09` and `https://alfavit.uz/?utm_source=hn…`. Post 14:00–16:00 Tashkent on a weekday. (2) *Habr article outline (ru)* — title, 8 section headings with one-line summaries: the 33-year transition; why oʻ/gʻ broke search and URLs (10+ variants); Unicode of the new letters; the e/ye rule as a state machine; handling mixed scripts; ambiguity flags instead of silent guesses; shipping to five channels from one engine; what's next. (3) *npm announcement* — 3 lines for the npm README badge and a dev.to variant of the Show HN text. (4) *Repo checklist* before flipping public — LICENSE present, README updated, GitHub description `Uzbek Cyrillic / old Latin → 2026 Latin alphabet converter. Web, Telegram, Chrome, macOS, API.`, topics `uzbek, transliteration, alphabet, cloudflare-workers, tauri, react`, publish the draft desktop release.

- [ ] **Step 2: `docs/marketing/wave-2-signing-kit.md`**

(1) *Trigger* — the President signs / the law is published; sources to watch (Gazeta, Kun, Spot Telegram channels; `lex.uz`). (2) *2-hour runbook* — ordered steps with the exact string values to change: `news.senate` in all three locales (en `The President signed the alphabet law. What changes and when →`, uz `Prezident alifbo toʻgʻrisidagi qonunni imzoladi. Nima va qachon oʻzgaradi →`, ru `Президент подписал закон об алфавите. Что и когда меняется →`), `reform.law` (append the signing date — leave `<DATE>` for the owner to fill on the day), `reform.updated`, the timeline rows (replace `Next` with the signing date and the entry-into-force date once published), commit message `feat(web): presidential signature update`, deploy via `main`. (3) *Posts* — uz/ru/en variants of the Telegram, LinkedIn and X posts with `utm_campaign=signing-2026`. (4) *Press follow-up* — 80 words uz/ru: "the law is now signed; here is the tool and the numbers since launch" — include placeholders for users/day and bot users.

- [ ] **Step 3: `docs/marketing/content-calendar.md`**

Table for weeks 2–8: Week · Page path · Target query (uz, plus ru where relevant) · Angle · Promotion post. Rows: W2 `/guide/names-and-documents` "ismni yangi alifboda yozish", "pasportdagi ism"; W3 `/guide/word-documents` "Word hujjatni yangi alifboga oʻtkazish"; W4 `/guide/subtitles` "srt subtitrni oʻgirish"; W5 `/guide/telegram-channels` "Telegram kanal postlarini yangi alifboga oʻtkazish" (inline bot); W6 `/guide/websites` "saytni yangi alifboga oʻtkazish", API/SDK/npm, Unicode; W7 `/guide/teachers` "yangi alifbo darslik oʻqituvchilar uchun", printable chart from `/alphabet`; W8 `/guide/spelling` "yangi alifboda e va ye", tutuq belgisi. Each row names the reused component (`GuidePage` with `steps`, optional `letters`) so a new guide is one content file, one page file, one `PAGE_PATHS` row, one router row, three meta keys.

- [ ] **Step 4: Commit**

```bash
git add docs/marketing/developer-launch.md docs/marketing/wave-2-signing-kit.md docs/marketing/content-calendar.md
git commit -m "docs(marketing): developer launch, wave-2 signing runbook, 8-week content calendar"
```

---

### Task 12: Full verification and hand-off

- [ ] **Step 1: Run everything**

```bash
pnpm turbo run test
pnpm build
pnpm --dir apps/web test:dist
```
Expected: all green. Record the counts in the final report.

- [ ] **Step 2: Browser check (preview)**

Start the web dev server via the preview tool (`pnpm --dir apps/web dev`, port 5173) and verify: `/` shows the news strip above the hero and a Share link appears after typing `чой`; `/reform` shows "Updated 10 September 2026", four rows in the changes table, the ng note, the timeline with six rows, and the keyboard guide link; `/guide/keyboard`, `/ru/guide/keyboard`, `/en/guide/keyboard` render with four letter buttons and copying works; `/alphabet` links to the guide; `/apps` still shows the extension as "Coming soon". Take one screenshot of `/reform` and one of `/guide/keyboard` for the report.

- [ ] **Step 3: Hand-off**

Use `superpowers:finishing-a-development-branch`: present the diff summary, and let the owner choose merge to `main` (CI deploys web, bot and API on push) or a PR. Then the owner works through `docs/marketing/README.md` → *Owner checklist for launch day*.

## Self-Review

- **Spec coverage:** Component 1 → Task 1; 2 → Task 2; 3 → Task 3; 4 → Task 4; 5 → Task 5; 6 → Task 6; 7 → Task 7; 8 (measurement) → UTMs in every marketing task + `metrics.md` (Task 8); marketing assets → Tasks 8–11 (all ten files); owner checklist → `docs/marketing/README.md`; testing section → per-task tests + Task 12; content-accuracy decision → Task 1 (site, FAQ, llms.txt, README) and Task 6 (extension listing). Out-of-scope items are untouched.
- **Placeholder scan:** the only intentional blanks are owner-only fields (`<your email>`, phone/Telegram in the press kit, `<DATE>` on signing day), each named as such.
- **Type consistency:** `TimelineItem`, `GuideLetter`, `Guide.letters?/note?`, `buildReplyKeyboard(converted, locale): InlineKeyboardMarkup`, `INLINE_QUERY_MAX`, `telegramShareHref(text)`, `EXTENSION_STORE_URL`, `Channels({ extensionStoreUrl })` are used with the same names and signatures in their tests and consumers. Translation keys added: `reform.timelineLabel`, `reform.updated`, `reform.ngNote`, `news.senate`, `meta.guide.keyboard.title`, `meta.guide.keyboard.desc`, `guides.keyboard`, `converter.share` — each in all three locales.
