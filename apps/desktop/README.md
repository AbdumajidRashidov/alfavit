# Alfavit Desktop

A lightweight, offline desktop app for **macOS** and **Windows**. Press
**⌥⇧A** on Mac / **Alt+Shift+A** on Windows (or click the tray icon) to drop
down a panel holding the **Live transform** master switch: turn it on and the
Uzbek Cyrillic or old-Latin you type anywhere is auto-converted to the reformed
2026 new-Latin script, using the shared `@alfavit/engine`. See "Live transform"
below.

## Develop

```bash
pnpm install
pnpm --dir apps/desktop test        # frontend unit tests (Vitest)
pnpm --dir apps/desktop dev         # frontend only, http://localhost:1420
pnpm --dir apps/desktop tauri dev   # full app (requires Rust toolchain)
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml   # Rust unit tests
apps/desktop/scripts/check-windows.sh   # type-check the Windows build from macOS
```

`check-windows.sh` runs `cargo check --target x86_64-pc-windows-msvc --tests`
with a check-only stand-in for the Windows resource compiler, so Windows code
can be verified on a Mac without LLVM. Only CI links and bundles for Windows.

Generate the icon set (once, or when the logo changes):

```bash
pnpm --dir apps/desktop exec tauri icon ../web/public/logo.png
```

## Build

```bash
pnpm --dir apps/desktop tauri build
# macOS   -> src-tauri/target/release/bundle/dmg/Alfavit_<ver>_*.dmg
# Windows -> src-tauri/target/release/bundle/nsis/Alfavit_<ver>_x64-setup.exe
```

Or push a `desktop-v*` tag: `.github/workflows/desktop-release.yml` builds
the macOS `.dmg` and the Windows installer and attaches both to one draft
Release. Bump the version first in `package.json`, `src-tauri/tauri.conf.json`,
`src-tauri/Cargo.toml` and `Cargo.lock`.

The hosted downloads are static files in the web app, replaced by hand per
release: `apps/web/public/download/Alfavit.dmg` and
`apps/web/public/download/Alfavit-Setup.exe`. There is no auto-update on
either platform, so users must re-download.

## Install

Both builds are **unsigned** (no paid certificates).

- **macOS:** on first launch, right-click `Alfavit.app` → **Open** (or run
  `xattr -cr /Applications/Alfavit.app`) to bypass Gatekeeper once. Grant
  **Accessibility** permission when prompted so live transform can observe
  keystrokes.
- **Windows:** run `Alfavit-Setup.exe`. If SmartScreen shows "Windows protected
  your PC", choose **More info → Run anyway**. It installs per-user (no admin
  prompt). No permission is needed for live transform on Windows.

## Acceptance checklist — macOS

- [ ] App launches with **both** a Dock icon and a menu-bar (tray) icon.
- [ ] Left-click the tray icon toggles the panel; right-click shows Show / Live transform / Launch at login / Quit.
- [ ] Clicking the Dock icon reveals the panel.
- [ ] **⌥⇧A** toggles the panel from within any other app.
- [ ] The panel is frameless, always-on-top, and hides when it loses focus.
- [ ] **Esc** hides the panel.
- [ ] Follows system light/dark appearance.
- [ ] "Launch at login" persists across a logout/login.
- [ ] No network requests are made (the app is offline).

## Acceptance checklist — Windows (10 or 11, x64)

- [ ] Installer runs after the SmartScreen bypass; Alfavit appears in the tray (check the hidden-icons overflow).
- [ ] Left-click the tray icon toggles the panel; clicking it again while the panel is open **closes** it.
- [ ] Right-click shows Show / Live transform / Launch at login / Quit.
- [ ] **Alt+Shift+A** toggles the panel from within any other app — test with **at least two keyboard layouts installed** (e.g. Uzbek + English) and confirm it does not switch the input language.
- [ ] The panel is frameless, always-on-top, hides on blur and on **Esc**, and follows light/dark.
- [ ] "Launch at login" survives sign-out/sign-in.
- [ ] No network requests are made (the app is offline).

## Live transform

Open the panel and flip the **Live transform** switch, then keep using your
normal keyboard — each word you finish (with space or `.,!?;:`) in a normal
text field is auto-replaced with reformed new-Latin, whether you typed
Cyrillic or old-Latin. (The tray menu has the same toggle.)

- **macOS** requires **Accessibility** permission (System Settings → Privacy &
  Security → Accessibility). Toggling on the first time opens that pane.
- **Windows** needs no permission. Text typed into a program running **as
  Administrator** cannot be rewritten by a normal-privilege app; the word stays
  as typed.
- **Off fully stops the observer** — nothing is watched while it is off. The
  state persists across restarts and defaults to Off.
- Everything is on-device; no keystrokes are stored or sent.
- **Not transformed:** password/secure fields (macOS: always; Windows:
  best-effort — the app asks the focused control whether it is a password
  field, which browsers and standard Windows controls report), terminals
  (Terminal/iTerm on Mac; Windows Terminal, cmd, PowerShell, conhost, mintty,
  Alacritty, WezTerm on Windows), and words ended with Return/Tab (only
  space/punctuation trigger a transform).
- **Known limits on Windows:** the password check uses UI Automation, which
  can switch Chromium-based browsers (Chrome, Edge, Electron apps) into
  accessibility mode while Alfavit is on, raising their memory use. The Caps
  Lock state is read once when the switch is turned on and then tracked from
  key presses, so a Caps Lock change made on the lock screen or in an
  Administrator prompt is not seen until you toggle Live transform Off and On.

### Acceptance checklist — live transform (both platforms)

- [ ] Fresh install: the switch is Off; typing is untouched.
- [ ] macOS: flipping On the first time prompts for Accessibility; after granting, typing transforms. Windows: flipping On works immediately.
- [ ] In a plain editor (TextEdit/Notes or Notepad), in Word, and in a browser field: `shahar `→`şahar `, `oʻzbek `→`özbek `, `чой `→`çoy `; `hello ` unchanged.
- [ ] A browser password field is never modified.
- [ ] The terminal (Terminal/iTerm or Windows Terminal/PowerShell) is not transformed.
- [ ] Turning it Off stops all transformation immediately.
- [ ] On/Off state survives quit + relaunch.
- [ ] Typing stays responsive (no lag/stutter while on).

#### Windows-specific checks

- [ ] Caps Lock on: type an uppercase word plus a space (e.g. `ЧОЙ `) — the replacement keeps uppercase (`ÇOY `), never lowercase.
- [ ] Toggle Live transform Off then On several times quickly (tray and panel) — transforms still fire afterwards, and Task Manager shows no Alfavit CPU use while idle.
- [ ] Type a long sentence at full speed in Chrome and in Word — every word boundary still transforms; note whether Chrome's memory use jumps (see Known limits).
- [ ] Type a word and its space, then switch Live transform Off within a second — no replacement lands after the switch is Off.
- [ ] With a not-responding (hung) window in the foreground, toggling Live transform Off still returns promptly (no panel freeze).
- [ ] On a layout with AltGr characters (e.g. Polish `ą` via AltGr+A), those letters are buffered as text and the word still transforms.
- [ ] On a dead-key layout (e.g. United States-International): type `´` then `e` — the composed `é` is left alone and no replacement is attempted for that word.
- [ ] Password fields in three kinds of app — a browser login form, a classic Windows dialog (e.g. Credential Manager), and a Settings/WinUI sign-in — are never modified.
- [ ] Windows Terminal, cmd and PowerShell never receive backspaces.
- [ ] In a program running as Administrator (e.g. an elevated Command Prompt or Notepad started as admin), typing leaves the word exactly as typed — no partial deletion.
