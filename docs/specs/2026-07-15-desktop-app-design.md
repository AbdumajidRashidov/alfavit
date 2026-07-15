# Alfavit Desktop App — Spec (Phase 1: shell + in-app live converter)

**Date:** 2026-07-15
**Status:** Design approved, pending spec review.
**Phase:** 1 of 2. Phase 1 = a macOS menu-bar app with a global-hotkey live-converter panel. **Phase 2 (deferred, separate spec): system-wide keyboard-hook transliteration ("type anywhere, any app").** Phase 1 builds the shell Phase 2 plugs into.

## Goal

A lightweight, offline macOS menu-bar app: press a global hotkey (or click the tray icon) to drop down a panel where you type or paste Uzbek text and see the reformed new-Latin result live — a converter that's always one keystroke away, on-device.

## Why this (and why phased)

The user's end goal is "turn it on and whatever I type anywhere converts live" — a system-wide transliterating keyboard layer (Phase 2). That's a large, native, permission-heavy build (OS keyboard hooks, synthetic backspace/retype, Accessibility permission, fragile across apps) and cannot be built/verified in the assistant's environment. Phase 1 ships a real, useful, mostly-verifiable desktop channel now, and establishes the Tauri shell + packaging that Phase 2 extends.

## Architecture

- **Framework:** Tauri v2 (Rust core + web frontend). Chosen for a tiny (~5 MB) low-RAM always-on menu-bar utility, matching Alfavit's lean/on-device ethos.
- **Package:** `apps/desktop/` in the monorepo.
- **Platform:** macOS first (built/tested on the user's Mac). Tauri keeps Windows/Linux as future build targets; not built or tested in Phase 1.
- **Offline / on-device:** bundles `@alfavit/engine`; no network calls at all.
- **One engine:** reuses `@alfavit/engine` (workspace dependency) — conversion is byte-identical to web/API/bot/extension, including the `oʻ→ö` fix.

### Interaction model
- App runs as a **menu-bar (accessory) app** — tray icon, **no Dock icon**.
- **Tray icon** (the Alfavit "A"): left-click toggles the panel; right-click (or menu) → Show, Launch at login (toggle), Quit.
- **Global hotkey** (default **⌥⇧A**): toggles the panel from anywhere.
- **Panel:** a small, frameless, always-on-top window (no traffic-light chrome), shown near the tray / screen top-right, hidden on blur or hotkey/Esc.

## Components

### Rust shell — `apps/desktop/src-tauri`
- Tray icon + menu (Show / Launch at login / Quit).
- Global-shortcut registration (`tauri-plugin-global-shortcut`), default ⌥⇧A, toggles panel visibility.
- Panel window config: `decorations: false`, `alwaysOnTop: true`, `skipTaskbar: true`, `visible: false` at startup, hidden on focus-loss.
- macOS `ActivationPolicy::Accessory` (menu-bar app, no Dock icon).
- Launch-at-login via `tauri-plugin-autostart`.

### Frontend — `apps/desktop/src` (Vite + React + TS)
- A lean **`LiveConverter`** component (written fresh here, *not* imported from `apps/web` — avoids its router/i18n coupling):
  - Input `<textarea>` (autofocus on panel open).
  - On every input event: `transliterate(text).text` from `@alfavit/engine` → output shown live below.
  - **Detected-script badge** (Cyrillic / Old Latin / —) from the engine's `detectedScript`.
  - **Copy button** (writes output to clipboard; brief "Copied" state).
  - Empty-state hint.
- Follows **system light/dark** (`prefers-color-scheme`).
- No network, no analytics, no i18n in Phase 1 (UI copy in English + the placeholder "Matn kiriting…"; full localization deferred).

### Shared
- `@alfavit/engine` — `workspace:*` dependency.

## Build, test & distribution

- **Toolchain:** Rust + Tauri CLI (for building); Node/Vite for the frontend.
- **Frontend testing (assistant-verifiable):** Vitest + React Testing Library for `LiveConverter` (live conversion, script badge, copy), run in the browser via Vite dev — the assistant verifies this like the web app.
- **Native shell testing (user, on Mac):** the tray icon, global hotkey, panel show/hide/blur, and launch-at-login are verified manually by the user via `pnpm --dir apps/desktop tauri dev`, against a short checklist the plan provides. The assistant writes the Rust/config but cannot launch/verify the native GUI in its environment.
- **`.dmg` packaging:** the macOS `dmg` bundle target is enabled, so `tauri build` produces `Alfavit.app` + `Alfavit_<ver>.dmg`.
- **Delivery (chosen: CI-built .dmg):** a GitHub Actions job on a `macos-latest` runner (`tauri-apps/tauri-action`) builds the `.dmg` on a `desktop-v*` tag (and on manual dispatch) and attaches it to a **GitHub Release**. The user downloads the `.dmg` — no local Rust needed. Building locally (`tauri build`) also works for anyone with the toolchain.
- **Signing:** builds are **unsigned** in Phase 1. On the user's own Mac, Gatekeeper is bypassed once (right-click → Open, or `xattr -cr Alfavit.app`). Warning-free distribution to others needs an **Apple Developer ID + notarization** — deferred, user-owned; the CI job is structured so signing secrets slot in later without rework.

## Out of scope / deferred

- **Phase 2:** system-wide keyboard-hook live transliteration (type in any app). Separate spec.
- Code signing / notarization, auto-update, Windows/Linux builds, Mac App Store.
- Multi-language UI, configurable hotkey UI, and settings beyond launch-at-login.
- Any network features (accounts, sync, telemetry).

## Success criteria

- `apps/desktop` builds a macOS `.dmg` (locally and via the CI macOS job → Release).
- Installed app: menu-bar icon present, no Dock icon; ⌥⇧A and tray-click both toggle the panel; panel hides on blur/Esc; "Launch at login" works.
- In the panel, typing/pasting Cyrillic or old-Latin shows correct new-Latin live (e.g. `oʻzbek`→`özbek`, `шаҳар`→`şahar`), matching the shared engine; Copy works; script badge correct.
- Frontend tests green; no network requests made by the app.
- The native-shell checklist passes on the user's Mac.
