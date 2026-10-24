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
compiled layout collection. The 22 × 16 pt badges themselves come from
KeyboardLayouts.framework (`KLInputSourceIconManager`), whose label table is
keyed by Apple's own input-source ids; for any other layout it returns
nothing and the menu falls back to the layout's icon, drawn at 16 × 16 pt
(measured on the owner's Mac, 24 Oct 2026, beside ABC's 22 × 16 pt badge).

So the badge is ABC's badge at 16 pt wide, with "öz" in place of "A": the
same 5 pt corners, the system font (SF) semibold at 11 pt as macOS sets two
letters, its line box centred vertically and its ink centred across. The
owner asked for exactly that after comparing it with ABC in the input menu.
`tools/render-icon.swift` draws it with public AppKit calls and writes the
pixels to `src/macos/iconMasks.ts`; checked on macOS 27.0 against Apple's own
renderer asked for a 16 × 16 pt "öz" badge, no pixel differs by more than
7/255. It is marked as a template (`TISIconIsTemplate`), so macOS paints it
white on a dark menu bar and black on a light one.

The letters are Apple's system font, rendered to pixels: no font data ships,
and the icon is only ever shown by macOS, beside Apple's own badges.

### Change the icon (macOS only)

```bash
swift packages/layouts/tools/render-icon.swift
pnpm --dir packages/layouts generate
```

The first command rewrites `src/macos/iconMasks.ts`; the generator packs those
pixels into the `.icns` on any machine, so CI's drift check still holds.

## Acceptance checklist — macOS (owner)

Run against a copy downloaded **through a browser**, so it carries the
quarantine flag a real visitor's copy has. Start the web dev server and open
`http://localhost:5173/download/Ozbek-yangi-alifbo.zip`.

- [ ] If the browser did not unpack it, double-click `Ozbek-yangi-alifbo.zip` in Downloads. Finder shows `Ozbek-yangi-alifbo.bundle` as one item.
- [ ] Move `Ozbek-yangi-alifbo.bundle` to `~/Library/Keyboard Layouts/` (delete an older `Ozbek-yangi-alifbo.keylayout` there first, if any), then log out and back in.
- [ ] System Settings → Keyboard → Input Sources → + finds **Özbek (yangi alifbo)**, with the **öz** badge as its icon. Note which language it is listed under (the bundle says Uzbek, Latin script). If it does not appear, run `xattr -r -d com.apple.quarantine ~/Library/Keyboard\ Layouts/Ozbek-yangi-alifbo.bundle`, log out and in again, and note that it was needed — the page's install steps follow this result.
- [ ] With the layout selected, the input menu in the menu bar shows the **öz** badge: black on a light menu bar, white on a dark one (System Settings → Appearance, Light then Dark). Beside ABC in the input menu it should match in height, corners and lettering, only narrower.
- [ ] `defaults read com.apple.HIToolbox AppleCurrentKeyboardLayoutInputSourceID` prints `uz.alfavit.keylayout.Ozbek-yangi-alifbo` while the layout is selected (proves macOS read the bundle's settings).
- [ ] In TextEdit: ⌥o ⌥g ⌥s ⌥c ⌥' type `ö ğ ş ç ʼ`; with Shift, `Ö Ğ Ş Ç ʼ`; with Caps Lock on, ⌥s types `Ş`.
- [ ] ⌥e then e types `é`, ⌥u then u types `ü`, ⌥n then n types `ñ`.
- [ ] ⌘C and ⌘V work in TextEdit; Ctrl+C stops `sleep 100` in Terminal.
- [ ] `maʼno` typed with the layout and pasted into the alfavit.uz converter comes back unchanged (U+02BC, not U+02BB).
- [ ] With the Alfavit desktop app's live transform on, `özbek şahar` typed with the layout is left alone.
- [ ] Delete `Ozbek-yangi-alifbo.bundle` from `~/Library/Keyboard Layouts/`, log out and in: the input source is gone.
- [ ] Time from finished download to the first `ş` typed: ____ (feeds the install-time line on the page).
