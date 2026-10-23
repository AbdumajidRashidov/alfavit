# Alfavit Keyboards — Design

**Date:** 2026-10-23
**Status:** Brainstormed with the owner 23 Oct 2026; builder-checked; the two
owner questions it raised are decided. Awaiting owner approval of the whole
document.
**Builds on:** [Desktop app](2026-07-15-desktop-app-design.md),
[Live transform](2026-07-16-desktop-live-transform-design.md),
[Windows port](2026-09-11-desktop-windows-design.md),
[Engine](2026-07-10-alfavit-engine-design.md).

## Intent

Alfavit converts text people have already written. Nobody can yet *type* the
reformed alphabet without a workaround. On 23 Oct 2026 a Telegram channel
thread about Alfavit asked for a keyboard twice, unprompted, and one commenter
put the argument better than any analytics could:

> "Unda eskida qolib ketyaptida mushaklar xotirasi" — then muscle memory stays
> with the old alphabet.

That is the real limit of a converter. Converting after the fact fixes a
document and teaches nobody. The keyboard is where an alphabet is actually
learned, and with the law in force 22 April 2027 there is a window in which
whoever makes typing painless becomes the default tool.

This design covers keyboards on every surface Alfavit already serves. Desktop
layouts ship first because they are days of work, need no developer account,
and answer the thread immediately. Phones are the larger prize and come after.

## Goals

- Let someone type **ö ğ ş ç ʼ** directly, with no Alfavit process running.
- Ship macOS and Linux layouts that cost nothing to distribute.
- Keep one source of truth for the mapping, shared with the engine, so the
  layouts cannot drift from the converter.
- Lay the groundwork for a phone keyboard without committing to it yet.

## Non-goals

- **No network traffic from any keyboard surface, ever.** Not telemetry, not
  prediction lookups, not crash reports containing text.
- Not a replacement for the desktop app's live transform. The layout gives
  deliberate typing; the app keeps catching old habits. They are complementary
  halves and both ship.
- Not the official punctuation-key placement — not yet. See *The official
  layout question* below.
- Phase 1 contains no phone work at all.

## Anti-goals — ways this fails even if it technically works

- **Moving punctuation.** A layout that relocates `; ' [ ]` to carry ö ğ ş ç
  will be installed by developers once and removed the same afternoon.
- **Requiring a `curl | bash` pipe.** It is how yozgich.uz installs on macOS and
  it does dodge Gatekeeper, but asking people to paste a shell pipe that reads
  their keystrokes is a trust posture Alfavit should not adopt.
- **Any keystroke leaving the device.** A keyboard sees passwords, bank details
  and private messages. One network call, however innocent, ends the project's
  central claim. This is the owner's own stated constraint.
- **Fragmenting the standard.** If the state publishes an official layout and
  Alfavit is promoting a rival placement, Alfavit becomes part of the problem.

## Constraints that shaped the design

- **Solo owner, 10–20 h/week, $0 budget.** Everything in Phase 1 is free to
  build and free to distribute.
- **A friend's developer account is available** for store publishing. Relevant
  to phones only; Phase 1 needs no account on any platform. Apps published
  under another person's account are listed under their name, and transferring
  later is a real process on both stores, not a setting.
- **No Windows machine.** Same as the Windows port: the assistant can generate
  and syntax-check Windows artefacts, but end-to-end verification needs a
  third-party tester following a checklist.
- **The law is signed; the orthography is not.** OʻRQ-1184 was signed 21 Oct
  2026 and takes effect 22 Apr 2027. Official spelling rules have not been
  published, and neither has an official keyboard layout.
- **Competitors already hold the cheap ground.** yangicha.uz ships a macOS
  layout file today and routes phone users to iOS Text Replacement and the
  Gboard dictionary. yozgich.uz ships an unsigned macOS menu-bar app. Neither
  has a real phone keyboard; that gap is the opening.

## The five characters

The whole reform, from a typing point of view, is five characters. Taken from
`packages/engine/src/mappings/old-latin.ts`:

| New | Replaces | Code point | Capital |
|-----|----------|-----------|---------|
| ö | `oʻ` | U+00F6 | Ö U+00D6 |
| ğ | `gʻ` | U+011F | Ğ U+011E |
| ş | `sh` | U+015F | Ş U+015E |
| ç | `ch` | U+00E7 | Ç U+00C7 |
| ʼ | tutuq belgisi | U+02BC | — |

Two details the layouts must respect, both already settled in the engine:

- The output apostrophe is **U+02BC (ʼ)**. U+02BB (ʻ) is an *input* form the
  engine normalises away and must never appear in new-alphabet output.
- `ʼ` is a letter of the alphabet, not punctuation. It needs a real key
  position, not a long-press buried in a symbols panel.

## Decided with the owner

| Question | Decision |
|----------|----------|
| Desktop key placement | **Modifier combos.** ⌥ (macOS) / AltGr (Windows, Linux) plus the base letter. Nothing moves. |
| Phone key placement | **Dedicated keys plus auto-fix.** The letters get real keys, and `sh`/`ch`/`oʻ`/`gʻ` typed out of habit are still corrected. |
| Phone scope | **An everyday keyboard** — Uzbek, Russian and English layouts, swipe, prediction, emoji. Not a specialist keyboard people switch into. |
| Phone order | **Android first**, forking FlorisBoard. **iOS second**, written from scratch. |
| Overall order | **Desktop first.** |
| Official placement | Ship as a **second variant** once the standard is published. |

The split between surfaces is deliberate and worth recording, because it looks
inconsistent until you see the reason. A phone keyboard is drawn on screen, so
it can always tell the truth about itself: new keys appear, and people learn
the alphabet by looking at them. A laptop keyboard has physical keycaps that
would start lying the moment `;` began producing ş. So: **teach on the surface
that can show you, stay invisible on the surface that cannot.**

## The official layout question

Alfavit's own keyboard guide currently tells visitors, in three languages, that
"the official layout proposal places Ö, Ğ, Ş and Ç on punctuation keys that are
unused in Uzbek". That traces to gazeta.uz and spot.uz coverage from 10 Sep
2026, logged in [the GTM design](2026-09-10-launch-gtm-design.md). It is a
press-reported proposal, not a published standard, and the official spelling
rules are still unreleased.

The decision: **ship the modifier-combo layout now, add the official placement
as a second variant when the standard is actually published.** Operating systems
distribute layouts exactly this way — Turkish has shipped Q and F side by side
for decades. Alfavit gets something installable this week that breaks nobody's
punctuation, without betting against a standard that may arrive next spring.
Because both variants come out of the same generator, the second is a day's
work once the placement is known.

The guide copy should change tone accordingly: it currently presents the
official placement as something to wait for. It should present the Alfavit
layout as the thing to install today, and the official placement as something
Alfavit will ship the moment it exists.

---

# Phase 1 — Desktop layouts

The work to start now.

## Key assignments

Base letter plus the platform's third-level modifier, so the modifier letter
*is* the letter you mean. Capitals use the same combination with Shift.

| Output | macOS | Linux / Windows | Displaces on macOS US |
|--------|-------|-----------------|----------------------|
| ö / Ö | ⌥o / ⌥⇧o | AltGr+o / AltGr+Shift+o | ø / Ø |
| ğ / Ğ | ⌥g / ⌥⇧g | AltGr+g / AltGr+Shift+g | © / ˝ |
| ş / Ş | ⌥s / ⌥⇧s | AltGr+s / AltGr+Shift+s | ß / Í |
| ç / Ç | ⌥c / ⌥⇧c | AltGr+c / AltGr+Shift+c | **nothing — ⌥c is already ç** |
| ʼ | ⌥' | AltGr+' | æ |

Note the gift in row four: the standard macOS US layout already produces ç on
⌥c. One of the four is existing Mac muscle memory, and the layout keeps it
exactly where fingers already expect it.

Everything else in the US layout is preserved, including the dead keys people
rely on (⌥e for acute, ⌥u for diaeresis, ⌥n for tilde). Only the five
combinations above change. The displaced characters — ø, ©, ß, æ — should be
listed plainly on the download page rather than discovered later.

## Source of truth and generation

The mappings live in `packages/engine/src/mappings/old-latin.ts`. The layout
files must not restate them by hand.

*(My call, not the owner's:)* add `scripts/build-layouts.ts`, which emits every
layout artefact from one **key-assignment table** owned by the layouts code —
`{ base: 'o', output: 'ö', capital: 'Ö' }` and so on, five rows.

That table is deliberately *not* derived from the engine's digraph table. The
digraph table is a conversion table, not a key table: its `ŏ → ö` self-heal row
and its trailing `ʻ → ʼ` row exist for conversion reasons and have no key
meaning, so deriving keys from it would need a rule plus exceptions that could
silently go wrong on the next mapping change. Exporting a key table from
`@alfavit/engine` instead would be a public-API change to a package already
published at 0.2.1, forcing a release. Neither is worth it.

The drift guard is a CI test asserting the two tables agree: every new-alphabet
letter the engine can emit has a key assignment, and every key assignment emits
a character the engine treats as valid new-alphabet output. Golden files in the
repo, regenerated by the script, diffed in CI. No engine release is part of this
plan.

*(My call:)* artefacts live in a top-level `layouts/` directory —
`layouts/macos/`, `layouts/linux/`, `layouts/windows/` — because they are not
npm packages and not part of any app, and the website serves them as downloads.

## macOS

A `.keylayout` XML file, named **Özbek (yangi alifbo)**, behaving as the US
QWERTY layout with the five overrides above, and a unique negative layout id.

*(My call:)* **the generator synthesises the whole layout from scratch** rather
than patching a copy of Apple's. macOS does not ship the US layout as editable
XML — it lives as binary resources inside `AppleKeyboardLayouts.bundle` — so
"patching" would mean checking in a third-party export of Apple's layout data
and shipping it under this repo's MIT licence. Synthesising avoids that
question entirely and means the generator owns every line of the file, so the
golden-file diff is meaningful rather than five entries in several hundred.

That makes the generator the bulk of Phase 1: it has to produce every key code
across the plain, Shift, Option, Option-Shift and Caps Lock sets, plus the
dead-key state machines for ⌥e, ⌥u, ⌥i, ⌥n and ⌥` with their terminators. The
estimate is still days, not weeks, but that is where the days go.

Distribution is the thing that makes this attractive: the file goes into
`~/Library/Keyboard Layouts/`, the user adds it under System Settings →
Keyboard → Input Sources, and that is the whole install. A `.keylayout` is
data, not an executable — **no Apple Developer account, no signing, no
notarisation, no $99.** Ship it as a plain zip from alfavit.uz alongside the
app installers.

Include an uninstall line in the instructions. Removing a layout means deleting
the file and logging out; people who cannot undo an install will not try one.

## Linux

An XKB variant under the `uz` symbols file, mapping the five characters to the
third level (AltGr), named `uz(alfavit)` — see *Decided after review* below.

*(My call:)* **the variant includes `us(basic)` as its base**, not `uz(latin)`,
plus `level3(ralt_switch)`. Most Uzbek Latin typists on Linux are on plain
`us`. Inheriting from `us(basic)` makes every key identical to US except the
AltGr combinations, which is the same nothing-moves promise the macOS layout
makes. Inheriting `uz(latin)` would change keys the user did not ask to change.

*(My call:)* **functional tests, not just syntax.** `xkbcomp` checks that the
file parses; it does not check that AltGr+s produces ş. `xkbcli` from
libxkbcommon compiles a keymap headlessly and can report which keysym each key
and level produces, so CI can assert all five characters, their capitals, and
that a sample of unaffected keys still match `us(basic)`. That runs on the
ordinary Linux CI runner; no Linux machine or volunteer needed.

Ship a drop-in file with install instructions for people who want it today.

Upstream is the higher-leverage move: if `xkeyboard-config` accepts a
variant, every Linux distribution ships it without anyone downloading
anything, permanently. By the owner's decision, that filing waits for the
official placement — see *Decided after review* below.

## Windows (Phase 1b)

A custom layout needs a DLL plus an installer that writes to the registry and
requires admin, and unsigned it meets the same SmartScreen wall as the existing
installers.

**Not part of the first shipment.** Phase 1 ships macOS and Linux; Windows
follows as 1b.

*(My call:)* **the DLL is built on the CI Windows runner, never on anyone's
personal machine.** MSKLC and kbdedit are Windows GUI tools, and the
established tester arrangement covers *verification*, not *production* — for
the apps, CI builds the installer and the tester only runs it. The layout must
follow the same provenance. Publishing a keyboard driver built on a third
party's machine, from a project whose whole pitch is "a keyboard sees your
passwords and ours sends nothing anywhere", is not an option.

The headless path is `kbdutool.exe` — the command-line compiler bundled with
MSKLC — on the GitHub Actions Windows runner, which the project already uses.
Other open-source projects build Windows layouts this way in CI, but the effort
here is genuinely unknown. 1b starts with a short spike to prove the CI build
before committing to it; the `.klc` is generated and checked into
`layouts/windows/` in Phase 1 either way, so the spike starts from a known-good
source file. The tester then verifies the CI-built installer against a
checklist in `apps/desktop/README.md`, as with the port.

Deliberately sequenced behind macOS and Linux: Windows users are the ones
already served by the desktop app, so the layout is the lower-value half of the
pair for them, and it is the only Phase 1 artefact with a distribution problem.

## Website changes

- **A new localised layout download page** (en, uz, ru): what the layout does,
  the five key combinations, the displaced-characters list, install and
  uninstall steps per OS, and the downloads. Its route follows the routing
  conventions in the [web routing design](2026-07-11-alfavit-web-routing-design.md)
  and gets the same sitemap, hreflang and structured-data treatment as the
  other localised pages.
- **`apps/web/src/content/guides/keyboard.ts`** (en, uz, ru): existing steps
  kept **word for word** — they carry the search plan's keywords. Add one new
  first step pointing to the layout page, and
  rewrite the closing note per *The official layout question* above. Turkish Q
  stays as the advice for people who will not install anything.
- **Downloads and the Apps page:** cards for the macOS and Linux layouts next
  to the app installers, linking to the layout page.
- **uz and ru copy ships marked `UNVERIFIED`** until the owner, a native
  speaker, checks it — the convention already used in this repo.

## Testing

- **Generator:** unit tests asserting emitted artefacts match golden files, plus
  the key-table/engine consistency check described above.
- **macOS, automated:** XML well-formedness, unique negative id, every key code
  present in every modifier set, dead-key state machines complete.
- **macOS, by the owner:** a five-minute checklist, written as a deliverable.
  *(My call:)* this one cannot be done by the assistant. Enabling an input
  source is a System Settings step and likely needs a logout before
  `~/Library/Keyboard Layouts` is picked up; changing system input settings
  programmatically is off-limits for the assistant; and typing into a GUI app to
  read the result back already hit Secure Keyboard Entry during demo recording.
  The checklist covers: install, type all five characters plus capitals,
  confirm ⌥e/⌥u/⌥n dead keys still work, confirm the apostrophe pastes as U+02BC,
  uninstall. The owner also times the install, so the download page states a
  measured figure rather than "under a minute" on faith.
- **Linux:** `xkbcomp` parse plus `xkbcli` behavioural assertions in CI.
- **Windows (1b):** tester checklist in `apps/desktop/README.md`, against the
  CI-built installer.
- **Round trip:** *(My call:)* a fixture test over attested words — every word
  in the engine's existing test corpora, typed via the layout's key table, fed
  through `@alfavit/engine`, must come back unchanged. This is also what makes
  the layout safe alongside the desktop app's live transform: the key tap
  short-circuits when a transform is a no-op, so correctly typed new-alphabet
  words are left alone.

### Known engine edge, not fixed in this plan

The engine's normaliser folds U+02BC into U+02BB before conversion. So `o`
followed by `ʼ`, and `g` followed by `ʼ` — sequences the old orthography made
impossible to type by accident, but which this layout makes one keystroke away
— come back from the engine as `ö` and `ğ`. No attested word is known to hit
this. Fixing it means an engine change, an npm release, and rebuilt desktop
installers and extension zip through the six-step no-auto-update chain, so it is
logged for the next engine release rather than pulled into a layouts shipment.

## Success criteria

1. A Mac user types `özbek ğalaba şahar çoy maʼno` with no Alfavit process
   running — confirmed by the owner's checklist, not claimed by the assistant.
2. The layout is downloadable from alfavit.uz, with a measured install time on
   the page and a one-line uninstall.
3. The Linux drop-in passes `xkbcli` behavioural tests in CI.
4. The layout has its own download page in en, uz and ru, and the keyboard
   guide's first step points to it, with every existing step unchanged.
5. No upstream filing yet — by decision. It happens when the official
   placement is published.

---

# Phase 2 — Android keyboard

Sketched here so Phase 1 does not paint it into a corner. Needs its own design
document before any code.

**Fork FlorisBoard** (Apache-2.0). It is the only mature open-source Android
keyboard with its own glide-typing implementation — HeliBoard and OpenBoard
both descend from AOSP LatinIME, whose gesture recogniser is a proprietary
Google library they cannot ship, so there is no swipe to inherit from them.
Apache-2.0 also keeps Alfavit's licensing free, where HeliBoard's GPL-3.0 would
pull the whole keyboard into GPL.

**The engine does not port cleanly, and this is the main technical risk.**
There is no Rust or Kotlin implementation of the transliteration logic.
`apps/desktop/src-tauri/src/live/bridge.rs` shows how the desktop app copes:
Rust emits an event and asks the JavaScript engine in the Tauri webview to
transform each word. An Android keyboard has no webview to ask, and an iOS
keyboard extension cannot afford a JS runtime inside its memory cap. Before
Phase 2, the engine needs either a portable core (Rust compiled to every
target, WASM for the web) or generated per-platform mapping tables sharing one
golden test suite. That decision belongs in the Phase 2 design, but it is the
thing most likely to blow up the estimate.

**Prediction has an unfair advantage worth designing around.** An Uzbek
word-frequency model in the new alphabet does not exist — the alphabet is days
old. But Alfavit can manufacture the first one: take any large Uzbek corpus in
Cyrillic or old Latin and run it through `@alfavit/engine`. The converter builds
the keyboard's brain. No competitor can do this as cheaply.

# Phase 3 — iOS keyboard

Written from scratch; nothing to fork. Two platform facts shape it more than
effort does:

- Keyboard extensions run under a hard memory cap of a few tens of megabytes,
  which puts a ceiling on the prediction model.
- **Voice typing is not available.** The dictation key belongs to Apple's own
  keyboard. Shipping voice would mean bundling speech recognition, which needs
  Full Access and in practice a network connection — straight into the
  anti-goal above. Voice comes off the iOS list entirely.

Plan for no swipe at launch.

---

# Also worth doing, cheaply

**Ask the vendors to ship it natively.** The law is signed, which is the
argument that gets an orthography change taken seriously. Filing with Unicode
CLDR and Apple Feedback, and the equivalent for Microsoft and Google, costs an
evening. If any of them says yes, a native "Uzbek (Latin, 2026)" layout reaches
more people than anything Alfavit can distribute itself, permanently. Low odds,
trivial cost, enormous payoff — and it is a non-code task the owner can do
while code is being written.

# Decided after review

Two questions the builder check raised that only the owner could answer.
Both decided 23 Oct 2026.

1. **Website — the guide stays, the layout gets its own page.**
   The keyboard guide is the asset the
   [search-visibility plan](2026-10-22-search-llm-visibility-design.md) bets on
   for "Ö Ğ Ş Ç klaviatura"; its `steps[]` feed the HowTo JSON-LD and
   `llms-full.txt`. (Its uz and ru steps still carry `UNVERIFIED` markers — the 23 Oct approval covered the week-3 strings, not this guide.) So its
   existing steps stay **word for word**. One new step is added at the top
   pointing to the layout, and the closing note is rewritten per *The official
   layout question*. The layout itself gets **its own localised download page**
   in en, uz and ru — a second ranking opportunity rather than a risk to the
   one Alfavit already has. yangicha.uz already holds a `/klaviatura` page; this
   is the answer to it.
2. **Linux — ship the drop-in now, hold the upstream filing.**
   A variant name is effectively permanent once distributions ship it, and the
   filing is public and under the owner's own identity. Claiming the generic
   `uz(newlatin)` for a placement the state has not endorsed would contradict
   the "fragmenting the standard" anti-goal, and would leave the worse name for
   the official layout when it arrives. So the drop-in ships from alfavit.uz
   now, and **the upstream pull request waits until the official placement is
   published — then Alfavit upstreams *that* as `uz(newlatin)`.** The owner's
   name goes on the official layout reaching every distribution, not on a
   rival to it.
   *(My call:)* the drop-in variant is named `uz(alfavit)` — clearly branded,
   claiming nothing official, and free to retire once the official variant
   lands upstream.

# Left to the builder

- The exact `.keylayout` id, bundle naming, and whether to ship a `.bundle`
  with localised layout names or a bare `.keylayout`.
- Generator implementation language and whether it runs in CI or on demand.
- Whether the Linux drop-in ships as a patch file or a full `uz` symbols file.
- Page layout and visual treatment of the new download cards.
- Where the displaced-characters note lives: download page, guide, or both.
