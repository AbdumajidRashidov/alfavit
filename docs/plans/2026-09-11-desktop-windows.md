# Alfavit Desktop — Windows Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Alfavit desktop app on Windows with the same tray + Alt+Shift+A panel and system-wide Live transform as the macOS app, delivered as a CI-built NSIS installer hosted on alfavit.uz behind a live Windows card.

**Architecture:** The `live/` module splits into shared pure logic plus per-platform backends (`keytap`, `replacer`, `guard` each become a directory with `macos.rs` moved verbatim and a new `windows.rs`). Windows observes keystrokes with a `WH_KEYBOARD_LL` hook whose callback only enqueues; a worker thread runs the guard, classifies, buffers words and dispatches them through the existing bridge → engine → replacer path, where one `SendInput` batch rewrites the word. Pure Windows logic (key classification, replacement plan, denylist) lives in platform-independent files so its tests run on macOS too. Every Windows Rust change is type-checked from macOS with `cargo check --target x86_64-pc-windows-msvc` via a small script; only CI links and bundles.

**Tech Stack:** Tauri 2.11 (Rust), `windows` crate 0.61, React 18 + Vite + Vitest (panel), GitHub Actions `windows-latest` + `tauri-apps/tauri-action`, NSIS installer, Cloudflare Pages static hosting.

**Spec:** [docs/specs/2026-09-11-desktop-windows-design.md](../specs/2026-09-11-desktop-windows-design.md)

## Global Constraints

- **macOS behaviour is unchanged.** macOS code moves verbatim; shared files keep their semantics; anything Windows-only is behind `#[cfg(target_os = "windows")]`.
- **Version for this release: `0.3.0`** in `apps/desktop/package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml` and `src-tauri/Cargo.lock`. The hosted Mac `.dmg` stays at 0.2.1.
- **Dependency:** `windows = "0.61"` (Tauri 2.11 already pins 0.61.3). No other new Rust or JS dependencies.
- **Shared invariants keep their names:** `ALFAVIT_MARKER = 0x0A1F_A710`, `GENERATION: AtomicU64`, `Key`, `Emitted`, `WordBuffer`.
- **Hotkey:** Alt+Shift+A (unchanged `Shortcut::new(Some(Modifiers::ALT | Modifiers::SHIFT), Code::KeyA)`).
- **Installer:** NSIS, `installMode: "currentUser"`, hosted at `apps/web/public/download/Alfavit-Setup.exe` (renamed from CI's `Alfavit_0.3.0_x64-setup.exe`).
- **Windows hint copy (panel):** `Couldn't start live transform. Try again or restart Alfavit.`
- **Test commands:** Rust: `cargo test` in `apps/desktop/src-tauri` (macOS) and `apps/desktop/scripts/check-windows.sh` (Windows type-check incl. tests). Frontend: `pnpm --dir apps/desktop test`. Web: `pnpm --dir apps/web test`.
- **Git:** work on branch `desktop-windows`; stage with explicit paths; run `git status` before each commit and leave untracked `.DS_Store` / logo files alone (another session may share this checkout). Every commit message ends with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- **Sequencing:** Tasks 1–13 may merge to `main` any time (the Windows CI job runs only on tags). Task 15 (website card + hosted installer) is held until the tester reports the README checklist passing.

---

## File map

| Path | Change | Responsibility |
|---|---|---|
| `apps/desktop/scripts/check-windows.sh` | create | Type-check the crate for Windows from macOS (creates an `llvm-rc` stand-in on the fly) |
| `apps/desktop/src-tauri/Cargo.toml` | modify | Gate macOS crates per target; add `windows`; version 0.3.0 |
| `apps/desktop/src-tauri/src/live/keytap/mod.rs` | create | Shared `ALFAVIT_MARKER`, `GENERATION`, `dispatch_word`; cfg re-exports |
| `apps/desktop/src-tauri/src/live/keytap/macos.rs` | move | Today's `keytap.rs` (CGEventTap) |
| `apps/desktop/src-tauri/src/live/keytap/win_keys.rs` | create | Pure: VK → `Key`, dead-key handling (tests run everywhere) |
| `apps/desktop/src-tauri/src/live/keytap/windows.rs` | create | Hook thread + worker thread |
| `apps/desktop/src-tauri/src/live/replacer/mod.rs` | create | cfg re-exports |
| `apps/desktop/src-tauri/src/live/replacer/macos.rs` | move | Today's `replacer.rs` |
| `apps/desktop/src-tauri/src/live/replacer/win_input.rs` | create | Pure: replacement → `Stroke` list |
| `apps/desktop/src-tauri/src/live/replacer/windows.rs` | create | `Stroke` list → one `SendInput` batch |
| `apps/desktop/src-tauri/src/live/guard/mod.rs` | create | cfg re-exports |
| `apps/desktop/src-tauri/src/live/guard/macos.rs` | move | Today's `guard.rs` + `open_permission_settings()` |
| `apps/desktop/src-tauri/src/live/guard/win_denylist.rs` | create | Pure: exe-name denylist |
| `apps/desktop/src-tauri/src/live/guard/windows.rs` | create | UI Automation password check, foreground exe |
| `apps/desktop/src-tauri/src/live/controller.rs` | modify | Use `guard::open_permission_settings()` |
| `apps/desktop/src-tauri/src/lib.rs` | modify | cfg `Reopen`; `open_permission_settings()`; Windows tray-click/blur guard |
| `apps/desktop/src-tauri/tauri.windows.conf.json` | create | NSIS target + per-user install |
| `apps/desktop/src-tauri/tauri.conf.json`, `apps/desktop/package.json` | modify | Version 0.3.0 |
| `apps/desktop/src/platform.ts` | create | `isWindows()` |
| `apps/desktop/src/LiveToggle.tsx`, `LiveToggle.test.tsx` | modify | Platform-aware hint |
| `apps/desktop/README.md` | rewrite | Both platforms, Windows install + checklist |
| `.github/workflows/desktop-release.yml` | modify | `build-windows` job |
| `docs/deployment.md` | modify | Both installers are rehosted manually |
| `docs/specs/2026-09-11-desktop-windows-design.md` | modify | Correct the tray-click/blur ordering paragraph |
| `apps/web/src/components/Channels.tsx`, `src/i18n/translations.ts`, `src/tests/Channels.test.tsx` | modify | Windows card live |
| `apps/web/public/download/Alfavit-Setup.exe` | create (binary) | Hosted installer |

---

### Task 1: Windows type-check tooling and per-target Cargo dependencies

**Files:**
- Create: `apps/desktop/scripts/check-windows.sh`
- Modify: `apps/desktop/src-tauri/Cargo.toml`

**Interfaces:**
- Produces: `apps/desktop/scripts/check-windows.sh` — runs `cargo check --target x86_64-pc-windows-msvc --tests` for the crate; exit 0 means the Windows build type-checks. Used by every later task.

Background: Tauri's build script embeds a Windows resource file and, on a non-Windows host, wants `llvm-rc`. `embed-resource` accepts any compiler named by `RC_x86_64_pc_windows_msvc`; since `cargo check` never links, a stand-in that answers the version probe and creates the output file is enough. The C preprocessor step uses `cc`, pointed at Apple `clang`.

- [ ] **Step 1: Create the check script**

```bash
mkdir -p apps/desktop/scripts
cat > apps/desktop/scripts/check-windows.sh <<'EOF'
#!/usr/bin/env bash
# Type-check the desktop crate for Windows from macOS/Linux — no linking, no
# Windows machine. Tauri's build script wants an RC compiler for the Windows
# target; a check-only stand-in for llvm-rc is created on the fly so you don't
# need a 1.5 GB LLVM install. Real builds happen on the Windows CI runner.
#
# Usage: apps/desktop/scripts/check-windows.sh [extra cargo args]
set -euo pipefail
cd "$(dirname "$0")/../src-tauri"
TARGET=x86_64-pc-windows-msvc
rustup target list --installed | grep -q "^$TARGET$" || rustup target add "$TARGET"

shim_dir="$(mktemp -d)"
trap 'rm -rf "$shim_dir"' EXIT
cat > "$shim_dir/llvm-rc" <<'SHIM'
#!/bin/sh
# Check-only stand-in for llvm-rc: answers embed-resource's probe and creates
# an empty output file. Only valid for `cargo check` (nothing is ever linked).
for a in "$@"; do
  case "$a" in
    "/?") printf 'OVERVIEW: LLVM Resource Converter\n\nOPTIONS:\n  /no-preprocess\n'; exit 0;;
  esac
done
prev=""
for a in "$@"; do
  if [ "$prev" = "/fo" ]; then : > "$a"; fi
  prev="$a"
done
exit 0
SHIM
chmod +x "$shim_dir/llvm-rc"

export RC_x86_64_pc_windows_msvc="$shim_dir/llvm-rc"
export CC_x86_64_pc_windows_msvc=clang
exec cargo check --target "$TARGET" --tests "$@"
EOF
chmod +x apps/desktop/scripts/check-windows.sh
```

- [ ] **Step 2: Run it to confirm the current failure point is the ungated macOS crates**

Run: `apps/desktop/scripts/check-windows.sh 2>&1 | grep -E "^error" | head -3`
Expected: an error mentioning `objc2` only works on Apple platforms (the tooling reached the dependency tree; the crate itself is not yet Windows-clean).

- [ ] **Step 3: Gate the macOS crates and add `windows`**

Replace the `[dependencies]` section of `apps/desktop/src-tauri/Cargo.toml` so it reads:

```toml
[dependencies]
tauri = { version = "2", features = ["tray-icon"] }
tauri-plugin-global-shortcut = "2"
tauri-plugin-autostart = "2"
serde = { version = "1", features = ["derive"] }
tokio = { version = "1", features = ["sync", "time"] }

[target.'cfg(target_os = "macos")'.dependencies]
core-graphics = "0.25"
core-foundation = "0.10"
foreign-types = "0.5"
libc = "0.2"
objc2-app-kit = "0.3"

[target.'cfg(target_os = "windows")'.dependencies]
windows = { version = "0.61", features = [
  "Win32_Foundation",
  "Win32_UI_WindowsAndMessaging",
  "Win32_UI_Input_KeyboardAndMouse",
  "Win32_System_Threading",
  "Win32_System_LibraryLoader",
  "Win32_System_Com",
  "Win32_UI_Accessibility",
] }
```

- [ ] **Step 4: Confirm macOS still builds and tests**

Run: `cd apps/desktop/src-tauri && cargo test 2>&1 | tail -5`
Expected: `test result: ok.` for the existing tests (word_buffer ×4, keytap classify ×4).

- [ ] **Step 5: Confirm the Windows check now fails only inside `live/`**

Run: `apps/desktop/scripts/check-windows.sh 2>&1 | grep -E "^error" | head -5`
Expected: errors are `unresolved import` / `failed to resolve` for `core_graphics`, `core_foundation`, `objc2_app_kit` inside `src/live/*.rs` — nothing about `objc2` compile_error or the build script. (Task 2 removes these.)

- [ ] **Step 6: Commit**

```bash
git add apps/desktop/scripts/check-windows.sh apps/desktop/src-tauri/Cargo.toml apps/desktop/src-tauri/Cargo.lock
git commit -m "build(desktop): gate macOS crates per target, add windows crate, Windows type-check script"
```

---

### Task 2: Split `live/` into platform modules (macOS verbatim, Windows stubs)

**Files:**
- Create: `apps/desktop/src-tauri/src/live/keytap/mod.rs`, `keytap/windows.rs` (stub)
- Move: `src/live/keytap.rs` → `src/live/keytap/macos.rs`
- Create: `src/live/replacer/mod.rs`, `replacer/windows.rs` (stub)
- Move: `src/live/replacer.rs` → `src/live/replacer/macos.rs`
- Create: `src/live/guard/mod.rs`, `guard/windows.rs` (stub)
- Move: `src/live/guard.rs` → `src/live/guard/macos.rs`
- Modify: `src/live/controller.rs`, `src/lib.rs`

**Interfaces:**
- Produces (all platforms):
  - `live::keytap::{ALFAVIT_MARKER: i64, GENERATION: AtomicU64, start_tap(app: AppHandle) -> Option<TapHandle>, TapHandle::stop(self)}`
  - `live::keytap::dispatch_word(app: &AppHandle, emitted: Emitted, generation: u64)` (pub(crate))
  - `live::replacer::replace_word(typed_len: usize, reformed: &str, boundary: char)`
  - `live::guard::{is_blocked() -> bool, accessibility_granted() -> bool, open_permission_settings()}`
- Windows stubs in this task: `start_tap` → `None`, `replace_word` → no-op, `is_blocked` → `false`, `accessibility_granted` → `true`, `open_permission_settings` → no-op. Tasks 6–8 replace them.

- [ ] **Step 1: Move the three macOS files**

```bash
cd apps/desktop/src-tauri/src/live
mkdir -p keytap replacer guard
git mv keytap.rs keytap/macos.rs
git mv replacer.rs replacer/macos.rs
git mv guard.rs guard/macos.rs
```

- [ ] **Step 2: Write `keytap/mod.rs` (shared marker, generation, dispatch)**

```rust
//! Global keystroke observer. Each platform backend (`macos.rs`, `windows.rs`)
//! exposes the same `start_tap` / `TapHandle` contract; the pure pieces and the
//! finished-word dispatch live here so they are shared.
use std::sync::atomic::{AtomicU64, Ordering};

use tauri::Manager;

use crate::live::word_buffer::Emitted;

/// Marker stamped on our own synthetic events (macOS: EVENT_SOURCE_USER_DATA,
/// Windows: KEYBDINPUT.dwExtraInfo) so the observer ignores them (no feedback loop).
pub const ALFAVIT_MARKER: i64 = 0x0A1F_A710;

/// Bumped on every observed keystroke. A replacement whose captured generation
/// no longer matches is aborted: the user kept typing during the round-trip.
pub static GENERATION: AtomicU64 = AtomicU64::new(0);

pub mod win_keys;

#[cfg(target_os = "macos")]
mod macos;
#[cfg(target_os = "macos")]
pub use macos::{start_tap, TapHandle};

#[cfg(target_os = "windows")]
mod windows;
#[cfg(target_os = "windows")]
pub use windows::{start_tap, TapHandle};

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
mod unsupported {
    pub struct TapHandle;
    impl TapHandle {
        pub fn stop(self) {}
    }
    pub fn start_tap(_app: tauri::AppHandle) -> Option<TapHandle> {
        None
    }
}
#[cfg(not(any(target_os = "macos", target_os = "windows")))]
pub use unsupported::{start_tap, TapHandle};

/// A word was finished: transform via the engine and, if it changed and the
/// user has not typed since `generation`, replace it in place.
pub(crate) fn dispatch_word(app: &tauri::AppHandle, emitted: Emitted, generation: u64) {
    let app = app.clone();
    tauri::async_runtime::spawn(async move {
        let bridge = app.state::<crate::live::bridge::TransformBridge>();
        let Some(reformed) = bridge.transform(&app, emitted.word.clone()).await else {
            return;
        };
        if reformed == emitted.word {
            return; // unchanged (foreign / already reformed)
        }
        if GENERATION.load(Ordering::Relaxed) != generation {
            return; // user kept typing during the round-trip
        }
        crate::live::replacer::replace_word(emitted.typed_len, &reformed, emitted.boundary);
    });
}
```

`win_keys` is created as an empty file in this task so the module resolves; Task 3 fills it:

```bash
: > apps/desktop/src-tauri/src/live/keytap/win_keys.rs
```

- [ ] **Step 3: Adapt `keytap/macos.rs` to the shared pieces**

In `keytap/macos.rs`:
1. Delete the two shared definitions that now live in `mod.rs`: the `pub const ALFAVIT_MARKER ...` line (with its doc comment) and the `pub static GENERATION ...` line (with its doc comment).
2. Change the import at the top of the second half from `use crate::live::word_buffer::{Emitted, WordBuffer};` to `use crate::live::word_buffer::WordBuffer;` and add `use super::{dispatch_word, ALFAVIT_MARKER, GENERATION};`.
3. Delete the whole `fn on_word(app: &tauri::AppHandle, emitted: Emitted) { ... }` function.
4. In the tap callback, replace `on_word(&app, emitted);` with:

```rust
                if let Some(emitted) = buffer.borrow_mut().push(key) {
                    dispatch_word(&app, emitted, GENERATION.load(std::sync::atomic::Ordering::Relaxed));
                }
```

(The generation captured here is the value right after this key's `fetch_add`, exactly what `on_word` used to load — semantics unchanged.)

5. Remove the now-unused `use tauri::Manager;` line if the compiler reports it unused.

- [ ] **Step 4: Write `keytap/windows.rs` stub**

```rust
//! Windows observer — Task 8 replaces this stub with the WH_KEYBOARD_LL hook.
pub struct TapHandle;

impl TapHandle {
    pub fn stop(self) {}
}

pub fn start_tap(_app: tauri::AppHandle) -> Option<TapHandle> {
    None
}
```

- [ ] **Step 5: Write `replacer/mod.rs` and its Windows stub**

`replacer/mod.rs`:

```rust
//! In-place replacement of the word the user just finished. One backend per
//! platform; `win_input` is the pure replacement plan (tests run everywhere).
pub mod win_input;

#[cfg(target_os = "macos")]
mod macos;
#[cfg(target_os = "macos")]
pub use macos::replace_word;

#[cfg(target_os = "windows")]
mod windows;
#[cfg(target_os = "windows")]
pub use windows::replace_word;

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
pub fn replace_word(_typed_len: usize, _reformed: &str, _boundary: char) {}
```

Create the empty pure module for Task 4 and the stub:

```bash
: > apps/desktop/src-tauri/src/live/replacer/win_input.rs
cat > apps/desktop/src-tauri/src/live/replacer/windows.rs <<'EOF'
//! Windows replacer — Task 7 replaces this stub with a SendInput batch.
pub fn replace_word(_typed_len: usize, _reformed: &str, _boundary: char) {}
EOF
```

`replacer/macos.rs` needs no edits: `use crate::live::keytap::ALFAVIT_MARKER;` still resolves via the re-export.

- [ ] **Step 6: Write `guard/mod.rs`, extend `guard/macos.rs`, write the Windows stub**

`guard/mod.rs`:

```rust
//! Safety exclusions: never observe or rewrite in password fields or terminal
//! apps, and report/handle the OS permission the observer needs.
pub mod win_denylist;

#[cfg(target_os = "macos")]
mod macos;
#[cfg(target_os = "macos")]
pub use macos::{accessibility_granted, is_blocked, open_permission_settings};

#[cfg(target_os = "windows")]
mod windows;
#[cfg(target_os = "windows")]
pub use windows::{accessibility_granted, is_blocked, open_permission_settings};

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
mod unsupported {
    pub fn is_blocked() -> bool {
        false
    }
    pub fn accessibility_granted() -> bool {
        false
    }
    pub fn open_permission_settings() {}
}
#[cfg(not(any(target_os = "macos", target_os = "windows")))]
pub use unsupported::{accessibility_granted, is_blocked, open_permission_settings};
```

Append to `guard/macos.rs`:

```rust

/// Open the Accessibility pane so the user can grant the permission the
/// observer needs. Called only after an attempt to turn Live transform on failed.
pub fn open_permission_settings() {
    let _ = std::process::Command::new("open")
        .arg("x-apple.systempreferences:com.apple.settings.PrivacySecurity.extension?Privacy_Accessibility")
        .spawn();
}
```

Create the empty pure module for Task 5 and the Windows stub:

```bash
: > apps/desktop/src-tauri/src/live/guard/win_denylist.rs
cat > apps/desktop/src-tauri/src/live/guard/windows.rs <<'EOF'
//! Windows guard — Task 6 replaces this stub with UI Automation + foreground exe checks.

/// A low-level keyboard hook needs no permission on Windows.
pub fn accessibility_granted() -> bool {
    true
}

pub fn is_blocked() -> bool {
    false
}

/// Nothing to open: there is no permission to grant on Windows.
pub fn open_permission_settings() {}
EOF
```

- [ ] **Step 7: Use `open_permission_settings()` in `controller.rs`**

In `set_live_transform`, replace

```rust
    if on && !now_on && !guard::accessibility_granted() {
        let _ = std::process::Command::new("open")
            .arg("x-apple.systempreferences:com.apple.settings.PrivacySecurity.extension?Privacy_Accessibility")
            .spawn();
    }
```

with

```rust
    if on && !now_on && !guard::accessibility_granted() {
        guard::open_permission_settings();
    }
```

- [ ] **Step 8: Use it in `lib.rs` and gate the Dock-click arm**

In the tray menu handler's `"live_transform"` arm, replace

```rust
                        if !was_on && !now_on && !live::guard::accessibility_granted() {
                            // Needs permission: open the pane so the user can grant it.
                            let _ = std::process::Command::new("open")
                                .arg("x-apple.systempreferences:com.apple.settings.PrivacySecurity.extension?Privacy_Accessibility")
                                .spawn();
                        }
```

with

```rust
                        if !was_on && !now_on && !live::guard::accessibility_granted() {
                            // Needs permission: open the pane so the user can grant it.
                            live::guard::open_permission_settings();
                        }
```

Replace the `.run(...)` closure at the end of `run()`:

```rust
        .run(|app_handle, event| {
            // Clicking the Dock icon (macOS) reveals the panel — otherwise, since
            // the window hides on blur, a Dock click on the running app does nothing.
            // `RunEvent::Reopen` only exists on macOS; Windows has no Dock.
            #[cfg(target_os = "macos")]
            if let tauri::RunEvent::Reopen { .. } = event {
                if let Some(w) = app_handle.get_webview_window("main") {
                    let _ = w.show();
                    let _ = w.set_focus();
                }
            }
            #[cfg(not(target_os = "macos"))]
            let _ = (app_handle, event);
        });
```

- [ ] **Step 9: Verify macOS and Windows**

Run: `cd apps/desktop/src-tauri && cargo test 2>&1 | tail -5`
Expected: `test result: ok.` — same 8 tests as before (classify tests now live in `keytap::macos::tests`).

Run: `apps/desktop/scripts/check-windows.sh 2>&1 | tail -3`
Expected: `Finished` with no errors (warnings about unused imports are acceptable and should be fixed if trivial).

- [ ] **Step 10: Commit**

```bash
git add apps/desktop/src-tauri/src/live apps/desktop/src-tauri/src/lib.rs
git commit -m "refactor(desktop): split live/ into per-platform backends; Windows stubs compile"
```

---

### Task 3: Pure Windows key classification (`win_keys.rs`)

**Files:**
- Modify: `apps/desktop/src-tauri/src/live/keytap/win_keys.rs`

**Interfaces:**
- Produces:
  - `pub struct Modifiers { pub ctrl: bool, pub alt: bool, pub win: bool }` (Copy, Default)
  - `pub fn classify(vk: u32, mods: Modifiers, text: &str) -> Key`
  - `pub fn keystroke_text(n: i32, buf: &[u16], dead_pending: &mut bool) -> String` — turns a `ToUnicodeEx` result into the typed text, handling dead keys
  - `pub const VK_BACK: u32` etc. (used by tests and Task 8)

Rules (from spec §2): Win, or Ctrl-xor-Alt, is a shortcut → `Reset`. Ctrl+Alt together is AltGr → text. `VK_BACK` → `Backspace`. Enter/Tab/Esc, PageUp…Down arrows (0x21..=0x28), Insert, Delete → `Reset`. One printable char → `Char`, space or `.,!?;:` → `Boundary`, else `Reset`. A dead key (ToUnicodeEx returns −1) yields no text and poisons the next key, whose composed character we cannot know.

- [ ] **Step 1: Write the failing tests**

Write `apps/desktop/src-tauri/src/live/keytap/win_keys.rs` with only the test module for now:

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use crate::live::word_buffer::Key;

    const NONE: Modifiers = Modifiers { ctrl: false, alt: false, win: false };
    const CTRL: Modifiers = Modifiers { ctrl: true, alt: false, win: false };
    const ALT: Modifiers = Modifiers { ctrl: false, alt: true, win: false };
    const ALTGR: Modifiers = Modifiers { ctrl: true, alt: true, win: false };
    const WIN: Modifiers = Modifiers { ctrl: false, alt: false, win: true };

    #[test]
    fn shortcuts_reset() {
        assert_eq!(classify(0x43, CTRL, "c"), Key::Reset); // Ctrl+C
        assert_eq!(classify(0x46, ALT, "f"), Key::Reset); // Alt+F (menu)
        assert_eq!(classify(0x41, WIN, "a"), Key::Reset); // Win+A
        assert_eq!(classify(0x41, Modifiers { ctrl: false, alt: true, win: false }, "A"), Key::Reset); // Alt+Shift+A hotkey
    }

    #[test]
    fn altgr_is_text() {
        assert_eq!(classify(0x51, ALTGR, "@"), Key::Char('@'));
    }

    #[test]
    fn special_keys() {
        assert_eq!(classify(VK_BACK, NONE, "\u{8}"), Key::Backspace);
        assert_eq!(classify(VK_RETURN, NONE, "\r"), Key::Reset);
        assert_eq!(classify(VK_TAB, NONE, "\t"), Key::Reset);
        assert_eq!(classify(VK_ESCAPE, NONE, "\u{1b}"), Key::Reset);
        assert_eq!(classify(VK_LEFT, NONE, ""), Key::Reset);
        assert_eq!(classify(VK_HOME, NONE, ""), Key::Reset);
        assert_eq!(classify(VK_DELETE, NONE, ""), Key::Reset);
    }

    #[test]
    fn boundary_and_char() {
        assert_eq!(classify(0x20, NONE, " "), Key::Boundary(' '));
        assert_eq!(classify(0xBE, NONE, "."), Key::Boundary('.'));
        assert_eq!(classify(0x53, NONE, "s"), Key::Char('s'));
        assert_eq!(classify(0x58, NONE, "ч"), Key::Char('ч')); // Cyrillic layout
    }

    #[test]
    fn empty_or_multichar_text_resets() {
        assert_eq!(classify(0x41, NONE, ""), Key::Reset);
        assert_eq!(classify(0x41, NONE, "ab"), Key::Reset);
    }

    #[test]
    fn keystroke_text_reads_utf16_prefix() {
        let mut dead = false;
        let buf = ['ş' as u16, 0, 0, 0];
        assert_eq!(keystroke_text(1, &buf, &mut dead), "ş");
        assert!(!dead);
        assert_eq!(keystroke_text(0, &buf, &mut dead), "");
    }

    #[test]
    fn dead_key_poisons_the_next_key_only() {
        let mut dead = false;
        let buf = ['a' as u16, 0, 0, 0];
        assert_eq!(keystroke_text(-1, &buf, &mut dead), ""); // dead key itself
        assert!(dead);
        assert_eq!(keystroke_text(1, &buf, &mut dead), ""); // composed char unknown → no text
        assert!(!dead);
        assert_eq!(keystroke_text(1, &buf, &mut dead), "a"); // back to normal
    }
}
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd apps/desktop/src-tauri && cargo test win_keys 2>&1 | grep -E "^error" | head -3`
Expected: errors about `Modifiers`, `classify`, `keystroke_text`, `VK_BACK` not found.

- [ ] **Step 3: Implement above the test module**

Prepend to `win_keys.rs`:

```rust
//! Windows virtual-key → `Key` mapping. Pure and platform-independent so the
//! tests run on every host; the hook (`windows.rs`) feeds it real events.
use crate::live::word_buffer::Key;

pub const VK_BACK: u32 = 0x08;
pub const VK_TAB: u32 = 0x09;
pub const VK_RETURN: u32 = 0x0D;
pub const VK_ESCAPE: u32 = 0x1B;
pub const VK_PRIOR: u32 = 0x21; // Page Up
pub const VK_DOWN: u32 = 0x28; // Down arrow; 0x21..=0x28 is PgUp, PgDn, End, Home, ←, ↑, →, ↓
pub const VK_HOME: u32 = 0x24;
pub const VK_LEFT: u32 = 0x25;
pub const VK_INSERT: u32 = 0x2D;
pub const VK_DELETE: u32 = 0x2E;

/// Modifier state at the moment of the keystroke (Shift is folded into the
/// text by `ToUnicodeEx`, so it is not needed here).
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct Modifiers {
    pub ctrl: bool,
    pub alt: bool,
    pub win: bool,
}

/// Win, or exactly one of Ctrl/Alt, means a shortcut or menu accelerator.
/// Ctrl+Alt together is AltGr, which types characters on many layouts.
fn is_shortcut(m: Modifiers) -> bool {
    m.win || (m.ctrl != m.alt)
}

/// Map a raw Windows key event to an abstract `Key`.
pub fn classify(vk: u32, mods: Modifiers, text: &str) -> Key {
    if is_shortcut(mods) {
        return Key::Reset;
    }
    match vk {
        VK_BACK => return Key::Backspace,
        VK_RETURN | VK_TAB | VK_ESCAPE => return Key::Reset,
        VK_PRIOR..=VK_DOWN => return Key::Reset, // navigation cluster + arrows
        VK_INSERT | VK_DELETE => return Key::Reset,
        _ => {}
    }
    let mut chars = text.chars();
    match (chars.next(), chars.next()) {
        (Some(c), None) => {
            if c == ' ' || ".,!?;:".contains(c) {
                Key::Boundary(c)
            } else if c.is_control() {
                Key::Reset
            } else {
                Key::Char(c)
            }
        }
        _ => Key::Reset, // empty or multi-char string
    }
}

/// The text a keystroke produced, given `ToUnicodeEx`'s return value `n` and
/// its buffer. A dead key (`n < 0`) produces nothing and poisons the next key:
/// we do not track composition, so that key's real character is unknown and it
/// must not be buffered as a plain letter.
pub fn keystroke_text(n: i32, buf: &[u16], dead_pending: &mut bool) -> String {
    if n < 0 {
        *dead_pending = true;
        return String::new();
    }
    if *dead_pending {
        *dead_pending = false;
        return String::new();
    }
    let n = (n as usize).min(buf.len());
    String::from_utf16_lossy(&buf[..n])
}
```

- [ ] **Step 4: Run tests on macOS and type-check for Windows**

Run: `cd apps/desktop/src-tauri && cargo test win_keys 2>&1 | tail -3`
Expected: `test result: ok. 7 passed`.

Run: `apps/desktop/scripts/check-windows.sh 2>&1 | tail -2`
Expected: `Finished`.

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/src-tauri/src/live/keytap/win_keys.rs
git commit -m "feat(desktop): pure Windows key classification with dead-key handling"
```

---

### Task 4: Pure replacement plan (`win_input.rs`)

**Files:**
- Modify: `apps/desktop/src-tauri/src/live/replacer/win_input.rs`

**Interfaces:**
- Produces:
  - `pub enum Stroke { BackspaceDown, BackspaceUp, UnicodeDown(u16), UnicodeUp(u16) }`
  - `pub fn plan_replacement(typed_len: usize, reformed: &str, boundary: char) -> Vec<Stroke>`

- [ ] **Step 1: Write the failing tests**

```rust
#[cfg(test)]
mod tests {
    use super::*;

    fn backspaces(plan: &[Stroke]) -> usize {
        plan.iter().filter(|s| matches!(s, Stroke::BackspaceDown)).count()
    }

    fn typed(plan: &[Stroke]) -> String {
        let units: Vec<u16> = plan
            .iter()
            .filter_map(|s| match s {
                Stroke::UnicodeDown(u) => Some(*u),
                _ => None,
            })
            .collect();
        String::from_utf16(&units).unwrap()
    }

    #[test]
    fn deletes_word_plus_boundary_then_types_reformed_plus_boundary() {
        let plan = plan_replacement(6, "şahar", ' ');
        assert_eq!(backspaces(&plan), 7); // "shahar" + the space
        assert_eq!(typed(&plan), "şahar ");
    }

    #[test]
    fn counts_typed_chars_not_bytes() {
        let plan = plan_replacement(3, "çoy", '.'); // "чой" is 3 chars, 6 bytes
        assert_eq!(backspaces(&plan), 4);
        assert_eq!(typed(&plan), "çoy.");
    }

    #[test]
    fn every_down_has_a_matching_up_in_order() {
        let plan = plan_replacement(1, "ö", ',');
        assert_eq!(
            plan,
            vec![
                Stroke::BackspaceDown,
                Stroke::BackspaceUp,
                Stroke::BackspaceDown,
                Stroke::BackspaceUp,
                Stroke::UnicodeDown('ö' as u16),
                Stroke::UnicodeUp('ö' as u16),
                Stroke::UnicodeDown(',' as u16),
                Stroke::UnicodeUp(',' as u16),
            ]
        );
    }
}
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd apps/desktop/src-tauri && cargo test win_input 2>&1 | grep -E "^error" | head -3`
Expected: `Stroke` / `plan_replacement` not found.

- [ ] **Step 3: Implement above the tests**

```rust
//! The keystroke sequence that replaces a finished word, independent of the
//! OS input API. `windows.rs` turns it into one `SendInput` batch.

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Stroke {
    BackspaceDown,
    BackspaceUp,
    /// One UTF-16 code unit typed as a Unicode key event.
    UnicodeDown(u16),
    UnicodeUp(u16),
}

/// Backspace over the typed word and the boundary character, then type the
/// reformed word followed by the same boundary character.
pub fn plan_replacement(typed_len: usize, reformed: &str, boundary: char) -> Vec<Stroke> {
    let mut text = String::from(reformed);
    text.push(boundary);
    let mut plan = Vec::with_capacity((typed_len + 1) * 2 + text.len() * 2);
    for _ in 0..(typed_len + 1) {
        plan.push(Stroke::BackspaceDown);
        plan.push(Stroke::BackspaceUp);
    }
    for unit in text.encode_utf16() {
        plan.push(Stroke::UnicodeDown(unit));
        plan.push(Stroke::UnicodeUp(unit));
    }
    plan
}
```

- [ ] **Step 4: Run tests and the Windows check**

Run: `cd apps/desktop/src-tauri && cargo test win_input 2>&1 | tail -3` → `3 passed`.
Run: `apps/desktop/scripts/check-windows.sh 2>&1 | tail -2` → `Finished`.

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/src-tauri/src/live/replacer/win_input.rs
git commit -m "feat(desktop): pure replacement plan for the Windows replacer"
```

---

### Task 5: Pure terminal denylist (`win_denylist.rs`)

**Files:**
- Modify: `apps/desktop/src-tauri/src/live/guard/win_denylist.rs`

**Interfaces:**
- Produces: `pub fn is_denylisted(image_path: &str) -> bool` — accepts a full image path or a bare file name; compares the file name case-insensitively.

- [ ] **Step 1: Write the failing tests**

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn matches_terminals_by_file_name_case_insensitively() {
        assert!(is_denylisted(r"C:\Program Files\WindowsApps\Microsoft.WindowsTerminal_1.x\WindowsTerminal.exe"));
        assert!(is_denylisted(r"C:\WINDOWS\system32\cmd.exe"));
        assert!(is_denylisted("POWERSHELL.EXE"));
        assert!(is_denylisted(r"C:\Program Files\PowerShell\7\pwsh.exe"));
        assert!(is_denylisted(r"C:\Program Files\WezTerm\wezterm-gui.exe"));
    }

    #[test]
    fn everything_else_passes() {
        assert!(!is_denylisted(r"C:\Windows\System32\notepad.exe"));
        assert!(!is_denylisted(r"C:\Program Files\Microsoft Office\root\Office16\WINWORD.EXE"));
        assert!(!is_denylisted(r"C:\Program Files\Google\Chrome\Application\chrome.exe"));
        assert!(!is_denylisted(""));
    }
}
```

- [ ] **Step 2: Run to verify failure**

Run: `cd apps/desktop/src-tauri && cargo test win_denylist 2>&1 | grep -E "^error" | head -2`
Expected: `is_denylisted` not found.

- [ ] **Step 3: Implement above the tests**

```rust
//! Apps where auto-transform is disabled: terminals take raw input and mangle
//! synthetic backspaces. Matched on the executable file name.

const DENYLIST: &[&str] = &[
    "windowsterminal.exe",
    "cmd.exe",
    "powershell.exe",
    "pwsh.exe",
    "conhost.exe",
    "mintty.exe",
    "alacritty.exe",
    "wezterm-gui.exe",
];

/// True when `image_path` (full path or bare file name) is a denylisted app.
pub fn is_denylisted(image_path: &str) -> bool {
    let name = image_path
        .rsplit(['\\', '/'])
        .next()
        .unwrap_or(image_path)
        .to_ascii_lowercase();
    DENYLIST.contains(&name.as_str())
}
```

- [ ] **Step 4: Run tests and the Windows check**

Run: `cd apps/desktop/src-tauri && cargo test win_denylist 2>&1 | tail -3` → `2 passed`.
Run: `apps/desktop/scripts/check-windows.sh 2>&1 | tail -2` → `Finished`.

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/src-tauri/src/live/guard/win_denylist.rs
git commit -m "feat(desktop): Windows terminal denylist"
```

---

### Task 6: Windows guard (UI Automation password check + foreground exe)

**Files:**
- Modify: `apps/desktop/src-tauri/src/live/guard/windows.rs` (replace stub)

**Interfaces:**
- Consumes: `super::win_denylist::is_denylisted(&str)`
- Produces: `is_blocked() -> bool`, `accessibility_granted() -> bool` (always `true`), `open_permission_settings()` (no-op). `is_blocked` is called only on the observer's worker thread (Task 8), which is a plain `std::thread`, so COM is initialised there.

Cannot run here; verified by type-check now and by the tester's "password field untouched / Windows Terminal untouched" checklist items.

- [ ] **Step 1: Replace the stub**

```rust
//! Windows guard. Windows has no system-wide "secure input" flag, so the
//! password check is best-effort via UI Automation: browsers, Win32 EDIT
//! controls with ES_PASSWORD and WinUI PasswordBox all report `IsPassword`.
//! Terminal apps are excluded by executable name.
use std::cell::RefCell;

use windows::core::{BOOL, PWSTR};
use windows::Win32::Foundation::{CloseHandle, HWND};
use windows::Win32::System::Com::{
    CoCreateInstance, CoInitializeEx, CLSCTX_INPROC_SERVER, COINIT_MULTITHREADED,
};
use windows::Win32::System::Threading::{
    OpenProcess, QueryFullProcessImageNameW, PROCESS_NAME_WIN32, PROCESS_QUERY_LIMITED_INFORMATION,
};
use windows::Win32::UI::Accessibility::{CUIAutomation, IUIAutomation};
use windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, GetWindowThreadProcessId};

use super::win_denylist::is_denylisted;

thread_local! {
    /// One UI Automation client per thread: COM objects are apartment-bound,
    /// and `is_blocked` only ever runs on the observer's worker thread.
    static UIA: RefCell<Option<IUIAutomation>> = const { RefCell::new(None) };
}

fn uia() -> Option<IUIAutomation> {
    UIA.with(|slot| {
        if slot.borrow().is_none() {
            // SAFETY: plain COM initialisation/creation; failure leaves the slot
            // empty and the guard degrades to "not a password field".
            unsafe {
                // Already-initialised (S_FALSE) and mode-mismatch results still leave
                // COM usable on this thread, so the HRESULT is deliberately ignored.
                let _ = CoInitializeEx(None, COINIT_MULTITHREADED);
                if let Ok(a) = CoCreateInstance::<_, IUIAutomation>(&CUIAutomation, None, CLSCTX_INPROC_SERVER) {
                    *slot.borrow_mut() = Some(a);
                }
            }
        }
        slot.borrow().clone()
    })
}

/// Best-effort: true when the focused UI element reports itself as a password field.
pub fn is_secure_input() -> bool {
    let Some(uia) = uia() else { return false };
    // SAFETY: COM calls on an interface owned by this thread.
    unsafe {
        match uia.GetFocusedElement() {
            Ok(el) => el.CurrentIsPassword().map(|b: BOOL| b.as_bool()).unwrap_or(false),
            Err(_) => false,
        }
    }
}

/// Full image path of the foreground window's process, if readable.
pub fn frontmost_exe() -> Option<String> {
    // SAFETY: Win32 calls with valid, locally owned buffers; the handle is closed.
    unsafe {
        let hwnd: HWND = GetForegroundWindow();
        if hwnd.0.is_null() {
            return None;
        }
        let mut pid = 0u32;
        GetWindowThreadProcessId(hwnd, Some(&mut pid));
        if pid == 0 {
            return None;
        }
        let handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid).ok()?;
        let mut buf = [0u16; 1024];
        let mut len = buf.len() as u32;
        let result = QueryFullProcessImageNameW(handle, PROCESS_NAME_WIN32, PWSTR(buf.as_mut_ptr()), &mut len);
        let _ = CloseHandle(handle);
        result.ok()?;
        Some(String::from_utf16_lossy(&buf[..len as usize]))
    }
}

/// True when the current context must not be observed or transformed.
pub fn is_blocked() -> bool {
    if is_secure_input() {
        return true;
    }
    frontmost_exe().map(|path| is_denylisted(&path)).unwrap_or(false)
}

/// A low-level keyboard hook needs no permission on Windows.
pub fn accessibility_granted() -> bool {
    true
}

/// Nothing to open: there is no permission to grant on Windows.
pub fn open_permission_settings() {}
```

- [ ] **Step 2: Type-check for Windows and re-run macOS tests**

Run: `apps/desktop/scripts/check-windows.sh 2>&1 | tail -3` → `Finished`, no errors. If `const { RefCell::new(None) }` is rejected by the toolchain, drop the `const { }` wrapper.
Run: `cd apps/desktop/src-tauri && cargo test 2>&1 | tail -3` → all pass (macOS untouched).

- [ ] **Step 3: Commit**

```bash
git add apps/desktop/src-tauri/src/live/guard/windows.rs
git commit -m "feat(desktop): Windows guard — UI Automation password check, terminal denylist"
```

---

### Task 7: Windows replacer (`SendInput` batch)

**Files:**
- Modify: `apps/desktop/src-tauri/src/live/replacer/windows.rs` (replace stub)

**Interfaces:**
- Consumes: `super::win_input::{plan_replacement, Stroke}`, `crate::live::keytap::ALFAVIT_MARKER`
- Produces: `replace_word(typed_len: usize, reformed: &str, boundary: char)`

- [ ] **Step 1: Replace the stub**

```rust
//! Windows replacer: the whole edit goes out as ONE `SendInput` batch, which
//! lands atomically in the input queue (tighter than macOS's per-event posting).
use windows::Win32::UI::Input::KeyboardAndMouse::{
    MapVirtualKeyW, SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT, KEYBD_EVENT_FLAGS,
    KEYEVENTF_KEYUP, KEYEVENTF_UNICODE, MAPVK_VK_TO_VSC, VIRTUAL_KEY, VK_BACK,
};

use super::win_input::{plan_replacement, Stroke};
use crate::live::keytap::ALFAVIT_MARKER;

fn key(vk: VIRTUAL_KEY, scan: u16, flags: KEYBD_EVENT_FLAGS) -> INPUT {
    INPUT {
        r#type: INPUT_KEYBOARD,
        Anonymous: INPUT_0 {
            ki: KEYBDINPUT {
                wVk: vk,
                wScan: scan,
                dwFlags: flags,
                time: 0,
                // Stamp so our own hook ignores these events (no feedback loop).
                dwExtraInfo: ALFAVIT_MARKER as usize,
            },
        },
    }
}

/// Delete the word the user just finished (plus the boundary char they typed)
/// and type the reformed word followed by the same boundary char.
pub fn replace_word(typed_len: usize, reformed: &str, boundary: char) {
    // SAFETY: MapVirtualKeyW has no preconditions.
    let back_scan = unsafe { MapVirtualKeyW(VK_BACK.0 as u32, MAPVK_VK_TO_VSC) } as u16;
    let inputs: Vec<INPUT> = plan_replacement(typed_len, reformed, boundary)
        .into_iter()
        .map(|stroke| match stroke {
            Stroke::BackspaceDown => key(VK_BACK, back_scan, KEYBD_EVENT_FLAGS::default()),
            Stroke::BackspaceUp => key(VK_BACK, back_scan, KEYEVENTF_KEYUP),
            Stroke::UnicodeDown(u) => key(VIRTUAL_KEY(0), u, KEYEVENTF_UNICODE),
            Stroke::UnicodeUp(u) => key(VIRTUAL_KEY(0), u, KEYEVENTF_UNICODE | KEYEVENTF_KEYUP),
        })
        .collect();
    // A short count means the target window is elevated (UIPI blocks input from
    // a normal-privilege process). Nothing to retry: the word stays as typed.
    // SAFETY: `inputs` is a valid slice of correctly sized INPUT structs.
    let _sent = unsafe { SendInput(&inputs, std::mem::size_of::<INPUT>() as i32) };
}
```

- [ ] **Step 2: Type-check for Windows**

Run: `apps/desktop/scripts/check-windows.sh 2>&1 | tail -3` → `Finished`.

- [ ] **Step 3: Commit**

```bash
git add apps/desktop/src-tauri/src/live/replacer/windows.rs
git commit -m "feat(desktop): Windows replacer — one SendInput batch per word"
```

---

### Task 8: Windows observer (`WH_KEYBOARD_LL` hook thread + worker)

**Files:**
- Modify: `apps/desktop/src-tauri/src/live/keytap/windows.rs` (replace stub)

**Interfaces:**
- Consumes: `super::win_keys::{classify, keystroke_text, Modifiers}`, `super::{dispatch_word, ALFAVIT_MARKER, GENERATION}`, `crate::live::guard::is_blocked`, `crate::live::word_buffer::WordBuffer`
- Produces: `pub fn start_tap(app: tauri::AppHandle) -> Option<TapHandle>`, `TapHandle::stop(self)` — same contract `controller.rs` already uses.

Design points to preserve:
- The hook callback only: skips our own events, reads modifiers, calls `ToUnicodeEx` with the "don't change keyboard state" flag, bumps `GENERATION`, enqueues. It never touches COM or the buffer (Windows silently removes slow hooks).
- The generation is captured **in the callback** and travels with the event, so a later key aborts a replacement even if the worker is behind.
- The worker mirrors macOS exactly: a blocked key is skipped (buffer untouched), otherwise classify → push → dispatch.

- [ ] **Step 1: Replace the stub**

```rust
//! Windows observer: a WH_KEYBOARD_LL hook on its own message-loop thread
//! enqueues keystrokes; a worker thread runs the guard, classifies, buffers
//! words and dispatches them (bridge → engine → replacer).
use std::cell::Cell;
use std::sync::atomic::Ordering;
use std::sync::{mpsc, Mutex};
use std::thread::JoinHandle;

use windows::Win32::Foundation::{LPARAM, LRESULT, WPARAM};
use windows::Win32::System::LibraryLoader::GetModuleHandleW;
use windows::Win32::System::Threading::GetCurrentThreadId;
use windows::Win32::UI::Input::KeyboardAndMouse::{
    GetAsyncKeyState, GetKeyState, GetKeyboardLayout, ToUnicodeEx, VIRTUAL_KEY, VK_CAPITAL, VK_CONTROL,
    VK_LWIN, VK_MENU, VK_RWIN, VK_SHIFT,
};
use windows::Win32::UI::WindowsAndMessaging::{
    CallNextHookEx, GetForegroundWindow, GetMessageW, GetWindowThreadProcessId, PostThreadMessageW,
    SetWindowsHookExW, UnhookWindowsHookEx, HC_ACTION, KBDLLHOOKSTRUCT, LLKHF_INJECTED, MSG,
    WH_KEYBOARD_LL, WM_KEYDOWN, WM_QUIT, WM_SYSKEYDOWN,
};

use super::win_keys::{classify, keystroke_text, Modifiers};
use super::{dispatch_word, ALFAVIT_MARKER, GENERATION};
use crate::live::word_buffer::WordBuffer;

/// One observed keystroke, captured in the hook callback, processed on the worker.
struct Observed {
    vk: u32,
    mods: Modifiers,
    text: String,
    /// GENERATION right after this key's bump — a replacement for the word this
    /// key finished is only valid while GENERATION still equals it.
    generation: u64,
}

/// The hook callback gets no user-data pointer, so the channel lives in a global.
static SENDER: Mutex<Option<mpsc::Sender<Observed>>> = Mutex::new(None);

thread_local! {
    /// Dead-key state; the callback only runs on the hook thread.
    static DEAD_PENDING: Cell<bool> = const { Cell::new(false) };
}

/// Handle to a running observer. `stop()` ends both threads and joins them.
pub struct TapHandle {
    hook_thread_id: u32,
    hook: Option<JoinHandle<()>>,
    worker: Option<JoinHandle<()>>,
}

impl TapHandle {
    pub fn stop(mut self) {
        // SAFETY: posting a message to a thread id we own; failure just means it already exited.
        unsafe {
            let _ = PostThreadMessageW(self.hook_thread_id, WM_QUIT, WPARAM(0), LPARAM(0));
        }
        if let Some(t) = self.hook.take() {
            let _ = t.join();
        }
        // Dropping the sender ends the worker's `for ev in rx` loop.
        *SENDER.lock().unwrap() = None;
        if let Some(t) = self.worker.take() {
            let _ = t.join();
        }
    }
}

fn key_down(vk: VIRTUAL_KEY) -> bool {
    // SAFETY: GetAsyncKeyState has no preconditions.
    (unsafe { GetAsyncKeyState(vk.0 as i32) } as u16 & 0x8000) != 0
}

/// Hook-thread side: translate and enqueue. Kept minimal — Windows removes a
/// low-level hook whose callback is slow.
fn observe(kb: &KBDLLHOOKSTRUCT) {
    let mods = Modifiers {
        ctrl: key_down(VK_CONTROL),
        alt: key_down(VK_MENU),
        win: key_down(VK_LWIN) || key_down(VK_RWIN),
    };
    let mut state = [0u8; 256];
    if key_down(VK_SHIFT) {
        state[VK_SHIFT.0 as usize] = 0x80;
    }
    if mods.ctrl && mods.alt {
        // AltGr: let the layout produce its third-level character.
        state[VK_CONTROL.0 as usize] = 0x80;
        state[VK_MENU.0 as usize] = 0x80;
    }
    // SAFETY: plain Win32 queries; `state`/`buf` are valid local buffers.
    let text = unsafe {
        if (GetKeyState(VK_CAPITAL.0 as i32) & 1) != 0 {
            state[VK_CAPITAL.0 as usize] = 0x01;
        }
        // The foreground app's layout, not ours — the user may have several.
        let layout = GetKeyboardLayout(GetWindowThreadProcessId(GetForegroundWindow(), None));
        let mut buf = [0u16; 8];
        // Flag bit 2: do not change the kernel's dead-key state (Windows 10 1607+).
        let n = ToUnicodeEx(kb.vkCode, kb.scanCode, &state, &mut buf, 1 << 2, Some(layout));
        DEAD_PENDING.with(|dead| {
            let mut pending = dead.get();
            let text = keystroke_text(n, &buf, &mut pending);
            dead.set(pending);
            text
        })
    };
    // Bump on EVERY observed key and carry the value with the event: any later
    // key must abort a replacement planned for this one, even if the worker lags.
    let generation = GENERATION.fetch_add(1, Ordering::Relaxed) + 1;
    if let Some(tx) = SENDER.lock().unwrap().as_ref() {
        let _ = tx.send(Observed { vk: kb.vkCode, mods, text, generation });
    }
}

unsafe extern "system" fn hook_proc(ncode: i32, wparam: WPARAM, lparam: LPARAM) -> LRESULT {
    if ncode == HC_ACTION as i32 {
        let msg = wparam.0 as u32;
        if msg == WM_KEYDOWN || msg == WM_SYSKEYDOWN {
            // SAFETY: for WH_KEYBOARD_LL, lparam points to a KBDLLHOOKSTRUCT for the callback's duration.
            let kb = unsafe { &*(lparam.0 as *const KBDLLHOOKSTRUCT) };
            // Ignore only OUR synthetic events (marker). Other tools' injected input
            // (AutoHotkey remaps, remote desktop) still counts as typing, as on macOS.
            let ours = (kb.flags.0 & LLKHF_INJECTED.0) != 0 && kb.dwExtraInfo == ALFAVIT_MARKER as usize;
            if !ours {
                observe(kb);
            }
        }
    }
    unsafe { CallNextHookEx(None, ncode, wparam, lparam) }
}

/// Worker-thread side: guard → classify → buffer → dispatch, in arrival order.
fn worker(app: tauri::AppHandle, rx: mpsc::Receiver<Observed>) {
    let mut buffer = WordBuffer::new();
    for ev in rx {
        // Never observe/transform in password fields or excluded apps (buffer untouched, as on macOS).
        if crate::live::guard::is_blocked() {
            continue;
        }
        let key = classify(ev.vk, ev.mods, &ev.text);
        if let Some(emitted) = buffer.push(key) {
            dispatch_word(&app, emitted, ev.generation);
        }
    }
}

/// Spawn the observer: install the hook on a message-loop thread and start the
/// worker. Returns None if the hook could not be installed.
pub fn start_tap(app: tauri::AppHandle) -> Option<TapHandle> {
    let (tx, rx) = mpsc::channel::<Observed>();
    let (ready_tx, ready_rx) = mpsc::channel::<u32>();
    *SENDER.lock().unwrap() = Some(tx);
    DEAD_PENDING.with(|d| d.set(false));

    let hook = std::thread::spawn(move || {
        // SAFETY: standard hook installation + message loop on this thread; the
        // hook is removed before the thread exits.
        unsafe {
            let Ok(hmod) = GetModuleHandleW(None) else { return };
            let Ok(hhook) = SetWindowsHookExW(WH_KEYBOARD_LL, Some(hook_proc), Some(hmod.into()), 0) else {
                return;
            };
            let _ = ready_tx.send(GetCurrentThreadId());
            let mut msg = MSG::default();
            // Runs the hook until stop() posts WM_QUIT.
            while GetMessageW(&mut msg, None, 0, 0).as_bool() {}
            let _ = UnhookWindowsHookEx(hhook);
        }
    });

    // If the thread exited before sending (hook install failed), the dropped
    // sender makes recv() Err — report None instead of panicking the caller.
    let Ok(hook_thread_id) = ready_rx.recv() else {
        let _ = hook.join();
        *SENDER.lock().unwrap() = None;
        return None;
    };
    let worker = std::thread::spawn(move || worker(app, rx));
    Some(TapHandle { hook_thread_id, hook: Some(hook), worker: Some(worker) })
}
```

- [ ] **Step 2: Type-check for Windows; run macOS tests**

Run: `apps/desktop/scripts/check-windows.sh 2>&1 | tail -5` → `Finished`, no errors. If `const { Cell::new(false) }` is rejected, drop the `const { }` wrapper.
Run: `cd apps/desktop/src-tauri && cargo test 2>&1 | tail -3` → all pass.

- [ ] **Step 3: Commit**

```bash
git add apps/desktop/src-tauri/src/live/keytap/windows.rs
git commit -m "feat(desktop): Windows observer — low-level keyboard hook + worker thread"
```

---

### Task 9: Windows tray-click / blur ordering guard (+ spec correction)

**Files:**
- Modify: `apps/desktop/src-tauri/src/lib.rs`
- Modify: `docs/specs/2026-09-11-desktop-windows-design.md` (the "Tray-click blur race" bullet)

**Interfaces:**
- Produces (in `lib.rs`): `mod tray_blur { pub const GRACE_MS: u64; pub fn swallowed(now_ms: u64, hidden_ms: u64) -> bool; pub fn note_hidden(); pub fn click_follows_blur() -> bool }`

Why: on Windows the tray belongs to Explorer, so clicking the icon **first** blurs the panel — the `Focused(false)` handler hides it — and **then** the click's toggle would show it again, so the panel could never be closed from the tray. On macOS the status item belongs to our app and no blur occurs, which is why the Mac has no such problem. Fix: remember when a blur hid the panel; a tray click within 250 ms of that is the same gesture and is a no-op.

- [ ] **Step 1: Write the failing test (pure predicate) in `lib.rs`**

Add at the bottom of `lib.rs`:

```rust
#[cfg(test)]
mod tray_blur_tests {
    use super::tray_blur::{swallowed, GRACE_MS};

    #[test]
    fn click_right_after_blur_hide_is_swallowed() {
        assert!(swallowed(1_000, 900));
        assert!(swallowed(1_000, 1_000 - GRACE_MS + 1));
    }

    #[test]
    fn click_after_the_grace_window_toggles() {
        assert!(!swallowed(1_000, 1_000 - GRACE_MS));
        assert!(!swallowed(5_000, 0));
    }

    #[test]
    fn clock_going_backwards_does_not_underflow() {
        assert!(swallowed(100, 200));
    }
}
```

- [ ] **Step 2: Run to verify failure**

Run: `cd apps/desktop/src-tauri && cargo test tray_blur 2>&1 | grep -E "^error" | head -2`
Expected: `tray_blur` module not found.

- [ ] **Step 3: Add the module and wire it (Windows call sites only)**

Add above `fn toggle_panel` in `lib.rs`:

```rust
/// Windows only: clicking the tray icon blurs the panel first (Explorer owns the
/// tray), so the `Focused(false)` handler hides it before the click's toggle
/// runs — which would immediately re-show it. Remember when a blur hid the
/// panel; a tray click inside the grace window is the same gesture: no toggle.
/// The predicate is pure and tested everywhere; only the call sites are Windows-only.
#[allow(dead_code)]
mod tray_blur {
    use std::sync::atomic::{AtomicU64, Ordering};
    use std::time::{SystemTime, UNIX_EPOCH};

    pub const GRACE_MS: u64 = 250;
    static HIDDEN_BY_BLUR_MS: AtomicU64 = AtomicU64::new(0);

    fn now_ms() -> u64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_millis() as u64)
            .unwrap_or(0)
    }

    /// True when a click at `now_ms` follows a blur-hide at `hidden_ms` closely
    /// enough to be the same gesture.
    pub fn swallowed(now_ms: u64, hidden_ms: u64) -> bool {
        now_ms.saturating_sub(hidden_ms) < GRACE_MS
    }

    pub fn note_hidden() {
        HIDDEN_BY_BLUR_MS.store(now_ms(), Ordering::Relaxed);
    }

    pub fn click_follows_blur() -> bool {
        swallowed(now_ms(), HIDDEN_BY_BLUR_MS.load(Ordering::Relaxed))
    }
}
```

In the tray icon event handler, replace

```rust
                        if let Some(w) = tray.app_handle().get_webview_window("main") {
                            toggle_panel(&w);
                        }
```

with

```rust
                        // Windows: the click's own blur already hid the panel — done.
                        #[cfg(target_os = "windows")]
                        if tray_blur::click_follows_blur() {
                            return;
                        }
                        if let Some(w) = tray.app_handle().get_webview_window("main") {
                            toggle_panel(&w);
                        }
```

In `on_window_event`, replace

```rust
            if let tauri::WindowEvent::Focused(false) = event {
                let _ = window.hide();
            }
```

with

```rust
            if let tauri::WindowEvent::Focused(false) = event {
                let _ = window.hide();
                #[cfg(target_os = "windows")]
                tray_blur::note_hidden();
            }
```

- [ ] **Step 4: Run tests on macOS and the Windows check**

Run: `cd apps/desktop/src-tauri && cargo test 2>&1 | tail -3` → all pass, including 3 `tray_blur_tests`.
Run: `apps/desktop/scripts/check-windows.sh 2>&1 | tail -2` → `Finished`.

- [ ] **Step 5: Correct the spec paragraph**

In `docs/specs/2026-09-11-desktop-windows-design.md`, replace the "**Tray-click blur race.**" bullet with:

```markdown
- **Tray-click blur race.** On Windows the tray belongs to Explorer, so
  clicking the icon blurs the panel *first*: the `Focused(false)` handler
  hides it, and the click's toggle that follows would show it again — the
  panel could never be closed from the tray. The blur handler records when
  it hid the panel; a tray click arriving within 250 ms of that is the same
  gesture and does not toggle. Gated to Windows (`#[cfg(target_os =
  "windows")]`) so macOS, where the status item belongs to our app and no
  blur occurs, is untouched.
```

- [ ] **Step 6: Commit**

```bash
git add apps/desktop/src-tauri/src/lib.rs docs/specs/2026-09-11-desktop-windows-design.md
git commit -m "fix(desktop): Windows tray click no longer re-shows the panel its own blur just hid"
```

---

### Task 10: Platform-aware permission hint in the panel

**Files:**
- Create: `apps/desktop/src/platform.ts`
- Modify: `apps/desktop/src/LiveToggle.tsx`, `apps/desktop/src/LiveToggle.test.tsx`

**Interfaces:**
- Produces: `isWindows(): boolean` (reads `navigator.userAgent`; WebView2 reports `Windows NT`).

- [ ] **Step 1: Write the failing test**

Append to `apps/desktop/src/LiveToggle.test.tsx`:

```tsx
test('on Windows the failure hint does not mention macOS Accessibility', async () => {
  const ua = navigator.userAgent
  Object.defineProperty(navigator, 'userAgent', {
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Edg/128.0',
    configurable: true,
  })
  try {
    vi.mocked(control.setLiveEnabled).mockResolvedValue(false)
    const user = userEvent.setup()
    render(<LiveToggle />)
    await user.click(await screen.findByRole('switch', { name: 'Live transform' }))
    const hint = screen.getByTestId('live-hint')
    expect(hint).toHaveTextContent("Couldn't start live transform. Try again or restart Alfavit.")
    expect(hint).not.toHaveTextContent(/Accessibility/)
  } finally {
    Object.defineProperty(navigator, 'userAgent', { value: ua, configurable: true })
  }
})
```

Also make the existing macOS hint test explicit about its copy: in `'shows the permission hint when enabling fails'`, replace `expect(screen.getByTestId('live-hint')).toBeInTheDocument()` with:

```tsx
  expect(screen.getByTestId('live-hint')).toHaveTextContent(/System Settings → Accessibility/)
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --dir apps/desktop test 2>&1 | tail -15`
Expected: the new test fails (hint text mentions Accessibility); the others pass.

- [ ] **Step 3: Implement**

`apps/desktop/src/platform.ts`:

```ts
/** True when the panel runs in WebView2 on Windows. Copy that names an OS
 *  setting (the macOS Accessibility pane) branches on this. */
export function isWindows(): boolean {
  return typeof navigator !== 'undefined' && /Windows NT/.test(navigator.userAgent)
}
```

In `LiveToggle.tsx`, add `import { isWindows } from './platform'` and replace the hint element with:

```tsx
      {needsPermission && (
        <span className="live-hint" data-testid="live-hint">
          {isWindows()
            ? "Couldn't start live transform. Try again or restart Alfavit."
            : 'Enable Alfavit in System Settings → Accessibility, then toggle again.'}
        </span>
      )}
```

Update the state comment above `setNeedsPermission(next && !result)` to: `// Tried to enable but it didn't turn on => macOS: Accessibility not granted; Windows: hook failed to install.`

- [ ] **Step 4: Run tests and type-check**

Run: `pnpm --dir apps/desktop test 2>&1 | tail -6` → all pass (LiveToggle ×3, App ×2, liveTransform tests).
Run: `pnpm --dir apps/desktop build 2>&1 | tail -3` → `tsc` clean, Vite build succeeds.

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/src/platform.ts apps/desktop/src/LiveToggle.tsx apps/desktop/src/LiveToggle.test.tsx
git commit -m "feat(desktop): Windows-specific hint when live transform fails to start"
```

---

### Task 11: Windows bundle config and version 0.3.0

**Files:**
- Create: `apps/desktop/src-tauri/tauri.windows.conf.json`
- Modify: `apps/desktop/src-tauri/tauri.conf.json`, `apps/desktop/src-tauri/Cargo.toml`, `apps/desktop/package.json` (version), `apps/desktop/src-tauri/Cargo.lock` (regenerated)

Tauri merges `tauri.windows.conf.json` over `tauri.conf.json` on Windows (JSON Merge Patch; arrays replace wholesale). The base file keeps the macOS targets and ad-hoc signing; Windows overrides only what differs.

- [ ] **Step 1: Create the Windows overlay**

```bash
cat > apps/desktop/src-tauri/tauri.windows.conf.json <<'EOF'
{
  "$schema": "https://schema.tauri.app/config/2",
  "bundle": {
    "targets": ["nsis"],
    "windows": {
      "nsis": {
        "installMode": "currentUser"
      },
      "webviewInstallMode": {
        "type": "downloadBootstrapper"
      }
    }
  }
}
EOF
```

- [ ] **Step 2: Bump the version in three files**

```bash
cd apps/desktop
sed -i '' 's/"version": "0.2.1"/"version": "0.3.0"/' package.json src-tauri/tauri.conf.json
sed -i '' 's/^version = "0.2.1"/version = "0.3.0"/' src-tauri/Cargo.toml
grep -n '"version"\|^version' package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml
```

Expected: three lines, each `0.3.0`.

- [ ] **Step 3: Regenerate Cargo.lock and verify both platforms**

Run: `cd apps/desktop/src-tauri && cargo check 2>&1 | tail -1 && grep -A1 'name = "alfavit-desktop"' Cargo.lock`
Expected: `Finished`, and `version = "0.3.0"` under `alfavit-desktop`.
Run: `apps/desktop/scripts/check-windows.sh 2>&1 | tail -1` → `Finished`.
Run: `cd apps/desktop/src-tauri && python3 -c "import json;json.load(open('tauri.windows.conf.json'));print('valid json')"`.

- [ ] **Step 4: Commit**

```bash
git add apps/desktop/src-tauri/tauri.windows.conf.json apps/desktop/src-tauri/tauri.conf.json apps/desktop/src-tauri/Cargo.toml apps/desktop/src-tauri/Cargo.lock apps/desktop/package.json
git commit -m "chore(desktop): 0.3.0 — NSIS per-user installer config for Windows"
```

---

### Task 12: CI — `build-windows` job

**Files:**
- Modify: `.github/workflows/desktop-release.yml`

Notes: `tauri::generate_context!()` embeds `frontendDist`, so `cargo test` needs a built `apps/desktop/dist` (engine first). The Windows job `needs` the macOS job so both upload into the same draft release instead of racing to create two. Runs only on `desktop-v*` tags or manual dispatch.

- [ ] **Step 1: Append the job**

Append to `.github/workflows/desktop-release.yml` (same indentation level as `build-macos`):

```yaml

  build-windows:
    # Serialised after macOS so both artifacts land on ONE draft release
    # (two jobs creating the release simultaneously would race).
    needs: build-macos
    runs-on: windows-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - uses: dtolnay/rust-toolchain@stable

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build engine
        run: pnpm --filter @alfavit/engine build

      # tauri::generate_context! embeds the frontend, so the Rust tests need dist/.
      - name: Build frontend
        run: pnpm --dir apps/desktop build

      - name: Rust tests on Windows (key classification, replacement plan, denylist, word buffer)
        run: cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml

      - uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          projectPath: apps/desktop
          tagName: ${{ startsWith(github.ref, 'refs/tags/') && github.ref_name || '' }}
          releaseName: ${{ startsWith(github.ref, 'refs/tags/') && format('Alfavit Desktop {0}', github.ref_name) || '' }}
          releaseDraft: true
          prerelease: false
```

- [ ] **Step 2: Validate the YAML**

Run: `python3 -c "import yaml,sys;d=yaml.safe_load(open('.github/workflows/desktop-release.yml'));print(list(d['jobs']))"`
Expected: `['build-macos', 'build-windows']`. (If PyYAML is missing: `python3 -m pip install --user pyyaml`, or use `ruby -ryaml -e 'p YAML.load_file(".github/workflows/desktop-release.yml")["jobs"].keys'`.)

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/desktop-release.yml
git commit -m "ci(desktop): build the Windows NSIS installer and run Rust tests on windows-latest"
```

---

### Task 13: README and deployment docs

**Files:**
- Rewrite: `apps/desktop/README.md`
- Modify: `docs/deployment.md` (the "macOS app is not deployed by CI" note)

- [ ] **Step 1: Rewrite the README**

Replace `apps/desktop/README.md` with:

```markdown
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

### Acceptance checklist — live transform (both platforms)

- [ ] Fresh install: the switch is Off; typing is untouched.
- [ ] macOS: flipping On the first time prompts for Accessibility; after granting, typing transforms. Windows: flipping On works immediately.
- [ ] In a plain editor (TextEdit/Notes or Notepad), in Word, and in a browser field: `shahar `→`şahar `, `oʻzbek `→`özbek `, `чой `→`çoy `; `hello ` unchanged.
- [ ] A browser password field is never modified.
- [ ] The terminal (Terminal/iTerm or Windows Terminal/PowerShell) is not transformed.
- [ ] Turning it Off stops all transformation immediately.
- [ ] On/Off state survives quit + relaunch.
- [ ] Typing stays responsive (no lag/stutter while on).
```

- [ ] **Step 2: Update `docs/deployment.md`**

Replace the final bullet of the Notes section (starting `- **The macOS app is not deployed by CI.**`) with:

```markdown
- **The desktop apps are not deployed by CI.** They bundle the engine's
  compiled output at build time and have no auto-update channel, so an engine
  fix reaches Mac and Windows users only via rebuilt installers rehosted at
  `apps/web/public/download/Alfavit.dmg` and
  `apps/web/public/download/Alfavit-Setup.exe` (a `desktop-v*` tag builds
  both into one draft Release). See `apps/desktop/README.md`.
```

- [ ] **Step 3: Commit**

```bash
git add apps/desktop/README.md docs/deployment.md
git commit -m "docs(desktop): Windows install, checklists, both installers in the release flow"
```

---

### Task 14: Release 0.3.0 through CI and hand it to the tester

**Files:** none in the repo (ops). Produces the CI-built `Alfavit_0.3.0_x64-setup.exe` and a checklist link for the tester.

- [ ] **Step 1: Run the full local verification once more**

```bash
pnpm --dir apps/desktop test && pnpm --dir apps/desktop build
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml
apps/desktop/scripts/check-windows.sh
pnpm --dir apps/web test
git status --short
```

Expected: all green; `git status` shows only the pre-existing untracked `.DS_Store` / logo files.

- [ ] **Step 2: Merge to `main` and push (owner-approved step)**

```bash
git checkout main && git pull --ff-only && git merge --no-ff desktop-windows -m "Merge desktop-windows: Windows port 0.3.0 (installer + CI; website card follows tester OK)" && git push origin main
```

- [ ] **Step 3: Tag and watch CI**

```bash
git tag desktop-v0.3.0 && git push origin desktop-v0.3.0
gh run watch --exit-status "$(gh run list --workflow desktop-release.yml --limit 1 --json databaseId --jq '.[0].databaseId')"
```

Expected: both jobs green (~15 min macOS, then ~20 min Windows). If `cargo test` fails on the Windows runner, the failing test names the pure module; fix on `desktop-windows`, merge, delete and re-push the tag.

- [ ] **Step 4: Download the installer from the draft release**

```bash
mkdir -p /tmp/alfavit-0.3.0 && gh release download desktop-v0.3.0 --pattern '*-setup.exe' --dir /tmp/alfavit-0.3.0
ls -la /tmp/alfavit-0.3.0 && file /tmp/alfavit-0.3.0/*-setup.exe
```

Expected: one file, a few MB, `PE32 executable ... Nullsoft Installer self-extracting archive`.

- [ ] **Step 5: Send to the tester**

Send the installer plus the two Windows checklists from `apps/desktop/README.md` ("Acceptance checklist — Windows" and "Acceptance checklist — live transform"). Ask for pass/fail per line and the Windows version. Hold Task 15 until it comes back passing; fix and re-release (0.3.1) otherwise.

---

### Task 15: Website card + hosted installer (held until the tester's OK)

**Files:**
- Create: `apps/web/public/download/Alfavit-Setup.exe` (binary from Task 14, renamed)
- Modify: `apps/web/src/components/Channels.tsx`, `apps/web/src/i18n/translations.ts`, `apps/web/src/tests/Channels.test.tsx`

**Interfaces:**
- Consumes: the existing `Item` fields `live`, `href`, `download`, `descKey`, `noteKey`, `badge` and the `TranslationKey` type derived from the `en` object.
- Produces: i18n keys `channels.windows.desc`, `channels.windows.note` in `en`, `uz`, `ru`.

Copy note: the owner (native Uzbek speaker) verifies the `uz` and `ru` strings before this commit lands.

- [ ] **Step 1: Update the test first**

In `apps/web/src/tests/Channels.test.tsx`, replace the body of the first test from the `// macOS is now live` comment to the end with:

```tsx
  // macOS and Windows are live: two Download links to the hosted installers.
  const downloads = screen.getAllByRole('link', { name: 'Download' }).map((a) => a.getAttribute('href'))
  expect(downloads).toEqual(['/download/Alfavit.dmg', '/download/Alfavit-Setup.exe'])
  // Both desktop cards show the New badge + the live-transform description.
  expect(screen.getAllByText('New')).toHaveLength(2)
  expect(screen.getAllByText(/converts to new-Latin/i)).toHaveLength(2)
  expect(screen.getByText(/SmartScreen/)).toBeInTheDocument()
  // Three "Open" links remain: Web (/en), Telegram (external), API (/en/developers).
  const openHrefs = screen.getAllByRole('link', { name: 'Open' }).map((a) => a.getAttribute('href'))
  expect(openHrefs).toContain('/en')
  expect(openHrefs).toContain('https://t.me/alfavit_uz_bot')
  expect(openHrefs).toContain('/en/developers')
  // Three remain Coming soon: iOS, Android, extension.
  expect(screen.getAllByText('Coming soon')).toHaveLength(3)
})
```

Rename that test to `'renders groups, platforms, and CTAs with macOS and Windows live for download'`. In the second test, change `toHaveLength(3)` to `toHaveLength(2)`.

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --dir apps/web test -- Channels 2>&1 | tail -15`
Expected: first test fails on the Download hrefs (only one), second fails on the Coming-soon count.

- [ ] **Step 3: Flip the card**

In `Channels.tsx`, replace `{ nameKey: 'channels.windows.name', Icon: WindowsIcon },` with:

```tsx
        {
          nameKey: 'channels.windows.name',
          Icon: WindowsIcon,
          live: true,
          href: '/download/Alfavit-Setup.exe',
          download: true,
          descKey: 'channels.windows.desc',
          noteKey: 'channels.windows.note',
          badge: 'new',
        },
```

- [ ] **Step 4: Add the copy in all three locales**

In `translations.ts`, directly after each locale's `'channels.mac.note'` line, add:

`en`:
```ts
    'channels.windows.desc': 'Type anywhere — Uzbek Cyrillic or old-Latin converts to new-Latin as you go.',
    'channels.windows.note': 'Unsigned — if SmartScreen blocks the first run, choose More info → Run anyway.',
```

`uz`:
```ts
    'channels.windows.desc': 'Istalgan ilovada yozing — kirill yoki eski lotin yozuvingiz shu zahoti yangi lotinga oʻgiriladi.',
    'channels.windows.note': 'Imzosiz — SmartScreen ilk ishga tushirishni bloklasa, More info → Run anyway’ni tanlang.',
```

`ru`:
```ts
    'channels.windows.desc': 'Печатайте где угодно — кириллица или старая латиница сразу превращается в новую латиницу.',
    'channels.windows.note': 'Без подписи — если SmartScreen блокирует первый запуск, нажмите «Подробнее → Выполнить в любом случае».',
```

- [ ] **Step 5: Host the installer**

```bash
cp /tmp/alfavit-0.3.0/Alfavit_0.3.0_x64-setup.exe apps/web/public/download/Alfavit-Setup.exe
ls -la apps/web/public/download/ && file apps/web/public/download/Alfavit-Setup.exe
```

Expected: `Alfavit.dmg` (unchanged) and `Alfavit-Setup.exe` (a few MB, Nullsoft installer).

- [ ] **Step 6: Run the web tests and the dist assertions**

Run: `pnpm --dir apps/web test 2>&1 | tail -6` → all pass.
Run: `pnpm --dir apps/web test:dist 2>&1 | tail -4` → passes, and `ls apps/web/dist/download/` lists both installers.

- [ ] **Step 7: Owner verifies the `uz`/`ru` copy**, then commit

```bash
git add apps/web/public/download/Alfavit-Setup.exe apps/web/src/components/Channels.tsx apps/web/src/i18n/translations.ts apps/web/src/tests/Channels.test.tsx
git commit -m "feat(web): Windows card live — hosted 0.3.0 installer, uz/ru/en copy"
```

- [ ] **Step 8: Merge and deploy**

```bash
git checkout main && git pull --ff-only && git merge --ff-only desktop-windows && git push origin main
```

The Deploy workflow publishes the web app; confirm `https://alfavit.uz/download/Alfavit-Setup.exe` returns the installer (`curl -sI https://alfavit.uz/download/Alfavit-Setup.exe | head -3` → `200`, `content-type: application/x-msdownload` or `application/octet-stream`) and the Apps page shows the Windows Download card.

---

## Self-review

**Spec coverage.** Architecture/module split → Task 2. Data flow, hook thread, worker, generation capture → Task 8. Classification rules, AltGr, dead keys → Task 3. Replacer batch + UIPI → Tasks 4, 7. Guard: UIA password, denylist, `accessibility_granted` true, `open_permission_settings` no-op → Tasks 5, 6, 2. `RunEvent::Reopen` gate, autostart, hotkey unchanged, tray-click race (Windows-only) → Tasks 2, 9. Platform config, NSIS per-user, no MSI, version 0.3.0 → Task 11. Frontend hint + `platform.ts` → Task 10. README → Task 13. CI job, Windows `cargo test`, free minutes → Task 12. Local `cargo check` story → Task 1. Hosting, filename rename, release flow, deployment doc → Tasks 13–15. Website card, three i18n keys, test counts → Task 15. Sequencing (card held for tester) → Tasks 14–15. Error-handling table → Tasks 6–8 (each failure path degrades to no transform). Linux stubs are a compile-only convenience, consistent with "Linux out of scope".

**Placeholder scan.** No TBD/TODO; every code step has full code; every command has an expected result.

**Type consistency.** `Modifiers { ctrl, alt, win }`, `classify(vk: u32, mods: Modifiers, text: &str) -> Key`, `keystroke_text(n: i32, buf: &[u16], dead_pending: &mut bool) -> String` (Task 3) match their use in Task 8. `Stroke` variants and `plan_replacement(typed_len, reformed, boundary)` (Task 4) match Task 7. `is_denylisted(&str)` (Task 5) matches Task 6. `dispatch_word(&AppHandle, Emitted, u64)`, `ALFAVIT_MARKER: i64` (cast to `usize` on Windows), `GENERATION` (Task 2) match Tasks 7–8. `guard::open_permission_settings()` (Task 2) is used in `controller.rs` and `lib.rs`. `tray_blur::{swallowed, GRACE_MS, note_hidden, click_follows_blur}` consistent within Task 9. i18n keys `channels.windows.desc` / `channels.windows.note` consistent between Task 15's card and translations.
