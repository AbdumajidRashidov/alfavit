# Alfavit Desktop Live Transform (Phase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** With a master "Live transform" switch on, keep the user's current keyboard, and auto-replace each finished word they type in any normal app with reformed new-Latin, via a background `CGEventTap` observer that reuses `@alfavit/engine`.

**Architecture:** Extend the shipped Phase 1 Tauri app (`apps/desktop`). A pure Rust `word_buffer` tracks the in-progress word (unit-tested). A `CGEventTap` on a dedicated thread classifies key events, feeds the buffer, and on a word boundary hands the word to an async worker. The worker asks the app's JS layer to transliterate (one engine, byte-identical) and, if the word changed, synthesizes backspaces + retypes the reformed word. A `guard` skips password fields and excluded apps. A master tray toggle starts/stops the observer and persists its state.

**Tech Stack:** Rust `core-graphics` 0.25, `core-foundation` 0.10, `foreign-types` 0.5, `libc`, `objc2-app-kit` 0.3, `tokio` (sync/time); Tauri v2 events + commands; `@alfavit/engine`; Vitest.

> **Native APIs in this plan were compile-verified** on the target Mac against `core-graphics` 0.25.0, `core-foundation` 0.10.1, `foreign-types` 0.5, `objc2-app-kit` 0.3.2 (Rust 1.92). Signatures below are known to compile.

## Global Constraints

- **Extends `apps/desktop`** (the Phase 1 Tauri v2 app). No new package. Phase 1 tray, ⌥⇧A panel, and in-app converter must keep working unchanged.
- **One engine:** all conversion goes through `@alfavit/engine` (`transliterate`). Never re-implement or port it to Rust.
- **Offline:** no network calls anywhere. No emojis anywhere (code, comments, commits, UI).
- **macOS only.** Requires **Accessibility** permission (for the event tap + synthetic events). Everything on-device; nothing stored or sent.
- **Master switch semantics:** "Live transform" tray toggle. **On → observer runs and transforms; Off → the event tap is fully torn down (observes nothing).** State persists across restarts; **defaults to Off** on first install.
- **Safety:** never touch password/secure fields (`IsSecureEventInputEnabled()`); skip an app deny-list (default `com.apple.Terminal`, `com.googlecode.iterm2`). The tap callback must never block and must be panic-safe.
- **Boundaries (scope cut):** a word is "finished" by **space or `.,!?;:`**. Return/Tab/arrows/navigation/modifier-combos reset the buffer (words ended by Return are not auto-transformed — documented gap).
- **Commits:** author every commit `git -c user.name="Alfavit" -c user.email="abdumajid.r@iman.uz" commit -m "…"` with the message ending in the trailer `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

## Verification split

- **Tasks 1–2** are fully assistant-verifiable (`cargo test`, `vitest`). **Task 3** includes a unit-tested pure `classify` (assistant) plus a native tap (user-verified).
- **Tasks 3–7** native parts: the assistant compiles them (`cargo build` on the Mac); the **user verifies runtime behavior** on their Mac against each task's expected result and the Task 8 checklist. Real system-wide keystroke interception/replacement cannot be driven headlessly.

## File Structure

```
apps/desktop/
  src/
    liveTransform.ts            # transformWord() + registerLiveTransform()  (Task 2)
    liveTransform.test.ts       # vitest for transformWord                    (Task 2)
    main.tsx                    # MODIFY: register listener under Tauri only   (Task 2)
  src-tauri/
    Cargo.toml                  # MODIFY: add native deps                      (Task 3)
    src/
      lib.rs                    # MODIFY: mod live; manage bridge; command; tray toggle (Tasks 4,7)
      live/
        mod.rs                  # module declarations                          (Task 1, extended)
        word_buffer.rs          # pure buffer + Key/Emitted (+unit tests)      (Task 1)
        keytap.rs               # classify (+unit tests) + tap thread          (Task 3, extended 4,5,6)
        bridge.rs               # TransformBridge + submit_transform command   (Task 4)
        replacer.rs             # synthetic backspace+retype                   (Task 5)
        guard.rs                # secure-input + frontmost bundle id + denylist(Task 6)
        controller.rs           # LiveMode state, start/stop, persistence      (Task 7)
  README.md                     # MODIFY: live-transform section + checklist   (Task 8)
```

---

### Task 1: `word_buffer` — pure word-tracking core (unit-tested)

**Files:**
- Create: `apps/desktop/src-tauri/src/live/mod.rs`
- Create: `apps/desktop/src-tauri/src/live/word_buffer.rs`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `pub enum Key { Char(char), Backspace, Boundary(char), Reset }`
  - `pub struct Emitted { pub word: String, pub boundary: char, pub typed_len: usize }`
  - `pub struct WordBuffer` with `pub fn new() -> Self` and `pub fn push(&mut self, key: Key) -> Option<Emitted>`.
  Task 3 feeds `Key`s in and reads `Emitted` out.

- [ ] **Step 1: Create `apps/desktop/src-tauri/src/live/mod.rs`**

```rust
pub mod word_buffer;
```

- [ ] **Step 2: Write the failing test + skeleton in `apps/desktop/src-tauri/src/live/word_buffer.rs`**

```rust
#[derive(Debug, Clone, PartialEq)]
pub enum Key {
    Char(char),
    Backspace,
    Boundary(char),
    Reset,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Emitted {
    pub word: String,
    pub boundary: char,
    pub typed_len: usize,
}

#[derive(Default)]
pub struct WordBuffer {
    buf: String,
}

impl WordBuffer {
    pub fn new() -> Self {
        Self { buf: String::new() }
    }

    pub fn push(&mut self, _key: Key) -> Option<Emitted> {
        unimplemented!()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn feed(seq: &[Key]) -> Vec<Emitted> {
        let mut wb = WordBuffer::new();
        seq.iter().filter_map(|k| wb.push(k.clone())).collect()
    }

    #[test]
    fn emits_word_on_boundary_with_typed_len() {
        let out = feed(&[
            Key::Char('s'), Key::Char('h'), Key::Char('a'),
            Key::Char('h'), Key::Char('a'), Key::Char('r'),
            Key::Boundary(' '),
        ]);
        assert_eq!(out, vec![Emitted { word: "shahar".into(), boundary: ' ', typed_len: 6 }]);
    }

    #[test]
    fn backspace_pops_and_reset_clears() {
        // type "wronk", backspace to "wron", then reset, then "choy " -> only "choy"
        let out = feed(&[
            Key::Char('w'), Key::Char('r'), Key::Char('o'), Key::Char('n'), Key::Char('k'),
            Key::Backspace,
            Key::Reset,
            Key::Char('c'), Key::Char('h'), Key::Char('o'), Key::Char('y'),
            Key::Boundary('.'),
        ]);
        assert_eq!(out, vec![Emitted { word: "choy".into(), boundary: '.', typed_len: 4 }]);
    }

    #[test]
    fn boundary_on_empty_buffer_emits_nothing() {
        let out = feed(&[Key::Boundary(' '), Key::Boundary(' ')]);
        assert!(out.is_empty());
    }

    #[test]
    fn counts_chars_not_bytes_for_cyrillic() {
        // Cyrillic "чой" is 3 chars (6 bytes) -> typed_len 3
        let out = feed(&[Key::Char('ч'), Key::Char('о'), Key::Char('й'), Key::Boundary(' ')]);
        assert_eq!(out, vec![Emitted { word: "чой".into(), boundary: ' ', typed_len: 3 }]);
    }
}
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `cd apps/desktop/src-tauri && cargo test word_buffer 2>&1 | tail -20`
Expected: the four tests fail (panic `not implemented` from `unimplemented!()`).

- [ ] **Step 4: Implement `push` (replace the `unimplemented!` body)**

```rust
    pub fn push(&mut self, key: Key) -> Option<Emitted> {
        match key {
            Key::Char(c) => {
                self.buf.push(c);
                None
            }
            Key::Backspace => {
                self.buf.pop();
                None
            }
            Key::Reset => {
                self.buf.clear();
                None
            }
            Key::Boundary(boundary) => {
                if self.buf.is_empty() {
                    None
                } else {
                    let word = std::mem::take(&mut self.buf);
                    let typed_len = word.chars().count();
                    Some(Emitted { word, boundary, typed_len })
                }
            }
        }
    }
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd apps/desktop/src-tauri && cargo test word_buffer 2>&1 | tail -20`
Expected: `test result: ok. 4 passed`.

- [ ] **Step 6: Commit**

```bash
git add apps/desktop/src-tauri/src/live
git -c user.name="Alfavit" -c user.email="abdumajid.r@iman.uz" commit -m "feat(desktop): live-transform word buffer (pure, unit-tested)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: JS transform service (`transformWord` + `registerLiveTransform`)

**Files:**
- Create: `apps/desktop/src/liveTransform.ts`
- Create: `apps/desktop/src/liveTransform.test.ts`
- Modify: `apps/desktop/src/main.tsx`

**Interfaces:**
- Consumes: `transliterate` from `@alfavit/engine`; `listen` from `@tauri-apps/api/event`; `invoke` from `@tauri-apps/api/core`.
- Produces:
  - `export function transformWord(word: string): string` — `transliterate(word).text`.
  - `export function registerLiveTransform(): Promise<UnlistenFn>` — listens `alfavit://transform-request` (`{ id: number; word: string }`) and replies via `invoke('submit_transform', { id, output })`.
  The Rust bridge (Task 4) emits `alfavit://transform-request` and defines the `submit_transform` command.

- [ ] **Step 1: Write the failing test `apps/desktop/src/liveTransform.test.ts`**

```ts
import { expect, test } from 'vitest'
import { transformWord } from './liveTransform'

test('transformWord converts old-Latin and Cyrillic to reformed new-Latin', () => {
  expect(transformWord('shahar')).toBe('şahar')
  expect(transformWord('oʻzbek')).toBe('özbek')
  expect(transformWord('чой')).toBe('çoy')
})

test('transformWord leaves foreign words unchanged', () => {
  expect(transformWord('hello')).toBe('hello')
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --dir apps/desktop test liveTransform`
Expected: FAIL — cannot resolve `./liveTransform`.

- [ ] **Step 3: Create `apps/desktop/src/liveTransform.ts`**

```ts
import { transliterate } from '@alfavit/engine'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'

/** Reformed new-Latin for one word, via the shared engine. */
export function transformWord(word: string): string {
  return transliterate(word).text
}

interface TransformRequest {
  id: number
  word: string
}

/** Wire the Rust observer's per-word requests to the engine. Call once at
 *  startup, only when running under Tauri (see main.tsx guard). */
export async function registerLiveTransform(): Promise<UnlistenFn> {
  return listen<TransformRequest>('alfavit://transform-request', (event) => {
    const output = transformWord(event.payload.word)
    void invoke('submit_transform', { id: event.payload.id, output })
  })
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --dir apps/desktop test liveTransform`
Expected: PASS (2 tests). Then `pnpm --dir apps/desktop test` — all suites green.

- [ ] **Step 5: Register on startup (Tauri only) — modify `apps/desktop/src/main.tsx`**

Replace the file with:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { registerLiveTransform } from './liveTransform'
import './styles.css'

// Only wire the Rust bridge when actually running inside Tauri — in a plain
// browser (tests, `vite dev`) there is no Tauri runtime to listen/invoke.
if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
  void registerLiveTransform()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 6: Run the full frontend suite**

Run: `pnpm --dir apps/desktop test`
Expected: all green (scriptLabel, LiveConverter, App, liveTransform).

- [ ] **Step 7: Commit**

```bash
git add apps/desktop/src/liveTransform.ts apps/desktop/src/liveTransform.test.ts apps/desktop/src/main.tsx
git -c user.name="Alfavit" -c user.email="abdumajid.r@iman.uz" commit -m "feat(desktop): JS transform service for live mode

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: `keytap` — classify (unit-tested) + observe-only tap

Native task. Assistant adds deps and `cargo build`s it; the user verifies runtime detection on their Mac. `classify` is pure and unit-tested by the assistant.

**Files:**
- Modify: `apps/desktop/src-tauri/Cargo.toml`
- Modify: `apps/desktop/src-tauri/src/live/mod.rs`
- Create: `apps/desktop/src-tauri/src/live/keytap.rs`
- Modify: `apps/desktop/src-tauri/src/lib.rs`

**Interfaces:**
- Consumes: `word_buffer::{Key, WordBuffer, Emitted}` (Task 1).
- Produces:
  - `pub fn classify(keycode: i64, has_cmd: bool, has_ctrl: bool, unicode: &str) -> Key`
  - `pub const ALFAVIT_MARKER: i64` and `pub static GENERATION: AtomicU64` (used by Tasks 5).
  - `pub fn start_tap(app: tauri::AppHandle)` — spawns the observer thread. Task 7 later gates this behind the toggle; for now it is called at startup so detection is testable.

- [ ] **Step 1: Add native dependencies to `apps/desktop/src-tauri/Cargo.toml`**

Add under `[dependencies]` (after the existing `tauri`/plugin lines):

```toml
core-graphics = "0.25"
core-foundation = "0.10"
foreign-types = "0.5"
libc = "0.2"
objc2-app-kit = "0.3"
serde = { version = "1", features = ["derive"] }
tokio = { version = "1", features = ["sync", "time"] }
```

- [ ] **Step 2: Declare the module — modify `apps/desktop/src-tauri/src/live/mod.rs`**

```rust
pub mod word_buffer;
pub mod keytap;
```

- [ ] **Step 3: Write the failing `classify` unit tests + skeleton in `apps/desktop/src-tauri/src/live/keytap.rs`**

```rust
use crate::live::word_buffer::Key;

/// Marker stamped on our own synthetic events (EVENT_SOURCE_USER_DATA) so the
/// tap can ignore them and avoid a feedback loop.
pub const ALFAVIT_MARKER: i64 = 0x0A1F_A710;

/// Map a raw key event to an abstract `Key`. Pure — unit-tested.
/// macOS virtual keycodes: Delete=51, Return=36, Tab=48, Escape=53,
/// KeypadEnter=76, arrows=123..=126, Home/End/PageUp/PageDown/etc=115..=121.
pub fn classify(keycode: i64, has_cmd: bool, has_ctrl: bool, unicode: &str) -> Key {
    let _ = (keycode, has_cmd, has_ctrl, unicode);
    unimplemented!()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn modifiers_reset() {
        assert_eq!(classify(9, true, false, "c"), Key::Reset); // Cmd+C
        assert_eq!(classify(9, false, true, "c"), Key::Reset); // Ctrl+C
    }

    #[test]
    fn special_keys() {
        assert_eq!(classify(51, false, false, ""), Key::Backspace); // Delete
        assert_eq!(classify(36, false, false, ""), Key::Reset); // Return
        assert_eq!(classify(48, false, false, "\t"), Key::Reset); // Tab
        assert_eq!(classify(123, false, false, ""), Key::Reset); // Left arrow
    }

    #[test]
    fn boundary_and_char() {
        assert_eq!(classify(49, false, false, " "), Key::Boundary(' '));
        assert_eq!(classify(47, false, false, "."), Key::Boundary('.'));
        assert_eq!(classify(1, false, false, "s"), Key::Char('s'));
        assert_eq!(classify(0, false, false, "ч"), Key::Char('ч'));
    }

    #[test]
    fn empty_or_multichar_unicode_resets() {
        assert_eq!(classify(0, false, false, ""), Key::Reset);
    }
}
```

- [ ] **Step 4: Run the classify tests to verify they fail**

Run: `cd apps/desktop/src-tauri && cargo test classify 2>&1 | tail -20`
Expected: the four tests fail (`not implemented`). (This also downloads/compiles the new deps the first time.)

- [ ] **Step 5: Implement `classify` (replace its body)**

```rust
pub fn classify(keycode: i64, has_cmd: bool, has_ctrl: bool, unicode: &str) -> Key {
    // Any Command/Control combo is a shortcut, not text entry.
    if has_cmd || has_ctrl {
        return Key::Reset;
    }
    match keycode {
        51 => return Key::Backspace,                 // Delete
        36 | 48 | 53 | 76 => return Key::Reset,       // Return, Tab, Escape, KeypadEnter
        123..=126 => return Key::Reset,               // arrow keys
        115..=121 => return Key::Reset,               // Home/End/PageUp/PageDown region
        _ => {}
    }
    let mut chars = unicode.chars();
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
```

- [ ] **Step 6: Run the classify tests to verify they pass**

Run: `cd apps/desktop/src-tauri && cargo test classify 2>&1 | tail -20`
Expected: `4 passed`.

- [ ] **Step 7: Add the observe-only tap thread (append to `keytap.rs`)**

```rust
use std::cell::RefCell;
use std::sync::atomic::AtomicU64;

use core_foundation::runloop::{kCFRunLoopCommonModes, CFRunLoop};
use core_graphics::event::{
    CGEvent, CGEventFlags, CGEventTap, CGEventTapLocation, CGEventTapOptions,
    CGEventTapPlacement, CGEventType, CallbackResult, EventField,
};
use foreign_types::ForeignType;

use crate::live::word_buffer::{Emitted, WordBuffer};

/// Bumped on every text keystroke; the replacer (Task 5) uses it to abort a
/// replacement if the user kept typing during the transform round-trip.
pub static GENERATION: AtomicU64 = AtomicU64::new(0);

unsafe extern "C" {
    fn CGEventKeyboardGetUnicodeString(
        event: core_graphics::sys::CGEventRef,
        max_length: libc::c_ulong,
        actual_length: *mut libc::c_ulong,
        unicode_string: *mut u16,
    );
}

/// The unicode string a keyDown event produced (what the user typed).
fn event_string(event: &CGEvent) -> String {
    let mut buf = [0u16; 8];
    let mut actual: libc::c_ulong = 0;
    unsafe {
        CGEventKeyboardGetUnicodeString(
            event.as_ptr(),
            buf.len() as libc::c_ulong,
            &mut actual,
            buf.as_mut_ptr(),
        );
    }
    String::from_utf16_lossy(&buf[..actual as usize])
}

/// Called when a word is finished. Replaced/extended in Tasks 4-6.
fn on_word(_app: &tauri::AppHandle, emitted: Emitted) {
    eprintln!(
        "[alfavit-live] word={:?} boundary={:?} typed_len={}",
        emitted.word, emitted.boundary, emitted.typed_len
    );
}

/// Spawn the observer thread: install a keyDown tap, feed the word buffer, and
/// deliver finished words to `on_word`. Runs its own CFRunLoop.
pub fn start_tap(app: tauri::AppHandle) {
    std::thread::spawn(move || {
        let buffer = RefCell::new(WordBuffer::new());
        let tap = CGEventTap::new(
            CGEventTapLocation::HID,
            CGEventTapPlacement::HeadInsertEventTap,
            CGEventTapOptions::ListenOnly,
            vec![CGEventType::KeyDown],
            move |_proxy, _etype, event| {
                // Ignore our own synthetic events (marker) to avoid a loop.
                if event.get_integer_value_field(EventField::EVENT_SOURCE_USER_DATA)
                    == ALFAVIT_MARKER
                {
                    return CallbackResult::Keep;
                }
                let keycode = event.get_integer_value_field(EventField::KEYBOARD_EVENT_KEYCODE);
                let flags = event.get_flags();
                let has_cmd = flags.contains(CGEventFlags::CGEventFlagCommand);
                let has_ctrl = flags.contains(CGEventFlags::CGEventFlagControl);
                let unicode = event_string(event);
                let key = classify(keycode, has_cmd, has_ctrl, &unicode);

                match &key {
                    crate::live::word_buffer::Key::Char(_)
                    | crate::live::word_buffer::Key::Backspace => {
                        GENERATION.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                    }
                    _ => {}
                }

                if let Some(emitted) = buffer.borrow_mut().push(key) {
                    on_word(&app, emitted);
                }
                CallbackResult::Keep
            },
        )
        .expect("failed to create event tap (Accessibility permission?)");

        let loop_source = tap
            .mach_port()
            .create_runloop_source(0)
            .expect("failed to create runloop source");
        CFRunLoop::get_current().add_source(&loop_source, unsafe { kCFRunLoopCommonModes });
        tap.enable();
        CFRunLoop::run_current();
    });
}
```

- [ ] **Step 8: Wire startup (temporary) — modify `apps/desktop/src-tauri/src/lib.rs`**

Add `mod live;` near the top (after the `use` block). Then inside the existing `.setup(|app| { … })`, immediately before its final `Ok(())`, add:

```rust
            // TEMPORARY (Task 7 gates this behind the master toggle): start the
            // observer at launch so detection is testable. Requires Accessibility.
            #[cfg(target_os = "macos")]
            live::keytap::start_tap(app.handle().clone());
```

- [ ] **Step 9: Build (assistant, on Mac)**

Run: `cd apps/desktop/src-tauri && cargo build 2>&1 | tail -15`
Expected: compiles (warnings about unused `GENERATION`/`ALFAVIT_MARKER` are fine — used in Task 5).

- [ ] **Step 10: Verify detection (user, on Mac)**

Run `pnpm --dir apps/desktop tauri dev` from a terminal so stderr is visible. Grant Accessibility when prompted (System Settings → Privacy & Security → Accessibility), then re-run. Type in TextEdit/Notes.
Expected: each finished word logs, e.g. `[alfavit-live] word="shahar" boundary=' ' typed_len=6`; Cmd/Ctrl shortcuts and arrows do not emit words.

- [ ] **Step 11: Commit**

```bash
git add apps/desktop/src-tauri/Cargo.toml apps/desktop/src-tauri/Cargo.lock apps/desktop/src-tauri/src/live/mod.rs apps/desktop/src-tauri/src/live/keytap.rs apps/desktop/src-tauri/src/lib.rs
git -c user.name="Alfavit" -c user.email="abdumajid.r@iman.uz" commit -m "feat(desktop): keyboard observer (classify + observe-only tap)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: `bridge` — Rust↔JS transform round-trip

Native task. Assistant `cargo build`s; user verifies the correct conversion is logged live.

**Files:**
- Create: `apps/desktop/src-tauri/src/live/bridge.rs`
- Modify: `apps/desktop/src-tauri/src/live/mod.rs`
- Modify: `apps/desktop/src-tauri/src/live/keytap.rs` (make `on_word` use the bridge)
- Modify: `apps/desktop/src-tauri/src/lib.rs` (manage state + register command)

**Interfaces:**
- Consumes: the JS side from Task 2 (`alfavit://transform-request` → `submit_transform`); `keytap::on_word`.
- Produces:
  - `pub struct TransformBridge` (Tauri managed state) with `pub async fn transform(&self, app: &tauri::AppHandle, word: String) -> Option<String>`.
  - `#[tauri::command] pub fn submit_transform(id: u64, output: String, bridge: tauri::State<TransformBridge>)`.

- [ ] **Step 1: Create `apps/desktop/src-tauri/src/live/bridge.rs`**

```rust
use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;
use std::time::Duration;

use serde::Serialize;
use tauri::{AppHandle, Emitter, State};
use tokio::sync::oneshot;

/// Correlates per-word transform requests emitted to JS with their replies.
#[derive(Default)]
pub struct TransformBridge {
    pending: Mutex<HashMap<u64, oneshot::Sender<String>>>,
    next_id: AtomicU64,
}

#[derive(Clone, Serialize)]
struct TransformRequest {
    id: u64,
    word: String,
}

impl TransformBridge {
    /// Ask the JS engine to transliterate `word`. Returns None on timeout/failure.
    pub async fn transform(&self, app: &AppHandle, word: String) -> Option<String> {
        let id = self.next_id.fetch_add(1, Ordering::Relaxed);
        let (tx, rx) = oneshot::channel();
        self.pending.lock().unwrap().insert(id, tx);
        if app
            .emit("alfavit://transform-request", TransformRequest { id, word })
            .is_err()
        {
            self.pending.lock().unwrap().remove(&id);
            return None;
        }
        match tokio::time::timeout(Duration::from_millis(500), rx).await {
            Ok(Ok(output)) => Some(output),
            _ => {
                self.pending.lock().unwrap().remove(&id);
                None
            }
        }
    }
}

/// JS calls this with the transliterated result for request `id`.
#[tauri::command]
pub fn submit_transform(id: u64, output: String, bridge: State<TransformBridge>) {
    if let Some(tx) = bridge.pending.lock().unwrap().remove(&id) {
        let _ = tx.send(output);
    }
}
```

- [ ] **Step 2: Declare the module — modify `apps/desktop/src-tauri/src/live/mod.rs`**

```rust
pub mod word_buffer;
pub mod keytap;
pub mod bridge;
```

- [ ] **Step 3: Route finished words through the bridge — modify `keytap.rs`**

Replace the `on_word` function with:

```rust
/// Called when a word is finished. Task 5 adds the actual replacement.
fn on_word(app: &tauri::AppHandle, emitted: Emitted) {
    let app = app.clone();
    tauri::async_runtime::spawn(async move {
        let bridge = app.state::<crate::live::bridge::TransformBridge>();
        if let Some(reformed) = bridge.transform(&app, emitted.word.clone()).await {
            if reformed != emitted.word {
                eprintln!("[alfavit-live] would replace {:?} -> {:?}", emitted.word, reformed);
            }
        }
    });
}
```

Add `use tauri::Manager;` to the `keytap.rs` imports (for `app.state`).

- [ ] **Step 4: Manage state + register the command — modify `apps/desktop/src-tauri/src/lib.rs`**

In the `tauri::Builder::default()` chain, add before `.setup(`:

```rust
        .manage(live::bridge::TransformBridge::default())
```

and add an invoke handler (if the app has none yet) in the same chain:

```rust
        .invoke_handler(tauri::generate_handler![live::bridge::submit_transform])
```

- [ ] **Step 5: Build (assistant, on Mac)**

Run: `cd apps/desktop/src-tauri && cargo build 2>&1 | tail -15`
Expected: compiles.

- [ ] **Step 6: Verify live conversion logging (user, on Mac)**

`pnpm --dir apps/desktop tauri dev` from a terminal; with the app running, type `shahar ` and `чой ` in TextEdit.
Expected: logs `would replace "shahar" -> "şahar"` and `would replace "чой" -> "çoy"`. Typing `hello ` logs nothing (unchanged).

- [ ] **Step 7: Commit**

```bash
git add apps/desktop/src-tauri/src/live/bridge.rs apps/desktop/src-tauri/src/live/mod.rs apps/desktop/src-tauri/src/live/keytap.rs apps/desktop/src-tauri/src/lib.rs
git -c user.name="Alfavit" -c user.email="abdumajid.r@iman.uz" commit -m "feat(desktop): Rust<->JS transform bridge (one engine)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: `replacer` — synthetic in-place replacement

Native task. Assistant `cargo build`s; user verifies real replacement.

**Files:**
- Create: `apps/desktop/src-tauri/src/live/replacer.rs`
- Modify: `apps/desktop/src-tauri/src/live/mod.rs`
- Modify: `apps/desktop/src-tauri/src/live/keytap.rs` (call the replacer, with the generation abort)

**Interfaces:**
- Consumes: `keytap::{ALFAVIT_MARKER, GENERATION}`; `word_buffer::Emitted`.
- Produces: `pub fn replace_word(typed_len: usize, reformed: &str, boundary: char)` — deletes the just-typed word + boundary and types the reformed word + boundary, stamping each synthetic event with `ALFAVIT_MARKER`.

- [ ] **Step 1: Create `apps/desktop/src-tauri/src/live/replacer.rs`**

```rust
use core_graphics::event::{CGEvent, CGEventTapLocation, EventField};
use core_graphics::event_source::{CGEventSource, CGEventSourceStateID};

use crate::live::keytap::ALFAVIT_MARKER;

const KEY_DELETE: core_graphics::event::CGKeyCode = 51;

fn post(event: &CGEvent) {
    // Stamp so our own tap ignores this synthetic event (no feedback loop).
    event.set_integer_value_field(EventField::EVENT_SOURCE_USER_DATA, ALFAVIT_MARKER);
    event.post(CGEventTapLocation::HID);
}

/// Delete the word the user just finished (plus the boundary char they typed)
/// and type the reformed word followed by the same boundary char.
pub fn replace_word(typed_len: usize, reformed: &str, boundary: char) {
    let Ok(source) = CGEventSource::new(CGEventSourceStateID::HIDSystemState) else {
        return;
    };
    // Backspace over the word and the boundary char.
    for _ in 0..(typed_len + 1) {
        if let Ok(down) = CGEvent::new_keyboard_event(source.clone(), KEY_DELETE, true) {
            post(&down);
        }
        if let Ok(up) = CGEvent::new_keyboard_event(source.clone(), KEY_DELETE, false) {
            post(&up);
        }
    }
    // Type the reformed word + boundary char back.
    let mut out = String::from(reformed);
    out.push(boundary);
    if let Ok(event) = CGEvent::new_keyboard_event(source.clone(), 0, true) {
        event.set_string(&out);
        post(&event);
    }
}
```

- [ ] **Step 2: Declare the module — modify `apps/desktop/src-tauri/src/live/mod.rs`**

```rust
pub mod word_buffer;
pub mod keytap;
pub mod bridge;
pub mod replacer;
```

- [ ] **Step 3: Perform the replacement with a generation-abort — modify `keytap.rs`**

Replace `on_word` with:

```rust
/// Called when a word is finished: transform via the engine, and if it changed
/// (and the user has not kept typing), replace it in place.
fn on_word(app: &tauri::AppHandle, emitted: Emitted) {
    let app = app.clone();
    let generation = GENERATION.load(std::sync::atomic::Ordering::Relaxed);
    tauri::async_runtime::spawn(async move {
        let bridge = app.state::<crate::live::bridge::TransformBridge>();
        let Some(reformed) = bridge.transform(&app, emitted.word.clone()).await else {
            return;
        };
        if reformed == emitted.word {
            return; // unchanged (foreign / already reformed)
        }
        // Abort if the user kept typing during the transform round-trip.
        if GENERATION.load(std::sync::atomic::Ordering::Relaxed) != generation {
            return;
        }
        crate::live::replacer::replace_word(emitted.typed_len, &reformed, emitted.boundary);
    });
}
```

- [ ] **Step 4: Build (assistant, on Mac)**

Run: `cd apps/desktop/src-tauri && cargo build 2>&1 | tail -15`
Expected: compiles (no more unused-`GENERATION`/`ALFAVIT_MARKER` warnings).

- [ ] **Step 5: Verify replacement (user, on Mac)**

`pnpm --dir apps/desktop tauri dev`; type in TextEdit/Notes/a browser field.
Expected: `shahar ` becomes `şahar `, `oʻzbek ` becomes `özbek `, `чой ` becomes `çoy `, each flipping when you press space. `hello ` stays `hello `. Typing fast, the word settles correctly (occasional missed replace under very fast typing is acceptable).

- [ ] **Step 6: Commit**

```bash
git add apps/desktop/src-tauri/src/live/replacer.rs apps/desktop/src-tauri/src/live/mod.rs apps/desktop/src-tauri/src/live/keytap.rs
git -c user.name="Alfavit" -c user.email="abdumajid.r@iman.uz" commit -m "feat(desktop): in-place word replacement (synthetic keystrokes)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: `guard` — skip secure fields + excluded apps

Native task. Assistant `cargo build`s; user verifies password fields and Terminal are untouched.

**Files:**
- Create: `apps/desktop/src-tauri/src/live/guard.rs`
- Modify: `apps/desktop/src-tauri/src/live/mod.rs`
- Modify: `apps/desktop/src-tauri/src/live/keytap.rs` (consult the guard in the callback)

**Interfaces:**
- Consumes: nothing new.
- Produces:
  - `pub fn is_secure_input() -> bool`
  - `pub fn frontmost_bundle_id() -> Option<String>`
  - `pub fn is_blocked() -> bool` — true when secure input is active or the frontmost app is on the default deny-list.

- [ ] **Step 1: Create `apps/desktop/src-tauri/src/live/guard.rs`**

```rust
use objc2_app_kit::NSWorkspace;

/// Apps where auto-transform is disabled by default (terminals mangle synthetic
/// backspaces / take raw input).
const DENYLIST: &[&str] = &["com.apple.Terminal", "com.googlecode.iterm2"];

#[link(name = "Carbon", kind = "framework")]
unsafe extern "C" {
    fn IsSecureEventInputEnabled() -> bool;
}

/// True while a password/secure text field has focus anywhere on the system.
pub fn is_secure_input() -> bool {
    unsafe { IsSecureEventInputEnabled() }
}

/// Bundle id of the frontmost application, if available.
pub fn frontmost_bundle_id() -> Option<String> {
    unsafe {
        let workspace = NSWorkspace::sharedWorkspace();
        let app = workspace.frontmostApplication()?;
        app.bundleIdentifier().map(|s| s.to_string())
    }
}

/// True when the current context must not be transformed.
pub fn is_blocked() -> bool {
    if is_secure_input() {
        return true;
    }
    match frontmost_bundle_id() {
        Some(id) => DENYLIST.contains(&id.as_str()),
        None => false,
    }
}
```

- [ ] **Step 2: Declare the module — modify `apps/desktop/src-tauri/src/live/mod.rs`**

```rust
pub mod word_buffer;
pub mod keytap;
pub mod bridge;
pub mod replacer;
pub mod guard;
```

- [ ] **Step 3: Consult the guard in the tap callback — modify `keytap.rs`**

In the tap callback, immediately after the `ALFAVIT_MARKER` early-return block, add:

```rust
                // Never observe/transform in password fields or excluded apps.
                if crate::live::guard::is_blocked() {
                    return CallbackResult::Keep;
                }
```

- [ ] **Step 4: Build (assistant, on Mac)**

Run: `cd apps/desktop/src-tauri && cargo build 2>&1 | tail -15`
Expected: compiles (links the Carbon framework + AppKit).

- [ ] **Step 5: Verify exclusions (user, on Mac)**

With the app running: type in a password field (e.g. a login field in Safari, or the macOS login-items password prompt) — it must be **left completely alone**. Type in Terminal — **not transformed**. Type in TextEdit — transformed as before.

- [ ] **Step 6: Commit**

```bash
git add apps/desktop/src-tauri/src/live/guard.rs apps/desktop/src-tauri/src/live/mod.rs apps/desktop/src-tauri/src/live/keytap.rs
git -c user.name="Alfavit" -c user.email="abdumajid.r@iman.uz" commit -m "feat(desktop): guard - skip secure fields and excluded apps

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: `controller` — master toggle, persistence, permission flow, tray

Native task. Assistant `cargo build`s; user verifies On/Off. This makes the tap start/stop on demand instead of at launch.

**Files:**
- Create: `apps/desktop/src-tauri/src/live/controller.rs`
- Modify: `apps/desktop/src-tauri/src/live/mod.rs`
- Modify: `apps/desktop/src-tauri/src/live/keytap.rs` (return a stop handle from `start_tap`)
- Modify: `apps/desktop/src-tauri/src/lib.rs` (remove the temporary auto-start; add the tray toggle + restore persisted state)

**Interfaces:**
- Consumes: `keytap::start_tap`, `guard`.
- Produces:
  - `keytap::start_tap(app) -> keytap::TapHandle` (changed to return a stop handle).
  - `pub struct LiveMode` (managed state) with `pub fn toggle(&self, app: &tauri::AppHandle) -> bool` (returns the new enabled state), `pub fn is_enabled(&self) -> bool`, and `pub fn restore(&self, app: &tauri::AppHandle)`.
  - `pub fn config_enabled() -> bool` / `pub fn save_enabled(app: &tauri::AppHandle, on: bool)` for persistence.

- [ ] **Step 1: Make `start_tap` return a stop handle — modify `keytap.rs`**

Add near the top of `keytap.rs`:

```rust
use core_foundation::base::TCFType;
use core_foundation::runloop::CFRunLoopRef;

/// Handle to a running observer thread. Dropping/stopping it ends the tap.
pub struct TapHandle {
    runloop: SendRunLoop,
    thread: Option<std::thread::JoinHandle<()>>,
}

struct SendRunLoop(CFRunLoopRef);
// CFRunLoopStop is documented thread-safe; we only ever call stop() from it.
unsafe impl Send for SendRunLoop {}

impl TapHandle {
    /// Stop the observer: stop its run loop and join the thread.
    pub fn stop(mut self) {
        unsafe {
            let rl = CFRunLoop::wrap_under_get_rule(self.runloop.0);
            rl.stop();
        }
        if let Some(t) = self.thread.take() {
            let _ = t.join();
        }
    }
}
```

Change `start_tap` to hand its run loop back and return a `TapHandle`:

```rust
pub fn start_tap(app: tauri::AppHandle) -> TapHandle {
    let (tx, rx) = std::sync::mpsc::channel::<SendRunLoop>();
    let thread = std::thread::spawn(move || {
        let buffer = RefCell::new(WordBuffer::new());
        let tap = CGEventTap::new(
            CGEventTapLocation::HID,
            CGEventTapPlacement::HeadInsertEventTap,
            CGEventTapOptions::ListenOnly,
            vec![CGEventType::KeyDown],
            move |_proxy, _etype, event| {
                if event.get_integer_value_field(EventField::EVENT_SOURCE_USER_DATA)
                    == ALFAVIT_MARKER
                {
                    return CallbackResult::Keep;
                }
                if crate::live::guard::is_blocked() {
                    return CallbackResult::Keep;
                }
                let keycode = event.get_integer_value_field(EventField::KEYBOARD_EVENT_KEYCODE);
                let flags = event.get_flags();
                let has_cmd = flags.contains(CGEventFlags::CGEventFlagCommand);
                let has_ctrl = flags.contains(CGEventFlags::CGEventFlagControl);
                let unicode = event_string(event);
                let key = classify(keycode, has_cmd, has_ctrl, &unicode);
                match &key {
                    crate::live::word_buffer::Key::Char(_)
                    | crate::live::word_buffer::Key::Backspace => {
                        GENERATION.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                    }
                    _ => {}
                }
                if let Some(emitted) = buffer.borrow_mut().push(key) {
                    on_word(&app, emitted);
                }
                CallbackResult::Keep
            },
        )
        .expect("failed to create event tap (Accessibility permission?)");

        let loop_source = tap
            .mach_port()
            .create_runloop_source(0)
            .expect("failed to create runloop source");
        let current = CFRunLoop::get_current();
        current.add_source(&loop_source, unsafe { kCFRunLoopCommonModes });
        tap.enable();
        let _ = tx.send(SendRunLoop(current.as_concrete_TypeRef()));
        CFRunLoop::run_current();
    });

    let runloop = rx.recv().expect("observer thread failed to start");
    TapHandle { runloop, thread: Some(thread) }
}
```

- [ ] **Step 2: Create `apps/desktop/src-tauri/src/live/controller.rs`**

```rust
use std::sync::Mutex;

use tauri::Manager;

use crate::live::guard;
use crate::live::keytap::{self, TapHandle};

/// Master on/off state for live transform, plus the running observer (if on).
#[derive(Default)]
pub struct LiveMode {
    handle: Mutex<Option<TapHandle>>,
}

fn config_path(app: &tauri::AppHandle) -> Option<std::path::PathBuf> {
    let dir = app.path().app_config_dir().ok()?;
    let _ = std::fs::create_dir_all(&dir);
    Some(dir.join("live-transform.json"))
}

/// Persisted "enabled" flag (defaults to false / off).
pub fn config_enabled(app: &tauri::AppHandle) -> bool {
    let Some(path) = config_path(app) else { return false };
    let Ok(text) = std::fs::read_to_string(path) else { return false };
    text.contains("\"enabled\":true") || text.contains("\"enabled\": true")
}

pub fn save_enabled(app: &tauri::AppHandle, on: bool) {
    if let Some(path) = config_path(app) {
        let _ = std::fs::write(path, format!("{{\"enabled\":{}}}", on));
    }
}

impl LiveMode {
    pub fn is_enabled(&self) -> bool {
        self.handle.lock().unwrap().is_some()
    }

    /// Start the observer if permission is granted. Returns false if it could
    /// not start (no Accessibility permission).
    fn start(&self, app: &tauri::AppHandle) -> bool {
        if self.handle.lock().unwrap().is_some() {
            return true;
        }
        if !guard::accessibility_granted() {
            return false;
        }
        let handle = keytap::start_tap(app.clone());
        *self.handle.lock().unwrap() = Some(handle);
        true
    }

    fn stop(&self) {
        if let Some(handle) = self.handle.lock().unwrap().take() {
            handle.stop();
        }
    }

    /// Flip the switch. Returns the new enabled state.
    pub fn toggle(&self, app: &tauri::AppHandle) -> bool {
        if self.is_enabled() {
            self.stop();
            save_enabled(app, false);
            false
        } else {
            let started = self.start(app);
            save_enabled(app, started);
            started
        }
    }

    /// On launch: if it was On last time and permission is still granted, resume.
    pub fn restore(&self, app: &tauri::AppHandle) {
        if config_enabled(app) && guard::accessibility_granted() {
            self.start(app);
        }
    }
}
```

- [ ] **Step 3: Add the permission check to `guard.rs`**

Append to `apps/desktop/src-tauri/src/live/guard.rs`:

```rust
#[link(name = "ApplicationServices", kind = "framework")]
unsafe extern "C" {
    fn AXIsProcessTrusted() -> bool;
}

/// True when this app has been granted macOS Accessibility permission.
pub fn accessibility_granted() -> bool {
    unsafe { AXIsProcessTrusted() }
}
```

- [ ] **Step 4: Declare the module — modify `apps/desktop/src-tauri/src/live/mod.rs`**

```rust
pub mod word_buffer;
pub mod keytap;
pub mod bridge;
pub mod replacer;
pub mod guard;
pub mod controller;
```

- [ ] **Step 5: Wire the tray toggle + restore — modify `apps/desktop/src-tauri/src/lib.rs`**

1. Remove the temporary auto-start added in Task 3 (the `live::keytap::start_tap(app.handle().clone());` block).
2. Add `.manage(live::controller::LiveMode::default())` to the builder chain.
3. In `.setup(|app| { … })`, after the tray is built, add:

```rust
            app.state::<live::controller::LiveMode>().restore(&app.handle());
```

4. Add a checkable "Live transform" item to the existing tray menu. Where the menu items are built, add:

```rust
            let live_item = CheckMenuItem::with_id(
                app,
                "live_transform",
                "Live transform",
                true,
                app.state::<live::controller::LiveMode>().is_enabled(),
                None::<&str>,
            )?;
```

Include `&live_item` in the `Menu::with_items(app, &[…])?` list.

5. In the tray `on_menu_event` match, add an arm:

```rust
                    "live_transform" => {
                        let live = app.state::<live::controller::LiveMode>();
                        let now_on = live.toggle(app);
                        if !now_on && !live::guard::accessibility_granted() {
                            // Needs permission: open the pane so the user can grant it.
                            let _ = std::process::Command::new("open")
                                .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility")
                                .spawn();
                        }
                    }
```

(`CheckMenuItem` is already imported in `lib.rs` from the Phase 1 "Launch at login" item.)

- [ ] **Step 6: Build (assistant, on Mac)**

Run: `cd apps/desktop/src-tauri && cargo build 2>&1 | tail -15`
Expected: compiles (links ApplicationServices for `AXIsProcessTrusted`).

- [ ] **Step 7: Verify the master switch (user, on Mac)**

`pnpm --dir apps/desktop tauri dev`. Confirm:
- Fresh install: "Live transform" is **unchecked**; typing is not transformed.
- Toggling it On the first time (without permission) opens the Accessibility pane; after granting and toggling On, typing transforms.
- Toggling Off: transforming stops immediately (and, via a process monitor, the event tap is gone).
- Quit and relaunch: the last On/Off state is restored (and stays Off if permission was revoked).

- [ ] **Step 8: Commit**

```bash
git add apps/desktop/src-tauri/src/live apps/desktop/src-tauri/src/lib.rs
git -c user.name="Alfavit" -c user.email="abdumajid.r@iman.uz" commit -m "feat(desktop): live-transform master toggle, persistence, permission flow

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: README + acceptance checklist

**Files:**
- Modify: `apps/desktop/README.md`

**Interfaces:**
- Consumes: everything from Tasks 1–7.
- Produces: user docs + the manual acceptance checklist that closes out Phase 2.

- [ ] **Step 1: Append a Live Transform section to `apps/desktop/README.md`**

````markdown
## Live transform (Phase 2)

Turn on **Live transform** in the tray menu and keep using your normal keyboard —
each word you finish (with space or `.,!?;:`) in a normal text field is
auto-replaced with reformed new-Latin, whether you typed Cyrillic or old-Latin.

- Requires **Accessibility** permission (System Settings → Privacy & Security →
  Accessibility). Toggling Live transform on the first time opens that pane.
- **Off fully stops the observer** — nothing is watched while it is off. The
  state persists across restarts and defaults to Off.
- Everything is on-device; no keystrokes are stored or sent.
- **Not transformed:** password/secure fields (always), Terminal/iTerm, and
  words ended with Return/Tab (only space/punctuation trigger a transform).

### Acceptance checklist (run on macOS)

- [ ] Fresh install: Live transform is Off; typing is untouched.
- [ ] Turning it On the first time prompts for Accessibility; after granting, typing transforms.
- [ ] In TextEdit/Notes/a browser field: `shahar `→`şahar `, `oʻzbek `→`özbek `, `чой `→`çoy `; `hello ` unchanged.
- [ ] Password fields are never modified.
- [ ] Terminal is not transformed.
- [ ] Turning it Off stops all transformation immediately.
- [ ] On/Off state survives quit + relaunch (and stays Off if Accessibility was revoked).
- [ ] Typing stays responsive (no lag/stutter while on).
- [ ] The Phase 1 ⌥⇧A panel and tray still work.
````

- [ ] **Step 2: Verify the frontend suite still passes (assistant)**

Run: `pnpm --dir apps/desktop test`
Expected: all suites green (including `liveTransform`).

- [ ] **Step 3: Commit**

```bash
git add apps/desktop/README.md
git -c user.name="Alfavit" -c user.email="abdumajid.r@iman.uz" commit -m "docs(desktop): live-transform usage + acceptance checklist

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

- [ ] **Step 4: User runs the acceptance checklist on their Mac** and reports failures, which are triaged back into the relevant task.

---

## Self-Review

**Spec coverage:**
- Background observer keeps current keyboard, auto-transforms per word → Tasks 3–5. ✓
- Both Cyrillic + old-Latin, auto-detected → Task 2 (`transformWord` via engine). ✓
- One engine, no Rust fork → Task 4 bridge. ✓
- Word boundary = space/punctuation; Return/Tab/nav reset → Task 3 `classify`. ✓
- Never blocks; async worker → Task 3/4 (`spawn`). ✓
- Synthetic-event feedback loop avoided → Task 5 marker + Task 3 early-return. ✓
- Fast-typing abort → Task 5 generation check. ✓
- Secure fields + app deny-list → Task 6. ✓
- Master on/off; Off tears down tap; persisted; defaults Off; permission flow → Task 7. ✓
- Accessibility permission handling → Task 7 (`accessibility_granted`, open pane). ✓
- Automated tests (word_buffer, classify, transformWord) vs user-verified native → per-task + Task 8. ✓
- README + checklist → Task 8. ✓

**Placeholder scan:** no TBD/TODO; every code step is complete and (for native code) compile-verified against the pinned crate versions. The one `unimplemented!()` is an intentional TDD red-state, replaced in the same task.

**Type consistency:** `Key`/`Emitted`/`WordBuffer` (Task 1) used identically in Task 3; `classify` signature identical in Tasks 3; `TransformBridge::transform` + `submit_transform` (Task 4) match the JS `alfavit://transform-request`/`submit_transform` names (Task 2); `ALFAVIT_MARKER`/`GENERATION` defined in Task 3 and consumed in Task 5; `start_tap` returns `TapHandle` from Task 7 on, consumed by `LiveMode`; `guard::is_blocked`/`accessibility_granted` names consistent between Tasks 6–7.
