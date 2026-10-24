# @alfavit/layouts

Keyboard layouts for the 2026 Uzbek Latin alphabet. Option (macOS) or AltGr
(Linux, Windows) plus `o g s c '` types `ö ğ ş ç ʼ`; every other key is the U.S.
layout, unchanged. One key table (`src/keys.ts`) feeds every generator, and a
test holds it to `@alfavit/engine`.

Design: [docs/specs/2026-10-23-keyboard-layouts-design.md](../../docs/specs/2026-10-23-keyboard-layouts-design.md).

## Generate

```bash
pnpm --dir packages/layouts generate
```

Writes `out/` and the three downloads in `apps/web/public/download/`. Commit
what it writes: CI regenerates and fails on any difference.

| File | What it is |
|------|------------|
| `out/macos/Ozbek-yangi-alifbo.bundle/` | macOS layout bundle: `Info.plist`, the `.keylayout` and its icon; served zipped as `Ozbek-yangi-alifbo.zip` (the `/dl/mac-layout` target) |
| `out/macos/Ozbek-yangi-alifbo.keylayout` | the same layout without an icon; still served at its old URL for links made before the bundle |
| `out/macos/model.json` | expected output per key and state, for the Apple comparison |
| `out/linux/xkb/symbols/uz`, `out/linux/xkb/rules/evdev.xml` | Linux `uz(alfavit)` drop-in, served as `alfavit-xkb.tar.gz` |
| `out/windows/ozbek-yangi-alifbo.klc` | Windows source for Phase 1b (UTF-16LE); not built or served yet |

## Check the U.S. base against Apple's layout (macOS only)

```bash
swift packages/layouts/tools/compare-us.swift packages/layouts/out/macos/model.json
```

Reads the U.S. layout installed on the Mac and translates every key under all
32 combinations of ⌘ ⇧ ⇪ ⌥ ⌃ (through the combination table in `model.json`),
plus every dead key, against `model.json`. Read-only: it selects, enables and
changes nothing. Must print `0 mismatches`. Run it after any change to
`src/macos/usBase.ts` or `src/macos/keylayout.ts`.

Known limit: the layout has one key map for every keyboard type. ANSI and ISO
keyboards match Apple's U.S. layout exactly; Japanese (JIS) keyboards do not —
Apple's U.S. layout has a separate JIS table (for example `¥` and `_` on the
two extra JIS keys), which this layout does not reproduce.

## The menu-bar icon

Apple's own layouts show a letter badge — "A", "РУ", "ЎЗ" — that macOS draws
from a text label (`TISIconLabels`, `Primary`). A third-party layout cannot
use that: checked against macOS 27.0's HIToolbox on 24 Oct 2026, the reader
for a layout bundle's `KLInfo_<layout name>` dictionary
(`islPopulateKLPropertiesFromBundle`) reads `TISInputSourceID`,
`TISIntendedLanguage`, `TISIconIsTemplate` and a few locale keys, but not
`TISIconLabels`; labels are read only for input methods and for Apple's
compiled layout collection.

So `src/macos/icon.ts` draws the badge itself: "ÖZ" cut out of a filled
rounded square, matched to the system badges' 16 pt height, 11 pt text and
semibold weight, and marked as a template (`TISIconIsTemplate`) so macOS
paints it white on a dark menu bar and black on a light one. It is drawn from
geometry, not a font, so the bytes are the same on every machine. An `.icns`
is square; Apple's badges are 22 × 16 pt, so this one is narrower.

## Acceptance checklist — macOS (owner)

Run against a copy downloaded **through a browser**, so it carries the
quarantine flag a real visitor's copy has. Start the web dev server and open
`http://localhost:5173/download/Ozbek-yangi-alifbo.zip`.

- [ ] If the browser did not unpack it, double-click `Ozbek-yangi-alifbo.zip` in Downloads. Finder shows `Ozbek-yangi-alifbo.bundle` as one item.
- [ ] Move `Ozbek-yangi-alifbo.bundle` to `~/Library/Keyboard Layouts/` (delete an older `Ozbek-yangi-alifbo.keylayout` there first, if any), then log out and back in.
- [ ] System Settings → Keyboard → Input Sources → + finds **Özbek (yangi alifbo)**, with the **ÖZ** badge as its icon. Note which language it is listed under (the bundle says Uzbek, Latin script). If it does not appear, run `xattr -r -d com.apple.quarantine ~/Library/Keyboard\ Layouts/Ozbek-yangi-alifbo.bundle`, log out and in again, and note that it was needed — the page's install steps follow this result.
- [ ] With the layout selected, the input menu in the menu bar shows the **ÖZ** badge: black on a light menu bar, white on a dark one (System Settings → Appearance, Light then Dark). Note how it sits next to the system badges — same height, narrower — and whether it looks right.
- [ ] `defaults read com.apple.HIToolbox AppleCurrentKeyboardLayoutInputSourceID` prints `uz.alfavit.keylayout.Ozbek-yangi-alifbo` while the layout is selected (proves macOS read the bundle's settings).
- [ ] In TextEdit: ⌥o ⌥g ⌥s ⌥c ⌥' type `ö ğ ş ç ʼ`; with Shift, `Ö Ğ Ş Ç ʼ`; with Caps Lock on, ⌥s types `Ş`.
- [ ] ⌥e then e types `é`, ⌥u then u types `ü`, ⌥n then n types `ñ`.
- [ ] ⌘C and ⌘V work in TextEdit; Ctrl+C stops `sleep 100` in Terminal.
- [ ] `maʼno` typed with the layout and pasted into the alfavit.uz converter comes back unchanged (U+02BC, not U+02BB).
- [ ] With the Alfavit desktop app's live transform on, `özbek şahar` typed with the layout is left alone.
- [ ] Delete `Ozbek-yangi-alifbo.bundle` from `~/Library/Keyboard Layouts/`, log out and in: the input source is gone.
- [ ] Time from finished download to the first `ş` typed: ____ (feeds the install-time line on the page).
