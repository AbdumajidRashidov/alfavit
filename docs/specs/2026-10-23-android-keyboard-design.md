# Alfavit Klaviatura (Android) — Design

**Date:** 2026-10-23
**Status:** Brainstormed with the owner 23 Oct 2026. Builder-checked, and the
two owner questions it raised are decided. Awaiting owner approval of the whole
document.
**Builds on:** [Keyboards design](2026-10-23-keyboard-layouts-design.md) —
its *Phase 2 — Android keyboard* section and *Decided with the owner* table are
binding here (that file is on the branch of
[PR #1](https://github.com/AbdumajidRashidov/alfavit/pull/1) until it merges) —
plus the [Engine](2026-07-10-alfavit-engine-design.md) and
[Live transform](2026-07-16-desktop-live-transform-design.md) designs.

Calls marked *(my call)* are the assistant's. Most were played back to the
owner during brainstorming without objection, but they remain the assistant's
calls, not the owner's decisions.

## Intent

The converter fixes text after it is written; it teaches nobody. The 23 Oct
Telegram thread asked for a keyboard because "muscle memory stays with the old
alphabet". Most typing in Uzbekistan happens on phones, about 80% of them
Android, and neither competitor (yangicha.uz, yozgich.uz) has a real phone
keyboard. A phone keyboard draws its keys, so it can show people the new
letters every time they type — the surface where the alphabet actually gets
learned.

The keyboard is meant to replace Gboard for everyday use, not to be a
specialist tool people switch into: Uzbek in the new alphabet, Russian and
English, swipe and emoji, with the new letters on real keys and old habits
(`sh`, `ch`, `oʻ`, `gʻ`) fixed automatically.

## What research changed (23 Oct 2026)

The Phase 1 sketch named the engine port as the biggest estimate risk. Research
during brainstorming moved the risk elsewhere.

- **FlorisBoard has no word prediction in any release.** In the latest stable,
  v0.5.2 (28 Nov 2025), `LatinLanguageProvider.suggest()` returns
  `emptyList()` and `spell()` is a stub (verified in the
  [source](https://github.com/florisboard/florisboard/blob/v0.5.2/app/src/main/kotlin/dev/patrickgold/florisboard/ime/nlp/latin/LatinLanguageProvider.kt));
  the README says suggestions "are not included in the current releases".
  Autocorrect is a placeholder toggle.
- **Glide typing works in v0.5.2 but only knows English.** It draws words from
  one bundled list, `assets/ime/dict/data.json` (about 50K English words,
  frequencies 0–255, derived from wordfreq, CC BY-SA 4.0), for every language
  ([#2155](https://github.com/florisboard/florisboard/issues/2155)).
- **Upstream main is mid-rewrite** (k3lp / keyboard3): glide is commented out,
  JSON layouts were dropped, subtypes were broken. The roadmap puts glide's
  return at "0.7+", with no dates; two unpaid maintainers; no release since
  Jan 2026.
- **Upstream will not take our code.** `AI_POLICY.md` on main prohibits
  AI-generated contributions.
- **No Uzbek layout exists in FlorisBoard**, Latin or Cyrillic, and no Uzbek UI
  translation. `jcuken_russian` (11/11/9 rows) and `turkish_q` are present.
- **FlorisBoard declares no INTERNET permission** (VIBRATE and
  POST_NOTIFICATIONS only), which matches the privacy rule from the start.
- **The engine is small.** `packages/engine/src` is about 500 lines of
  TypeScript, and the old-Latin path the keyboard exercises is about half.
  Porting it is days, not weeks.

Consequences: fork the stable v0.5.2 and stop tracking upstream; prediction has
to be added by Alfavit, which is the largest piece of work and is therefore
moved out of the first release (owner's decision below).

## Goals

- Type ö ğ ş ç ʼ on real keys on Android, with no conversion step.
- Fix old-habit spellings live as they are typed, using the same rules as the
  website, with a one-tap way to keep the typed spelling. Old-habit swipes give
  the new word too.
- Be good enough at plain typing — Uzbek, Russian, English, swipe, emoji — that
  people leave Gboard for it.
- Build the first word list for the new alphabet by running free-licence Uzbek
  text through `@alfavit/engine`. It feeds swipe now and suggestions later.
- Keep the Android converter provably identical to the TypeScript engine.

## Non-goals (first release)

- Word suggestions, next-word prediction, learning from typing, typo correction.
  They come in later updates (owner's decision A).
- Voice input.
- iOS (Phase 3, its own design).
- F-Droid, IzzyOnDroid, or an APK on alfavit.uz.
- An Uzbek Cyrillic layout. Cyrillic Uzbek typists get ў қ ғ ҳ on long-press in
  the Russian layout instead.
- Following FlorisBoard's 0.6/0.7 rewrite.
- The official punctuation placement (see the keyboards design). If the state
  publishes a phone layout, it ships later as a second Uzbek layout.
- A full Uzbek translation of every settings screen (see *UI language*).

## Anti-goals — ways this fails even if it technically works

- **Any keystroke leaving the phone.** No network, no telemetry, no crash
  service, no "anonymous" anything. The owner's rule, and the project's central
  claim.
- **Auto-fix touching what it shouldn't:** Russian or English typing, passwords,
  email addresses, links, or a word the user chose to keep as typed.
- **Plain typing worse than Gboard:** lag on key press, a keyboard that crashes
  or forgets its settings, swipe that produces English in an Uzbek sentence.
- **The Android converter quietly disagreeing with the website.** Two engines
  that drift produce two spellings of the same word from one brand.
- **Asking people to sideload.** The install is a Play Store listing.

## Constraints

- Solo owner, 10–20 h/week, $0 budget.
- The owner has an Android phone for testing. No other devices.
- No Android SDK on the Mac yet (checked 23 Oct); installing it is a one-time
  setup step (see *Testing*).
- Publishing goes through a friend's Google Play account. The listing shows the
  friend's developer name until a transfer.
- Google Play requires target API 36 for new apps and updates since 31 Aug 2026
  ([source](https://developer.android.com/google/play/requirements/target-sdk));
  v0.5.2 already targets 36.
- The orthography rules are unpublished; the law takes effect 22 Apr 2027.

## Decided with the owner

From the keyboards design (binding):

| Question | Decision |
|----------|----------|
| Base | **Fork FlorisBoard** (Apache-2.0), not HeliBoard (GPL-3.0). |
| Scope | **Everyday keyboard** replacing Gboard: Uzbek new-Latin, Russian, English, swipe, prediction, emoji. |
| New letters | **Dedicated keys** (Turkish-style 11th column) **plus auto-fix** of `sh`/`ch`/`oʻ`/`gʻ`. |
| ʼ (U+02BC) | **A real key position.** |
| Privacy | **No keystroke ever leaves the device.** No network, no telemetry. |
| Publishing | **A friend's Google Play account**; the owner knows the listing and transfer implications. |

Decided in this brainstorm, 23 Oct 2026:

| Question | Decision |
|----------|----------|
| First release vs prediction | **A: ship without word suggestions.** Layouts, new-letter keys, auto-fix, swipe and emoji go out first; suggestions follow in an update. |
| Where ʼ sits | **C: beside the space bar**, in the comma's place. The comma moves to a long-press on the full stop. |
| Name | **Alfavit Klaviatura.** |
| Test device | The owner's own Android phone. |
| Friend's Play account | The owner believes it predates November 2023 (so no mandatory 12-tester test). **To verify** in Play Console before the first upload. |
| When auto-fix happens (after review) | **A: live, as you type.** The current word is composing text shown already fixed, so Telegram's Send button never sends an old spelling. |
| Old-habit swipes (after review) | **Yes.** Swiping s→h→a→h→a→r gives `şahar`. |

## Architecture

```
apps/android/                      FlorisBoard v0.5.2, imported once, then ours
  app/                             the IME (Kotlin, Compose), rebranded
    src/main/assets/ime/dict/      uz.json, ru.json, en.json  (generated)
    src/main/assets/ime/keyboard/  + Uzbek layout, subtype, popups
  engine/                          pure-Kotlin port of @alfavit/engine (JVM module)
packages/engine/fixtures/          shared input→output cases (TS and Kotlin both run them)
scripts/build-wordlists.ts         corpus → @alfavit/engine → word lists
```

*(My call:)* everything lives in this monorepo. The Kotlin engine and the
TypeScript engine sit side by side, run the same fixtures, and change in the
same pull request. A separate fork repository would make upstream merges
easier, but we are not merging upstream (see *Fork and upstream*), and it would
put the drift guard across two repositories.

### 1. The engine on Android

**Decision *(my call)*: a Kotlin port, held to the TypeScript engine by shared
fixtures.**

Options considered:

- **Rust core for every target (WASM for the web).** Rejected. It means
  rewriting an engine already published on npm at 0.2.1. It adds an NDK build,
  Play's 16 KB page-size rule for native code, and a WASM load to the website.
  All of that is to share 500 lines.
- **An embedded JS runtime (QuickJS) inside the keyboard.** Rejected. It means a
  native library, a second runtime in a memory-sensitive process, and start-up
  cost every time the keyboard opens.
- **Generated mapping tables only.** Rejected. Most of the engine is logic, not
  tables: the foreign-word rule, s+h stems, protected spans and casing.

Design:

- `apps/android/engine/` is a plain Kotlin/JVM module with no Android
  dependency, so its tests run fast in CI.
- **It ports all of `transliterate(input).text`, Cyrillic path included.** The
  keyboard only exercises old Latin. But porting the whole function is about
  100 extra lines, and it lets every fixture apply with no rules about which
  ones count. Segments and ambiguity flags are not ported; nothing on the phone
  reads them.
- **Shared fixtures** live in `packages/engine/fixtures/`, outside the npm
  `files` list, so no engine release is needed. There are two kinds:
  - *Hand cases:* the input→output pairs now written inline across the engine's
    test files (golden, old-Latin, s+h words, foreign words, tutuq belgisi,
    apostrophe variants, protected spans). They move into fixture files that the
    TS tests import, so each case is written once.
  - *Corpus cases:* a few tens of thousands of real tokens and short lines
    sampled by the word-list pipeline, with expected output produced by the TS
    engine. They are committed. CI regenerates them and fails if the committed
    file is stale.
- The Kotlin module declares which engine version it mirrors. CI asserts that it
  equals `packages/engine/package.json`'s version, so an engine release cannot
  ship without the port being looked at.
- **Regex pitfall.** Android's `java.util.regex` is ICU-based and differs from
  JavaScript. `\b` is Unicode-aware there and ASCII-only in JS, and
  case-insensitive matching and lookbehind behave differently. *(My call:)* the
  port uses explicit character checks instead of translating the engine's
  regexes literally. The fixtures include cases right at those boundaries, for
  example an `@handle` followed by ş. The parity tests run on the JVM in CI and
  also as an instrumented test on the emulator or phone before each release,
  because the JVM's regex is not the one the phone runs.
- **The known engine edge is wanted here.** The engine turns `o` + `ʼ` into ö
  and `g` + `ʼ` into ğ. With ʼ one tap away, that is exactly the old habit the
  keyboard should catch. The Kotlin port must reproduce it, and a fixture pins
  it.

### 2. Layouts

**Uzbek (new Latin)**, shown on the space bar as **Özbekça**:

```
q w e r t y u i o p ğ
 a s d f g h j k l ş
⇧ z x c v b n m ö ç ⌫
?123  ʼ  🌐  [ Özbekça ]  .  ↵
```

- ʼ is **U+02BC**. It has no capital, so Shift leaves it as ʼ. U+02BB (ʻ) and
  U+2019 (’) must never come from any Uzbek key or popup.
- The comma is on long-press of the full stop and also on long-press of ʼ,
  since ʼ took its place *(my call)*.
- Long-pressing o, g, s or c offers ö, ğ, ş or ç *(my call)*.
- Shift and Caps give Ö Ğ Ş Ç.
- Built in FlorisBoard v0.5.2's JSON layout format, starting from `turkish_q`
  and `qwerty`. Number and symbol pages keep FlorisBoard's defaults.

**Russian:** FlorisBoard's `jcuken_russian`. *(My call:)* its popups gain ў on
у, қ on к, ғ on г and ҳ on х, alongside the existing ё and ъ.

**English:** FlorisBoard's `qwerty`.

The 🌐 key and space-bar swipe switch between the three, as FlorisBoard already
does. *(My call:)* Uzbek is the default subtype when the phone's language is
Uzbek; otherwise FlorisBoard's usual default applies, with Uzbek offered first
in setup.

### 3. Auto-fix — live, as you type

**Owner's decision (after review): A, fix live.** Fixing at word boundaries was
the first idea and was dropped for two reasons the builder check found, both
confirmed on engine 0.2.1:
- **The Send button.** In chat apps people send by tapping the app's own Send
  button, which is never a word boundary. The last word went out unfixed:
  `choy ichamiz` + Send gave `çoy ichamiz`.
- **Addresses.** `.` and `:` ended a word too early. `shahar.uz` became
  `şahar.uz`, and `shohrux@mail.uz` became `şohrux@mail.uz`, because the
  engine saw `shohrux@mail`, which is not an address.

**How it works:**
- **Uzbek layout only.** Russian and English typing is never touched.
- **The current word is composing text** (Android's underlined in-progress
  region).
  - The keyboard keeps the raw keys typed for the word. After every keystroke it
    sets the composing text to `engine(raw)`.
  - Typing `s`, `h`, `a` shows `s`, `ş`, `şa`. Typing `o` then `ʼ` shows `ö`.
  - The text an app reads, including when Send is tapped, is always already
    fixed.
- **A word means everything since the last space or enter.** It includes
  `. , : @ /` and other punctuation, so the engine sees whole addresses:
  `shahar.uz`, `shohrux@mail.uz` and `@handles` stay as typed. A trailing
  `shahar.` still becomes `şahar.`, because the engine needs a known ending to
  call something an address.
- **Space or enter commits** the composing text as it stands.
- **Backspace** while composing removes the last raw key and recomputes, so
  deleting the `h` of `ş` leaves `s`. *(My call:)* backspacing into an already
  committed word may re-enter composing with that word as the raw input. That
  is safe because the engine is idempotent. The builder decides whether it is
  worth doing.
- **Accepted flicker.** Rare words change shape as they finish: `Ishoq` shows
  `Iş…` until the `o`, and `Chic` shows `Çi…` until the final `c`. These are the
  engine's own rules (s+h stems, the foreign-word rule) applying as the word
  grows.
- **Keeping the typed spelling.** When the fixed word differs from the raw keys,
  the strip above the keys shows the raw form, for example `shop`. Tapping it
  commits the raw form exactly, and that word is left alone. *(My call:)* this
  chip replaces backspace-to-undo, which only made sense when words were fixed
  at their ends.
- **Same rules as the website.** Ishoq, mushaf, Washington, links, emails and
  @handles are handled by the engine.
- **Never in:** password fields (all variations), email-address fields and URI
  fields, judged from the editor's `inputType`. In those fields the Uzbek layout
  types plain characters with no composing.
- **A settings switch**, "Auto-fix old spelling", is on by default. When it is
  off, the Uzbek layout types exactly the keys pressed.

The hook is FlorisBoard v0.5.2's per-keystroke composer
(`determineComposer` in `ime/editor/EditorInstance.kt`). Its composing mode is
currently switched on only when suggestions are on. The builder makes it run for
the Uzbek subtype whenever auto-fix is on. `ime/keyboard/KeyboardManager.kt` is
the other starting point. During testing, check how Telegram, WhatsApp and
Instagram treat composing text and their Send buttons, and that the strip has
room for the raw-form chip next to swipe alternatives.

### 4. Word lists and swipe

**Sources *(my call)*:**

| Corpus | Licence | Used for |
|--------|---------|----------|
| [HPLT 3.0](https://huggingface.co/datasets/HPLT/HPLT3.0) `uzn_Latn` | CC0 packaging | Uzbek, main source: old-Latin web text, filterable by quality bin |
| [FineWeb-2](https://huggingface.co/datasets/HuggingFaceFW/fineweb-2) `uzn_Cyrl` | ODC-By 1.0 (attribution) | Uzbek vocabulary written in Cyrillic (legal, news, forums) |
| [Common Voice](https://github.com/common-voice/common-voice) `uz` sentences | CC0 | Short everyday sentences, a conversational top-up |
| HPLT 3.0 `rus_Cyrl`, `eng_Latn` | CC0 packaging | Russian and English lists. These replace FlorisBoard's CC BY-SA English list, so all three lists come from one pipeline and one licence story |

**Rejected:**
- Uzbek Wikipedia: CC BY-SA, and full of bot-made stubs.
- tahrirchi `uz-crawl` and `uz-books`: their Apache/MIT labels can't be right for
  scraped news, Telegram posts and books.
- `uz-hunspell`: GPL-3.0.
- Leipzig: offers no Uzbek download.
- OpenSubtitles: almost no Uzbek.

**Pipeline:** `scripts/build-wordlists.ts`.
- It reads corpus files from a local download folder, which is never committed.
  It tokenises them, runs Uzbek text through `@alfavit/engine` (the workspace
  build), counts, filters, and writes
  `apps/android/app/src/main/assets/ime/dict/{uz,ru,en}.json` in FlorisBoard's
  word → 0–255 format.
- The output is deterministic and committed, along with a manifest that records
  source releases, file checksums, token counts and the engine version used.
- It also writes the corpus fixtures for the engine parity test (section 1).

**Size:**
- *(My call:)* start at about 100K words per language.
- FlorisBoard keeps the active list in a JVM map and has a long-standing OOM bug
  ([#677](https://github.com/florisboard/florisboard/issues/677)). Measure
  memory and swipe latency on the owner's phone and the emulator, then raise the
  size if there is room.
- For scale, AOSP's Turkish list is 180K words in 1.2 MB. Uzbek is
  agglutinative, so more surface forms help swipe.

**Provider change:** `LatinLanguageProvider` loads `ime/dict/<language>.json`
for the active subtype instead of one shared `data.json`. It loads lazily and
keeps only the active language, or the last two, in memory.

**Old-habit swipes give new words** (owner's decision after review). Swiping
s→h→a→h→a→r gives `şahar`, the same promise auto-fix makes for typing.
- FlorisBoard's `StatisticalGlideTypingClassifier` builds each word's ideal path
  from the word's own letters, so a list of new spellings alone can't match an
  old-habit swipe.
- *(My call:)* the classifier also indexes an **old-habit path** for every
  Uzbek word containing ö ğ ş ç or ʼ. The path is computed at load time by a
  fixed reverse rule: ş→sh, ç→ch, ö→o, ğ→g, and ʼ dropped, because old-habit
  swipers skip the apostrophe as Gboard trains them to. The candidate it yields
  is the new word.
- The word-list file format stays word → 0–255. No alias file is needed, and
  the memory cost is extra paths only for words that contain new letters.
- Where an old-habit path equals a real word's own path (an ö→o or ğ→g alias
  landing on an existing word), both become candidates and frequency ranks
  them. The other appears as a swipe alternative in the strip.
- The builder measures this on a sample of common words. If collisions hurt,
  the ö and ğ aliases may be restricted. The ş and ç aliases are unambiguous,
  because `sh` and `ch` paths can't be confused with single letters.
- Memory and latency measurements at the chosen list size include the alias
  paths.

**Attribution:**
- The About screen and `apps/android/THIRD_PARTY.md` credit FlorisBoard
  (Apache-2.0), FineWeb-2 (ODC-By, required), HPLT and Common Voice (CC0,
  credited anyway), and CLDR emoji data (Unicode licence).
- A word-frequency list is very likely not an adaptation of the text. ODC-By's
  notice requirement is met by the credit above. (Not legal advice; this is why
  the CC BY-SA sources were avoided rather than argued about.)

**Known limit:** informal Uzbek written without apostrophes (`ozbek` for
`oʻzbek`) can't be repaired by the engine. Such forms enter the list as typed,
at their lower frequency. Repairing them belongs to suggestions and typo
correction, later.

### 5. Emoji

- FlorisBoard's emoji panel, history and `:`-prefix emoji suggestions work in
  v0.5.2 and are kept.
- *(My call:)* bundle Uzbek and Russian emoji keyword files, from the same
  CLDR-derived source FlorisBoard uses (`florisboard/emojicon` prebuilt, which
  already has `uz.txt` and `ru.txt`). The CLDR version must match what v0.5.2
  loads.
- The Uzbek keywords are old Latin and go through the engine in the word-list
  pipeline.

### 6. Fork and upstream

**Import:**
- Tag v0.5.2 is imported into `apps/android/` as a single commit with no
  upstream history. The commit message records the upstream tag and SHA.

**Rebrand:**
- applicationId `uz.alfavit.keyboard`, app name **Alfavit Klaviatura**.
- The icon comes from Alfavit's existing logo.
- The About screen links to alfavit.uz and credits FlorisBoard.
- FlorisBoard's store metadata (`fastlane/`), issue templates and
  florisboard.org links are removed or replaced.

**Kotlin package names stay** `dev.patrickgold.florisboard.*` *(my call)*.
Renaming roughly a thousand files would make every upstream patch impossible to
apply, and users never see package names.

**Strip *(my call)*:**
- The 7.4 MB Chinese han-shape language pack.
- `lib/native`, a dummy Rust static library built through CMake and the NDK.
  The app module declares a dependency on it today, so remove that dependency
  together with the module, unless the builder finds something real using it.
  Removing it drops the Rust toolchain, the NDK, and Play's 16 KB page-size rule
  from the build.
- Other bundled layouts stay; they are small and harmless.

**Licences:**
- `apps/android/` stays Apache-2.0, with FlorisBoard's LICENSE and NOTICE kept.
  Modified files carry the "changed by Alfavit" notice Apache §4 requires.
- *(My call:)* the Kotlin engine module is MIT, like the TypeScript engine it
  mirrors.

**Upstream tracking:**
- None by default. Upstream's 0.6/0.7 rewrite is not followed.
- The base tag is recorded in `apps/android/UPSTREAM.md`.
- A fix is cherry-picked only when it solves a problem Alfavit users actually
  hit (`git format-patch` upstream, `git am --directory=apps/android` here).
  `UPSTREAM.md` logs each one.
- Nothing is offered back upstream, because of their AI policy.

**Kept as is:**
- The crash dialog. It shows a stack trace the user may copy and sends nothing.
  Its "report" link points to Alfavit's GitHub issues. The builder confirms the
  log cannot contain typed text.
- Clipboard history. It is local only.

### 7. Privacy, enforced

- The merged manifest must not contain `android.permission.INTERNET` or
  `ACCESS_NETWORK_STATE`. A CI step inspects the built release artefact and
  fails the build if either appears. Without INTERNET the process cannot open a
  socket, so this one check is the guarantee, and any dependency that sneaks the
  permission in breaks the build.
- No analytics SDK and no crash-reporting service.
- **Android backup is off** *(my call, under the owner's no-data rule)*.
  FlorisBoard v0.5.2 ships `allowBackup="true"`, and its
  `res/xml/backup_rules.xml` includes the settings store, the `ime` files folder
  and the user-dictionary database. Android uploads those to the user's Google
  Drive without the app holding INTERNET, so the permission check alone does
  not cover it.
  - Set `allowBackup="false"`, and make the backup and data-extraction rules
    exclude everything.
  - A second CI check asserts `allowBackup="false"` in the merged manifest.
  - The cost: settings don't follow someone to a new phone. That is
    acceptable; the "forgets its settings" anti-goal is about crashes, not
    phone changes.
- Play Data safety: no data collected, no data shared. Data processed only on
  the device does not need to be declared
  ([source](https://support.google.com/googleplay/android-developer/answer/10787469)).
- alfavit.uz's privacy page (`apps/web/src/pages/PrivacyPage.tsx`) gets a
  keyboard section that says the app has no internet permission and no cloud
  backup, and how anyone can check the permission.

### 8. UI language

FlorisBoard has English and Russian UI strings, but no Uzbek. *(My call:)* the
first release translates into Uzbek (new alphabet) the setup wizard, Alfavit's
own settings, and every string visible on the keyboard itself. The rest of the
settings fall back to English, and a full translation comes later. The Uzbek
strings ship marked `UNVERIFIED` until the owner checks them, the convention
already used in this repo.

## Distribution

- **Google Play, through the friend's account.**
  - The friend invites the owner into Play Console as a user with release
    rights, so the owner never needs the friend's password.
  - The listing shows the friend's developer name.
  - A later transfer is free and keeps users, reviews and the package name.
    Test tracks don't carry over
    ([source](https://support.google.com/googleplay/android-developer/answer/6230247)).
- **Before the first upload,** check the account's creation date in Play
  Console. Personal accounts created after 13 Nov 2023 must run a closed test
  with 12 testers for 14 days before production
  ([source](https://support.google.com/googleplay/android-developer/answer/14151465)).
  The planned closed test covers that either way.
- **Signing:**
  - Play App Signing.
  - The owner generates the upload key and stores it as a GitHub Actions secret.
  - CI builds a signed AAB on an `android-v*` tag, on the Ubuntu runner.
  - In the first release, the owner uploads to Play by hand.
- **Updates:** Play auto-updates. Unlike the desktop apps, an engine fix reaches
  users through an ordinary release.
- **Developer verification:** Google's 2027+ global rollout covers Play apps
  through the Play account. Registrations sit with the friend's identity until
  the transfer, which is one more reason to transfer eventually. Uzbekistan is
  not named in any announced wave
  ([source](https://developer.android.com/developer-verification)).
- **Store listing:** uz, ru and en, titled "Alfavit Klaviatura", with screenshots
  from the phone or emulator. The uz and ru copy is `UNVERIFIED` until the owner
  checks it.
- **Website:** an Android card on the Apps page linking to Play, plus the
  privacy-page section. The uz and ru copy is `UNVERIFIED` until checked.
- **Not in the first release:**
  - F-Droid. It re-signs apps, so users could not update between F-Droid and
    Play.
  - IzzyOnDroid.
  - A direct APK, which would conflict with Play signing.

## Testing

**Automated, in CI** (path-filtered Android job on the Ubuntu runner):
- Engine parity: every hand and corpus fixture, Kotlin output equal to the
  expected text, plus the version-mirror check.
- Auto-fix unit tests: sequences of key events give the expected composing and
  committed text after every key. They cover:
  - `s`,`h` → `ş` mid-word, and backspace recomputing.
  - Text read while still composing (the Send-button case) is already fixed.
  - Whole addresses: `shahar.uz`, `shohrux@mail.uz` and `@handles`.
  - The raw-form chip keeping the typed spelling, with no re-fix afterwards.
  - Skipped field types, Russian and English untouched, `o`+`ʼ`, and the
    settings switch.
- Swipe alias tests: the old-habit path generated for `şahar`, `çoy`, `özbek`
  and `boğ` matches the reverse rule. A word without new letters gets no alias.
- Layout checks: every new-alphabet letter is reachable on the Uzbek layout. No
  Uzbek key or popup emits U+02BB or U+2019. Capitals are correct.
- Word-list pipeline: deterministic output on a small fixture corpus. No U+02BB
  in `uz.json`. No entry that the engine would still change, since every entry
  must already be in the new alphabet.
- Privacy manifest checks: no INTERNET or ACCESS_NETWORK_STATE, and
  `allowBackup="false"`. Plus the build itself.

**By the assistant:**
- *(My call:)* install the Android command-line tools and an arm64 emulator
  image on the Mac. This is a one-time setup of several GB, and the owner
  approves it before it happens.
- Drive the emulator with `adb` (`input keyevent` per key, `input swipe` for
  paths). In a plain text field, check live fixing, the raw-form chip, and both
  ways of swiping `şahar`.
- Run the instrumented parity test there, which exercises the phone's ICU regex.
- When the owner's phone is connected with USB debugging, install debug builds
  on it the same way.

**By the owner, on their phone before each release:** a checklist kept in
`apps/android/README.md`:
1. Install and enable the keyboard, timing the setup.
2. Type `shahar choy oʼzbek maʼno`, using the ʼ key, and watch each word fix
   itself as you type. Keep one old spelling by tapping it in the strip.
3. Swipe `şahar` through the ş key, then the old way (s→h→a→h→a→r). Swipe a
   few Russian and English words too.
4. Use the Russian long-presses.
5. Confirm a password field is left alone.
6. In Telegram, type `choy ichamiz` and tap Send without a space. The message
   must read `çoy içamiz`.
7. Type `shahar.uz` and confirm it stays as typed.
8. Confirm Settings → Apps shows no network permission.

**Closed test:**
- Two weeks on Play, before public release.
- Volunteers come from the Telegram channel, at least 12 of them.
- Feedback goes through Telegram and GitHub issues.

## Suggested build order

1. Import v0.5.2, rebrand, strip, build in CI, privacy check.
2. Kotlin engine and shared fixtures.
3. Layouts.
4. Auto-fix.
5. Word-list pipeline, per-language provider, swipe per language.
6. Emoji keywords.
7. Uzbek UI strings.
8. Signing, store listing, website.
9. Closed test, then public.

## Later releases

- **Word suggestions.** This needs its own design. The choice is between AOSP
  LatinIME's Apache-2.0 native engine (FlorisBoard started importing it on a
  branch in Jan 2026) and a small Kotlin trie engine of Alfavit's own.
- Next-word prediction from bigrams, using the same pipeline.
- On-device learning.
- Typo and apostrophe-less repair (`ozbek` → `özbek`).
- Full Uzbek UI translation.
- The official-placement layout, once published.
- F-Droid and IzzyOnDroid, iOS (Phase 3), and the transfer to the owner's own
  developer account.

## Success criteria

1. On the owner's phone, typing `shahar choy oʼzbek` on the Uzbek layout shows
   `şahar çoy özbek` as it is typed. In Telegram, `choy ichamiz` + Send sends
   `çoy içamiz`. Tapping the raw form keeps an old spelling. Confirmed by the
   owner's checklist, not claimed by the assistant.
2. Swiping `şahar` gives `şahar` both through the ş key and the old way
   (s→h→a→h→a→r). Swiping on Russian and English produces words in those
   languages.
3. CI proves that the Kotlin and TypeScript engines agree on every fixture, and
   that the release build has no INTERNET permission and backup is off.
4. Two weeks of closed testing with at least 12 people ends with no open bug
   that blocks typing.
5. **Alfavit Klaviatura** is public on Google Play, and alfavit.uz's Apps page
   links to it.

## Left to the builder

- The exact hook points in FlorisBoard's input path, and the composing state machine
  details.
- Fixture file format, and how many corpus cases to sample.
- Tokeniser rules, filters and thresholds in the word-list pipeline, and the
  final list sizes after measurement.
- How the comma long-press and the extra popups are expressed in FlorisBoard's
  JSON.
- Producing the icon at Android's required sizes from the existing logo.
- Module and Gradle wiring for `apps/android/engine/`, and the CI job's path
  filters.
