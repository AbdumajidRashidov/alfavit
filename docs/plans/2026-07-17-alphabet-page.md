# Alphabet Reference Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an `/alphabet` reference page to alfavit.uz showing the reformed 2026 Uzbek Latin alphabet (28 letters + tutuq belgisi) with each letter's old-Latin (1995) form, Cyrillic equivalent, pronunciation, and an example.

**Architecture:** A language-independent, engine-grounded letter dataset (`content/alphabet.ts`) drives an `AlphabetPage` (responsive table/cards). A vitest consistency test locks the letter→Cyrillic pairs to `@alfavit/engine`'s `CYRILLIC_MAP` so the chart can't drift from the converter. Page copy (intro, labels, per-letter sound hints) is i18n uz/ru/en, native-speaker verified before merge.

**Tech Stack:** React + Vite + Tailwind + react-router + vite-react-ssg; Vitest; `@alfavit/engine`.

## Global Constraints

- Extends `apps/web`. New route `/alphabet`; do not modify the engine.
- **Letter / old-Latin / Cyrillic data is engine-grounded** (matches `@alfavit/engine`'s `CYRILLIC_MAP`) — enforced by a consistency test.
- **Letter order (user-confirmed):** `A B D E F G H I J K L M N O P Q R S T U V X Y Z Ö Ğ Ş Ç` (24 base + ö ğ ş ç = 28). Tutuq belgisi `ʼ` (U+02BC) shown separately; `ts→c` shown as a loanword note.
- **Uzbek copy uses current official Latin** (turned-comma `oʻ`/`gʻ`), matching the site.
- **uz/ru/en sound + example + intro copy require native-speaker (user) verification before merge** — the drafts here are starting points.
- No emojis anywhere. Commits authored `git -c user.name="Alfavit" -c user.email="abdumajid.r@iman.uz" commit -m "…"` ending with the trailer `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

## File Structure

```
apps/web/
  src/content/alphabet.ts               # Create: LETTERS[] + SOUNDS (data)
  src/content/alphabet.test.ts          # Create: consistency test vs engine
  src/pages/AlphabetPage.tsx            # Create: the page
  src/tests/AlphabetPage.test.tsx       # Create: render test
  src/i18n/translations.ts              # Modify: page-level keys (en/uz/ru)
  src/router.tsx                        # Modify: register /alphabet
  src/seo/config.ts                     # Modify: add 'alphabet' to PAGE_PATHS
  src/components/Nav.tsx                # Modify: add Alphabet link
  src/components/Footer.tsx             # Modify: add Alphabet link
  src/tests/sitemap-build.test.ts       # Modify: 24 -> 27 locale URLs
```

---

### Task 1: Alphabet dataset + engine-consistency test

**Files:**
- Create: `apps/web/src/content/alphabet.ts`
- Create: `apps/web/src/content/alphabet.test.ts`

**Interfaces:**
- Consumes: `transliterate` from `@alfavit/engine` (test only — the public API; `CYRILLIC_MAP` is internal and not exported); `Locale` from `../seo/config`.
- Produces:
  - `export interface AlphabetLetter { id: string; latin: string; old: string; cyrillic: string; example: string; exampleOld?: string; changed?: boolean }`
  - `export const LETTERS: AlphabetLetter[]` (28, in order).
  - `export const SOUNDS: Record<Locale, Record<string, string>>` (per-letter pronunciation hint, keyed by `id`).
  Task 2 renders these.

- [ ] **Step 1: Write the failing consistency test `apps/web/src/content/alphabet.test.ts`**

```ts
import { expect, test } from 'vitest'
import { transliterate } from '@alfavit/engine'
import { LETTERS, SOUNDS } from './alphabet'

test('there are 28 letters in the confirmed order', () => {
  expect(LETTERS).toHaveLength(28)
  expect(LETTERS.map((l) => l.id).join('')).toBe('ABDEFGHIJKLMNOPQRSTUVXYZÖĞŞÇ')
})

test('each letter’s Cyrillic transliterates to its Latin via the engine (no drift)', () => {
  for (const L of LETTERS) {
    const cyrLower = L.cyrillic.split(' ')[1] // 'ў' from 'Ў ў'
    const latLower = L.latin.split(' ')[1] // 'ö' from 'Ö ö'
    expect(transliterate(cyrLower).text, `${L.id}: Cyrillic ${cyrLower}`).toBe(latLower)
  }
})

test('the four changed letters are marked and carry an old form', () => {
  const changed = LETTERS.filter((l) => l.changed).map((l) => l.id)
  expect(changed).toEqual(['Ö', 'Ğ', 'Ş', 'Ç'])
  for (const L of LETTERS.filter((l) => l.changed)) {
    expect(L.exampleOld, `${L.id} exampleOld`).toBeTruthy()
    expect(L.old).not.toBe(L.latin)
  }
})

test('every letter has a sound hint in all three locales', () => {
  for (const loc of ['en', 'uz', 'ru'] as const) {
    for (const L of LETTERS) expect(SOUNDS[loc][L.id], `${loc}/${L.id}`).toBeTruthy()
  }
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --dir apps/web test alphabet`
Expected: FAIL — cannot resolve `./alphabet`.

- [ ] **Step 3: Create `apps/web/src/content/alphabet.ts`**

```ts
import type { Locale } from '../seo/config'

export interface AlphabetLetter {
  id: string
  latin: string
  old: string
  cyrillic: string
  example: string
  exampleOld?: string
  changed?: boolean
}

// Order confirmed by the user (native speaker). Letter/old/cyrillic values are
// grounded against @alfavit/engine's CYRILLIC_MAP (see alphabet.test.ts).
export const LETTERS: AlphabetLetter[] = [
  { id: 'A', latin: 'A a', old: 'A a', cyrillic: 'А а', example: 'ata' },
  { id: 'B', latin: 'B b', old: 'B b', cyrillic: 'Б б', example: 'bola' },
  { id: 'D', latin: 'D d', old: 'D d', cyrillic: 'Д д', example: 'daraxt' },
  { id: 'E', latin: 'E e', old: 'E e', cyrillic: 'Е е', example: 'ertak' },
  { id: 'F', latin: 'F f', old: 'F f', cyrillic: 'Ф ф', example: 'fikr' },
  { id: 'G', latin: 'G g', old: 'G g', cyrillic: 'Г г', example: 'gul' },
  { id: 'H', latin: 'H h', old: 'H h', cyrillic: 'Ҳ ҳ', example: 'hosil' },
  { id: 'I', latin: 'I i', old: 'I i', cyrillic: 'И и', example: 'ikki' },
  { id: 'J', latin: 'J j', old: 'J j', cyrillic: 'Ж ж', example: 'jahon' },
  { id: 'K', latin: 'K k', old: 'K k', cyrillic: 'К к', example: 'kitob' },
  { id: 'L', latin: 'L l', old: 'L l', cyrillic: 'Л л', example: 'laylak' },
  { id: 'M', latin: 'M m', old: 'M m', cyrillic: 'М м', example: 'maktab' },
  { id: 'N', latin: 'N n', old: 'N n', cyrillic: 'Н н', example: 'non' },
  { id: 'O', latin: 'O o', old: 'O o', cyrillic: 'О о', example: 'olma' },
  { id: 'P', latin: 'P p', old: 'P p', cyrillic: 'П п', example: 'palov' },
  { id: 'Q', latin: 'Q q', old: 'Q q', cyrillic: 'Қ қ', example: 'qalam' },
  { id: 'R', latin: 'R r', old: 'R r', cyrillic: 'Р р', example: 'rang' },
  { id: 'S', latin: 'S s', old: 'S s', cyrillic: 'С с', example: 'salom' },
  { id: 'T', latin: 'T t', old: 'T t', cyrillic: 'Т т', example: 'tuz' },
  { id: 'U', latin: 'U u', old: 'U u', cyrillic: 'У у', example: 'uy' },
  { id: 'V', latin: 'V v', old: 'V v', cyrillic: 'В в', example: 'vaqt' },
  { id: 'X', latin: 'X x', old: 'X x', cyrillic: 'Х х', example: 'xona' },
  { id: 'Y', latin: 'Y y', old: 'Y y', cyrillic: 'Й й', example: 'yil' },
  { id: 'Z', latin: 'Z z', old: 'Z z', cyrillic: 'З з', example: 'zar' },
  { id: 'Ö', latin: 'Ö ö', old: 'Oʻ oʻ', cyrillic: 'Ў ў', example: 'köl', exampleOld: 'koʻl', changed: true },
  { id: 'Ğ', latin: 'Ğ ğ', old: 'Gʻ gʻ', cyrillic: 'Ғ ғ', example: 'ğalaba', exampleOld: 'gʻalaba', changed: true },
  { id: 'Ş', latin: 'Ş ş', old: 'Sh sh', cyrillic: 'Ш ш', example: 'şahar', exampleOld: 'shahar', changed: true },
  { id: 'Ç', latin: 'Ç ç', old: 'Ch ch', cyrillic: 'Ч ч', example: 'çoy', exampleOld: 'choy', changed: true },
]

// Per-letter pronunciation hint, keyed by id. Drafts — user-verified before merge.
export const SOUNDS: Record<Locale, Record<string, string>> = {
  en: {
    A: 'like a in "car"', B: 'like b in "bat"', D: 'like d in "dog"', E: 'like e in "bed"',
    F: 'like f in "fan"', G: 'like g in "go"', H: 'like h in "hat"', I: 'like i in "sit"',
    J: 'like s in "measure"', K: 'like k in "kite"', L: 'like l in "lamp"', M: 'like m in "man"',
    N: 'like n in "net"', O: 'like o in "more"', P: 'like p in "pen"', Q: 'a deep, uvular k',
    R: 'a rolled r', S: 'like s in "sun"', T: 'like t in "top"', U: 'like u in "put"',
    V: 'like v in "van"', X: 'like ch in "Bach" (kh)', Y: 'like y in "yes"', Z: 'like z in "zoo"',
    Ö: 'like ö in Turkish "göl"', Ğ: 'a soft, throaty g (Turkish ğ)', Ş: 'like sh in "ship"', Ç: 'like ch in "chair"',
  },
  uz: {
    A: 'ochiq «a»', B: '«b» tovushi', D: '«d» tovushi', E: 'ochiq «e»',
    F: '«f» tovushi', G: '«g» tovushi', H: 'yumshoq «h»', I: '«i» tovushi',
    J: 'jarangli «j» (ж)', K: '«k» tovushi', L: '«l» tovushi', M: '«m» tovushi',
    N: '«n» tovushi', O: 'lablangan «o»', P: '«p» tovushi', Q: 'chuqur «k» (til orqa)',
    R: 'titroq «r»', S: '«s» tovushi', T: '«t» tovushi', U: '«u» tovushi',
    V: '«v» tovushi', X: 'boʻgʻiz «x»', Y: '«y» tovushi', Z: '«z» tovushi',
    Ö: 'lablangan «oʻ»', Ğ: 'jarangli «gʻ»', Ş: 'jarangsiz «sh»', Ç: '«ch» tovushi',
  },
  ru: {
    A: 'как «а»', B: 'как «б»', D: 'как «д»', E: 'как «э/е»',
    F: 'как «ф»', G: 'как «г»', H: 'мягкое «h»', I: 'как «и»',
    J: 'как «ж»', K: 'как «к»', L: 'как «л»', M: 'как «м»',
    N: 'как «н»', O: 'как «о»', P: 'как «п»', Q: 'глубокое «к»',
    R: 'раскатистое «р»', S: 'как «с»', T: 'как «т»', U: 'как «у»',
    V: 'как «в»', X: 'как «х»', Y: 'как «й»', Z: 'как «з»',
    Ö: 'как турецкое «ö»', Ğ: 'мягкое горловое «г»', Ş: 'как «ш»', Ç: 'как «ч»',
  },
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --dir apps/web test alphabet`
Expected: PASS (4 tests). If the consistency test fails, a Cyrillic/Latin pair in `LETTERS` disagrees with the engine — fix the data, not the test.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/content/alphabet.ts apps/web/src/content/alphabet.test.ts
git -c user.name="Alfavit" -c user.email="abdumajid.r@iman.uz" commit -m "feat(web): alphabet dataset + engine-consistency test

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: AlphabetPage, i18n, route, links, tests

**Files:**
- Create: `apps/web/src/pages/AlphabetPage.tsx`
- Create: `apps/web/src/tests/AlphabetPage.test.tsx`
- Modify: `apps/web/src/i18n/translations.ts`
- Modify: `apps/web/src/router.tsx`
- Modify: `apps/web/src/seo/config.ts`
- Modify: `apps/web/src/components/Nav.tsx`
- Modify: `apps/web/src/components/Footer.tsx`
- Modify: `apps/web/src/tests/sitemap-build.test.ts`

**Interfaces:**
- Consumes: `LETTERS`, `SOUNDS` (Task 1); `Seo`, `articleLd`, `useT`, `useLocalePath`, `SITE_URL`, `localePath`.
- Produces: the `/alphabet` route, live in all three locales.

- [ ] **Step 1: Add page-level i18n keys — edit `apps/web/src/i18n/translations.ts`**

In the `en` block, after the `'footer.telegram': …` line (or any convenient spot in the en map), add:
```ts
    'meta.alphabet.title': 'Uzbek alphabet (2026) — full reformed Latin chart | Alfavit',
    'meta.alphabet.desc': 'The complete reformed 2026 Uzbek Latin alphabet: all 28 letters with their old-Latin (1995) and Cyrillic equivalents, pronunciation, and examples.',
    'nav.alphabet': 'Alphabet',
    'footer.alphabet': 'Alphabet',
    'alphabet.title': 'The Uzbek alphabet',
    'alphabet.intro': 'The reformed 2026 Uzbek Latin alphabet has 28 letters and the tutuq belgisi (ʼ). Each letter is shown with its old-Latin (1995) form, Cyrillic equivalent, sound, and an example.',
    'alphabet.col.new': 'New (2026)',
    'alphabet.col.old': 'Old-Latin (1995)',
    'alphabet.col.cyrillic': 'Cyrillic',
    'alphabet.col.sound': 'Sound',
    'alphabet.col.example': 'Example',
    'alphabet.changedLabel': 'Changed',
    'alphabet.tutuq.label': 'Tutuq belgisi (ʼ)',
    'alphabet.tutuq.note': 'The apostrophe sign — separates vowels and marks a glottal stop. It is not one of the 28 letters.',
    'alphabet.loanword.note': 'In loanwords, ts becomes c (for example, tsement → cement).',
```

In the `uz` block, add (current official Latin; user-verified):
```ts
    'meta.alphabet.title': 'Oʻzbek alifbosi (2026) — toʻliq yangilangan lotin jadvali | Alfavit',
    'meta.alphabet.desc': '2026-yilgi yangilangan oʻzbek lotin alifbosi: barcha 28 harf eski lotin (1995) va kirill muqobillari, talaffuzi hamda misollari bilan.',
    'nav.alphabet': 'Alifbo',
    'footer.alphabet': 'Alifbo',
    'alphabet.title': 'Oʻzbek alifbosi',
    'alphabet.intro': '2026-yilgi yangilangan oʻzbek lotin alifbosida 28 ta harf va tutuq belgisi (ʼ) bor. Har bir harf eski lotin (1995) shakli, kirill muqobili, tovushi va misol bilan berilgan.',
    'alphabet.col.new': 'Yangi (2026)',
    'alphabet.col.old': 'Eski lotin (1995)',
    'alphabet.col.cyrillic': 'Kirill',
    'alphabet.col.sound': 'Tovush',
    'alphabet.col.example': 'Misol',
    'alphabet.changedLabel': 'Oʻzgargan',
    'alphabet.tutuq.label': 'Tutuq belgisi (ʼ)',
    'alphabet.tutuq.note': 'Tutuq belgisi — unlilarni ajratadi va boʻgʻiz toʻxtamini bildiradi. U 28 harf tarkibiga kirmaydi.',
    'alphabet.loanword.note': 'Oʻzlashma soʻzlarda ts harfi c bilan yoziladi (masalan, tsement → cement).',
```

In the `ru` block, add (user-verified):
```ts
    'meta.alphabet.title': 'Узбекский алфавит (2026) — полная реформированная латиница | Alfavit',
    'meta.alphabet.desc': 'Полный реформированный узбекский латинский алфавит 2026 года: все 28 букв со старой латиницей (1995) и кириллическими соответствиями, произношением и примерами.',
    'nav.alphabet': 'Алфавит',
    'footer.alphabet': 'Алфавит',
    'alphabet.title': 'Узбекский алфавит',
    'alphabet.intro': 'В реформированном узбекском латинском алфавите 2026 года 28 букв и тутук белгиси (ʼ). Каждая буква показана со старой латиницей (1995), кириллицей, произношением и примером.',
    'alphabet.col.new': 'Новая (2026)',
    'alphabet.col.old': 'Старая латиница (1995)',
    'alphabet.col.cyrillic': 'Кириллица',
    'alphabet.col.sound': 'Звук',
    'alphabet.col.example': 'Пример',
    'alphabet.changedLabel': 'Изменена',
    'alphabet.tutuq.label': 'Тутук белгиси (ʼ)',
    'alphabet.tutuq.note': 'Знак апострофа — разделяет гласные и обозначает гортанную смычку. Не входит в число 28 букв.',
    'alphabet.loanword.note': 'В заимствованиях ts передаётся как c (например, tsement → cement).',
```

- [ ] **Step 2: Create the page `apps/web/src/pages/AlphabetPage.tsx`**

```tsx
import { Link } from 'react-router-dom'
import { useT } from '../i18n/useT'
import { useLocalePath } from '../i18n/useLocalePath'
import { Seo } from '../components/Seo'
import { SITE_URL, localePath } from '../seo/config'
import { articleLd } from '../seo/jsonld'
import { LETTERS, SOUNDS } from '../content/alphabet'

export function AlphabetPage() {
  const { t, locale } = useT()
  const lp = useLocalePath()
  const url = SITE_URL + localePath(locale, 'alphabet')
  const sounds = SOUNDS[locale]
  const Badge = () => (
    <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-xs font-medium text-foreground">
      {t('alphabet.changedLabel')}
    </span>
  )
  return (
    <>
      <Seo
        titleKey="meta.alphabet.title"
        descKey="meta.alphabet.desc"
        pagePath="alphabet"
        breadcrumb
        jsonLd={[articleLd(t('alphabet.title'), t('alphabet.intro'), url)]}
      />
      <section className="mx-auto max-w-3xl px-6 py-24">
        <h1 className="font-serif text-4xl sm:text-6xl text-foreground">{t('alphabet.title')}</h1>
        <p className="mt-4 text-base text-muted">{t('alphabet.intro')}</p>

        <table className="mt-12 hidden w-full text-left sm:table">
          <thead>
            <tr className="text-sm uppercase tracking-wider text-muted">
              <th className="py-2 font-medium">{t('alphabet.col.new')}</th>
              <th className="py-2 font-medium">{t('alphabet.col.old')}</th>
              <th className="py-2 font-medium">{t('alphabet.col.cyrillic')}</th>
              <th className="py-2 font-medium">{t('alphabet.col.sound')}</th>
              <th className="py-2 font-medium">{t('alphabet.col.example')}</th>
            </tr>
          </thead>
          <tbody>
            {LETTERS.map((L) => (
              <tr key={L.id} className={`border-t border-black/10 ${L.changed ? 'bg-black/[0.03]' : ''}`}>
                <td className="py-3 text-lg font-medium text-foreground">
                  <span className="align-middle">{L.latin}</span>
                  {L.changed && <span className="ml-2 align-middle"><Badge /></span>}
                </td>
                <td className="py-3 text-muted">{L.old}</td>
                <td className="py-3 text-muted">{L.cyrillic}</td>
                <td className="py-3 text-sm text-muted">{sounds[L.id]}</td>
                <td className="py-3 text-foreground">
                  {L.example}
                  {L.exampleOld && <span className="text-muted"> ({L.exampleOld})</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-12 space-y-3 sm:hidden">
          {LETTERS.map((L) => (
            <div key={L.id} className={`rounded-xl border border-black/10 p-4 ${L.changed ? 'bg-black/[0.03]' : ''}`}>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-medium text-foreground">{L.latin}</span>
                {L.changed && <Badge />}
              </div>
              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                <dt className="text-muted">{t('alphabet.col.old')}</dt>
                <dd className="text-foreground">{L.old}</dd>
                <dt className="text-muted">{t('alphabet.col.cyrillic')}</dt>
                <dd className="text-foreground">{L.cyrillic}</dd>
                <dt className="text-muted">{t('alphabet.col.sound')}</dt>
                <dd className="text-foreground">{sounds[L.id]}</dd>
                <dt className="text-muted">{t('alphabet.col.example')}</dt>
                <dd className="text-foreground">
                  {L.example}
                  {L.exampleOld && ` (${L.exampleOld})`}
                </dd>
              </dl>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-black/10 p-5">
          <h2 className="font-medium text-foreground">{t('alphabet.tutuq.label')}</h2>
          <p className="mt-1 text-sm text-muted">{t('alphabet.tutuq.note')}</p>
          <p className="mt-3 text-sm text-muted">{t('alphabet.loanword.note')}</p>
        </div>

        <p className="mt-12 text-sm text-muted">
          <Link to={lp('/reform')} className="underline hover:text-foreground">{t('reform.title')}</Link>
          {' · '}
          <Link to={lp('/')} className="underline hover:text-foreground">{t('nav.convert')}</Link>
        </p>
      </section>
    </>
  )
}
```

- [ ] **Step 3: Register the route — edit `apps/web/src/router.tsx`**

Add the import near the other page imports:
```tsx
import { AlphabetPage } from './pages/AlphabetPage'
```
Add to the `PAGES` array, right after the `reform` entry:
```tsx
  { path: 'alphabet', Component: AlphabetPage },
```

- [ ] **Step 4: Add to sitemap — edit `apps/web/src/seo/config.ts`**

In `PAGE_PATHS`, right after the `reform` entry, add:
```ts
  { path: 'alphabet', priority: 0.6, locales: LOCALES },
```

- [ ] **Step 5: Add nav + footer links**

In `apps/web/src/components/Nav.tsx`, in the nav-links array, after the `{ key: 'nav.reform', to: '/reform' }` entry, add:
```tsx
  { key: 'nav.alphabet', to: '/alphabet' },
```

In `apps/web/src/components/Footer.tsx`, after the reform `<Link>` line, add:
```tsx
          <Link to={lp('/alphabet')} className={cls}>{t('footer.alphabet')}</Link>
```

- [ ] **Step 6: Write the page render test `apps/web/src/tests/AlphabetPage.test.tsx`**

```tsx
import { screen } from '@testing-library/react'
import { expect, test, beforeEach } from 'vitest'
import { renderWithLocale } from './renderApp'
import { AlphabetPage } from '../pages/AlphabetPage'

beforeEach(() => {
  localStorage.clear()
  Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true })
})

test('renders a changed letter with new, old-Latin, and Cyrillic', () => {
  renderWithLocale(<AlphabetPage />, '/en')
  // Rendered in both the desktop table and mobile cards, so use getAllByText.
  expect(screen.getAllByText('Ö ö').length).toBeGreaterThan(0)
  expect(screen.getAllByText('Oʻ oʻ').length).toBeGreaterThan(0)
  expect(screen.getAllByText('Ў ў').length).toBeGreaterThan(0)
})

test('renders an unchanged letter and marks the four changed ones', () => {
  renderWithLocale(<AlphabetPage />, '/en')
  expect(screen.getAllByText('A a').length).toBeGreaterThan(0)
  // 4 changed letters, each shown in the table AND the mobile cards -> >= 4 badges.
  expect(screen.getAllByText('Changed').length).toBeGreaterThanOrEqual(4)
})

test('shows the tutuq belgisi note', () => {
  renderWithLocale(<AlphabetPage />, '/en')
  expect(screen.getByText(/Tutuq belgisi/)).toBeInTheDocument()
})
```

- [ ] **Step 7: Update the sitemap-build test — edit `apps/web/src/tests/sitemap-build.test.ts`**

Change the count from 24 to 27 (adding `/alphabet` in 3 locales) and add an assertion for the new URL:
```ts
test('dist/sitemap.xml has all 27 locale URLs', () => {
  const xml = readFileSync(resolve(__dirname, '../../dist/sitemap.xml'), 'utf-8')
  expect((xml.match(/<loc>/g) ?? []).length).toBe(27)
  expect(xml).toContain('<loc>https://alfavit.uz/ru/files</loc>')
  expect(xml).toContain('<loc>https://alfavit.uz/en/alphabet</loc>')
  expect(xml).toContain('hreflang="x-default"')
})
```

- [ ] **Step 8: Run the fast test suite**

Run: `pnpm --dir apps/web test`
Expected: all green, including `alphabet` and `AlphabetPage` (the `sitemap-build` test is in the build-output suite, excluded from the fast run — see Step 9).

- [ ] **Step 9: Typecheck + build + build-output tests**

Run: `pnpm --dir apps/web exec tsc -b` → Expected: clean.
Run: `pnpm --dir apps/web test:dist` → Expected: green, including the updated `dist/sitemap.xml has all 27 locale URLs` test (this builds the site, so `/alphabet` must be a real route).

- [ ] **Step 10: Verify in the browser preview (assistant)**

Start the web dev server (port 5173) and open `/en/alphabet` and `/alphabet` (uz). Confirm: the 28-letter table on desktop (New/Old-Latin/Cyrillic/Sound/Example columns), the 4 changed letters highlighted with the "Changed" badge, the tutuq belgisi + loanword notes, and the cross-links. Resize to mobile (`resize_window` mobile) → confirm the cards layout. Check `read_console_messages` for errors (expect none). Screenshot desktop + mobile.

- [ ] **Step 11: Commit**

```bash
git add apps/web/src/pages/AlphabetPage.tsx apps/web/src/tests/AlphabetPage.test.tsx apps/web/src/i18n/translations.ts apps/web/src/router.tsx apps/web/src/seo/config.ts apps/web/src/components/Nav.tsx apps/web/src/components/Footer.tsx apps/web/src/tests/sitemap-build.test.ts
git -c user.name="Alfavit" -c user.email="abdumajid.r@iman.uz" commit -m "feat(web): /alphabet reference page

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- Full 28-letter chart, confirmed order, 5 columns → Task 1 data + Task 2 page. ✓
- Engine-grounded letter/old/cyrillic + consistency test → Task 1. ✓
- 4 changed letters highlighted; tutuq belgisi row; ts→c note → Task 2 page + i18n. ✓
- Responsive (table desktop, cards mobile) → Task 2 page. ✓
- Route + sitemap (3 locales) + nav/footer + JSON-LD → Task 2 (router, PAGE_PATHS, Nav, Footer, Seo/articleLd). ✓
- Complements /reform (cross-links) → Task 2 page. ✓
- uz/ru/en content, user-verified → Global Constraints + drafts in Tasks 1–2. ✓
- Consistency test prevents drift; render + sitemap tests → Tasks 1–2. ✓

**Placeholder scan:** No TBD/TODO. All letter data, examples, sound hints, and i18n copy are concrete (uz/ru are real drafts flagged for verification, not placeholders).

**Refinement vs spec (justified):** the spec modeled sound + example together in a localized `letterCopy`. This plan puts **example in the non-localized `LETTERS`** (the Uzbek word is identical across locales — no 3× duplication or triple-verification) and keeps **sound localized in `SOUNDS`**. Same rendered result, less duplicated content.

**Type consistency:** `AlphabetLetter` fields (`id/latin/old/cyrillic/example/exampleOld/changed`) defined in Task 1 and consumed identically in Task 2; `SOUNDS[locale][L.id]` keys match `LETTERS[].id`; new i18n keys used in the page match those added to `translations.ts`; `PAGE_PATHS` `'alphabet'` matches the router path and the `Seo pagePath="alphabet"`; sitemap count 24→27 matches adding one page × 3 locales.
