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

Writes `out/` and the two downloads in `apps/web/public/download/`. Commit what
it writes: CI regenerates and fails on any difference.

| File | What it is |
|------|------------|
| `out/macos/Ozbek-yangi-alifbo.keylayout` | macOS layout, also served as a download |
| `out/macos/model.json` | expected output per key and state, for the Apple comparison |
| `out/linux/xkb/symbols/uz`, `out/linux/xkb/rules/evdev.xml` | Linux `uz(alfavit)` drop-in, served as `alfavit-xkb.tar.gz` |
| `out/windows/ozbek-yangi-alifbo.klc` | Windows source for Phase 1b (UTF-16LE); not built or served yet |

## Check the U.S. base against Apple's layout (macOS only)

```bash
swift packages/layouts/tools/compare-us.swift packages/layouts/out/macos/model.json
```

Reads the U.S. layout installed on the Mac and translates every key in every
state, plus every dead key, against `model.json`. Read-only: it selects,
enables and changes nothing. Must print `0 mismatches`. Run it after any change
to `src/macos/usBase.ts`.

## Acceptance checklist — macOS (owner)

Run against a copy downloaded **through a browser**, so it carries the
quarantine flag a real visitor's copy has. Start the web dev server and open
`http://localhost:5173/download/Ozbek-yangi-alifbo.keylayout`.

- [ ] Move the downloaded file to `~/Library/Keyboard Layouts/`, then log out and back in.
- [ ] System Settings → Keyboard → Input Sources → + finds **Özbek (yangi alifbo)**. If it does not appear, run `xattr -d com.apple.quarantine ~/Library/Keyboard\ Layouts/Ozbek-yangi-alifbo.keylayout`, log out and in again, and note that it was needed — the page's install steps follow this result.
- [ ] In TextEdit: ⌥o ⌥g ⌥s ⌥c ⌥' type `ö ğ ş ç ʼ`; with Shift, `Ö Ğ Ş Ç ʼ`; with Caps Lock on, ⌥s types `Ş`.
- [ ] ⌥e then e types `é`, ⌥u then u types `ü`, ⌥n then n types `ñ`.
- [ ] ⌘C and ⌘V work in TextEdit; Ctrl+C stops `sleep 100` in Terminal.
- [ ] `maʼno` typed with the layout and pasted into the alfavit.uz converter comes back unchanged (U+02BC, not U+02BB).
- [ ] With the Alfavit desktop app's live transform on, `özbek şahar` typed with the layout is left alone.
- [ ] Delete the file from `~/Library/Keyboard Layouts/`, log out and in: the input source is gone.
- [ ] Time from finished download to the first `ş` typed: ____ (feeds the install-time line on the page).
