# Alfavit Desktop (Phase 1)

A lightweight, offline macOS menu-bar app. Press **⌥⇧A** (or click the tray
icon) to drop down a panel that live-converts Uzbek Cyrillic or old-Latin text
to the reformed 2026 new-Latin script, using the shared `@alfavit/engine`.

## Develop

```bash
pnpm install
pnpm --dir apps/desktop test        # frontend unit tests (Vitest)
pnpm --dir apps/desktop dev         # frontend only, http://localhost:1420
pnpm --dir apps/desktop tauri dev   # full app (requires Rust toolchain)
```

Generate the icon set (once, or when the logo changes):

```bash
pnpm --dir apps/desktop exec tauri icon ../web/public/logo.png
```

## Build a .dmg

```bash
pnpm --dir apps/desktop tauri build
# -> src-tauri/target/release/bundle/dmg/Alfavit_<ver>_*.dmg
```

Or push a `desktop-v*` tag to build it in CI (see
`.github/workflows/desktop-release.yml`).

## Install (unsigned, Phase 1)

The build is **unsigned**. On first launch, right-click `Alfavit.app` → **Open**
(or run `xattr -cr /Applications/Alfavit.app`) to bypass Gatekeeper once.
Grant **Accessibility** permission when prompted so the global hotkey works.

## Acceptance checklist (run on macOS)

- [ ] App launches with **both** a Dock icon and a menu-bar (tray) icon.
- [ ] Left-click the tray icon toggles the panel; right-click shows Show / Launch at login / Quit.
- [ ] Clicking the Dock icon reveals the panel.
- [ ] **⌥⇧A** toggles the panel from within any other app.
- [ ] The panel is frameless, always-on-top, and hides when it loses focus.
- [ ] **Esc** hides the panel.
- [ ] Typing/pasting `oʻzbek` shows `özbek`; `шаҳар` shows `şahar`; the detected-script badge is correct.
- [ ] **Copy** copies the output; the button briefly reads "Copied".
- [ ] Follows system light/dark appearance.
- [ ] "Launch at login" persists across a logout/login (login item present).
- [ ] No network requests are made (verify in a network monitor — the app is offline).
- [ ] `pnpm --dir apps/desktop tauri build` produces a `.dmg`; the CI job attaches one to a draft Release.
