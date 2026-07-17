# Alphabet Reference Page (`/alphabet`) — Design

**Date:** 2026-07-17
**Status:** Design approved, pending spec review.

## Goal

A complete reference chart of the reformed 2026 Uzbek new-Latin alphabet (28 letters + tutuq belgisi) on alfavit.uz, with each letter's old-Latin (1995) form, Cyrillic equivalent, a pronunciation hint, and an example word. Complements `/reform` (which narrates the *changes*); `/alphabet` is the full lookup table.

## Context

- The web app (`apps/web`) already has `/reform` ([ReformPage.tsx](../../apps/web/src/pages/ReformPage.tsx)) — the reform story: the 4 changed letters, spotlights, FAQ, sources. `/alphabet` must not duplicate it; it is the reference chart, and the two cross-link.
- `@alfavit/engine`'s `CYRILLIC_MAP` ([cyrillic.ts](../../packages/engine/src/mappings/cyrillic.ts)) and `OLD_LATIN_DIGRAPHS` ([old-latin.ts](../../packages/engine/src/mappings/old-latin.ts)) are the tool's source of truth for letter values, grounded against the 2026-07-07 law (see [official-mapping-source.md](../../packages/engine/docs/official-mapping-source.md)). The chart's letter/old-Latin/Cyrillic data derives from these, so it stays byte-consistent with the converter.
- No public source gives a verbatim ordered 28-letter table (Wikipedia documents only the 4 changed letters). The **ordered letter list below was confirmed by the user (native Uzbek speaker)**.
- i18n lives in `apps/web/src/i18n/translations.ts` (`en`/`uz`/`ru`, typed keys). Uzbek UI copy uses current official Latin (turned-comma `oʻ`), matching the site.

## Decisions

- **5 columns** per letter: New (2026) · Old-Latin (1995) · Cyrillic · Sound · Example.
- **Letter order** (user-confirmed): base letters, then the reformed special letters appended — `A B D E F G H I J K L M N O P Q R S T U V X Y Z Ö Ğ Ş Ç` (24 base + ö ğ ş ç = 28). Tutuq belgisi (ʼ) is shown separately, not counted among the 28. `c` is a loanword usage (ts→c), shown as a note, not an ordered letter.
- **Letter/old-Latin/Cyrillic data is engine-grounded** (from `CYRILLIC_MAP` + the 4 reform substitutions). **Sound + Example + intro copy are content**, drafted in uz/ru/en and **verified by the user** before merge (same gate as the reform/FAQ content).
- Responsive: a real `<table>` on desktop; stacked per-letter cards on mobile.

## Confirmed letter data (engine-grounded)

The 28 letters in order, each with its old-Latin (1995) form and Cyrillic equivalent. The four **changed** letters are marked ✷.

| # | New | Old-Latin | Cyrillic | | # | New | Old-Latin | Cyrillic |
|---|-----|-----------|----------|---|---|-----|-----------|----------|
| 1 | A a | A a | А а | | 15 | P p | P p | П п |
| 2 | B b | B b | Б б | | 16 | Q q | Q q | Қ қ |
| 3 | D d | D d | Д д | | 17 | R r | R r | Р р |
| 4 | E e | E e | Е е | | 18 | S s | S s | С с |
| 5 | F f | F f | Ф ф | | 19 | T t | T t | Т т |
| 6 | G g | G g | Г г | | 20 | U u | U u | У у |
| 7 | H h | H h | Ҳ ҳ | | 21 | V v | V v | В в |
| 8 | I i | I i | И и | | 22 | X x | X x | Х х |
| 9 | J j | J j | Ж ж | | 23 | Y y | Y y | Й й |
| 10 | K k | K k | К к | | 24 | Z z | Z z | З з |
| 11 | L l | L l | Л л | | 25 | Ö ö ✷ | Oʻ oʻ | Ў ў |
| 12 | M m | M m | М м | | 26 | Ğ ğ ✷ | Gʻ gʻ | Ғ ғ |
| 13 | N n | N n | Н н | | 27 | Ş ş ✷ | Sh sh | Ш ш |
| 14 | O o | O o | О о | | 28 | Ç ç ✷ | Ch ch | Ч ч |

The page renders these as one ordered list of 28; the two-column layout here is only for the spec's readability.

- **Tutuq belgisi:** `ʼ` (U+02BC, modifier letter apostrophe — the engine's `ъ → ʼ`). Shown as a separate row with a note: separates vowels / marks a glottal stop; not one of the 28 letters.
- **Loanword note:** `ts → c` in loanwords (e.g. *tsement → cement*).
- **Edge cases to flag in verification:** Cyrillic `е` vs `э` both map to Latin `e`; `ц`/`ь` have orthography-rule nuances the engine handles via ambiguity flags. The chart shows the primary Cyrillic per Latin letter; the user confirms these edges.

## Components

### 1. `apps/web/src/content/alphabet.ts` — the data
- `export interface AlphabetLetter { new: string; old: string; cyrillic: string; changed?: boolean }`
- `export const LETTERS: AlphabetLetter[]` — the 28 letters above, in order (language-independent).
- `export const TUTUQ: { sign: string }` and the loanword note are rendered from i18n copy.
- Sound + Example are **localized**, keyed by the new letter: `export const letterCopy: Record<Locale, Record<string, { sound: string; example: string }>>` (drafted in the plan, user-verified). Keyed by the uppercase new letter (e.g. `'Ö'`).

### 2. `apps/web/src/pages/AlphabetPage.tsx` — the page
- `<Seo titleKey="meta.alphabet.title" descKey="meta.alphabet.desc" pagePath="alphabet" breadcrumb jsonLd={[articleLd(...)]} />`
- Intro paragraph (i18n), then the alphabet table (desktop) / cards (mobile) driven by `LETTERS` + `letterCopy[locale]`, changed letters highlighted, then the tutuq belgisi + loanword notes, then cross-links to `/reform` and the converter (`/`).

### 3. i18n — new keys in `en`/`uz`/`ru`
- `meta.alphabet.title`, `meta.alphabet.desc` (SEO).
- `nav.alphabet`, `footer.alphabet` (link labels).
- `alphabet.title`, `alphabet.intro`, column headers (`alphabet.col.new/old/cyrillic/sound/example`), `alphabet.tutuq.label`, `alphabet.tutuq.note`, `alphabet.loanword.note`, `alphabet.changedLabel`.
- Plus the per-letter `sound`/`example` copy in `letterCopy` (content file, not the translations map, to keep the key list manageable).

### 4. Routing + SEO
- Register the `/alphabet` route wherever the existing page routes are declared (same place as ReformPage/AppsPage).
- Add `{ path: 'alphabet', priority: 0.6, locales: LOCALES }` to `PAGE_PATHS` in `apps/web/src/seo/config.ts` → sitemap + hreflang for all three locales.
- Add an `/alphabet` link to the nav and footer.

## Testing

- Unit test (`apps/web/src/tests/`): `AlphabetPage` renders all 28 letters in order, shows the old-Latin + Cyrillic for a changed letter (e.g. `Ö`/`Oʻ`/`Ў`) and an unchanged one (e.g. `A`), renders the tutuq belgisi row, and highlights the 4 changed letters. A build/SSG check that `/alphabet` is in the sitemap (following the existing sitemap-build test pattern).
- Consistency test: assert `content/alphabet.ts`'s letter→Cyrillic pairs for the reformed letters match `@alfavit/engine`'s `CYRILLIC_MAP` (so the chart can't silently drift from the converter).
- Full web suite green; assistant verifies in the browser preview (desktop table + mobile cards, light/dark).

## Out of scope / deferred

- Audio pronunciation, letter-name recitation, or an interactive quiz.
- History of prior alphabets (Cyrillic era, 1993/2021 drafts) — `/reform` covers rationale.
- Changing the engine or the ambiguity handling for `е`/`ц`/`ь`.

## Success criteria

- `/alphabet` (uz root, `/ru`, `/en`) shows the 28-letter reformed alphabet in the confirmed order, each with old-Latin, Cyrillic, a pronunciation hint, and an example; the 4 changed letters are visually marked; tutuq belgisi + ts→c notes present.
- Letter/old-Latin/Cyrillic data matches `@alfavit/engine` (consistency test passes).
- `/alphabet` is in the sitemap for all three locales; nav + footer link to it; JSON-LD present.
- Web suite green; the uz/ru/en sound + example copy is user-verified before merge.
