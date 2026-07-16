# Alfavit Desktop — Live Transform (Phase 2) Design

**Date:** 2026-07-16
**Status:** Design approved, pending spec review.
**Phase:** 2 of 2. Builds on the shipped Phase 1 menu-bar app (`apps/desktop`). Phase 1 = tray + global-hotkey panel with an in-app live converter. **Phase 2 = system-wide live transformation: keep your current keyboard, type anywhere, and each word auto-transforms to reformed new-Latin.**

## Goal

The user's end goal: turn the app on, keep using their normal keyboard, type in any app, and see each word they type auto-transform from Uzbek Cyrillic or old-Latin into the reformed 2026 new-Latin script — without switching input sources or taking any extra step. A single master switch turns the behavior on and off.

## Why this mechanism

"Keep your current keyboard and have text auto-transform everywhere" can only be built by **observing what is typed and replacing it in place** — the user's keyboard emits the original script, so something must watch and rewrite it. This is inherently a background keyboard-observer design. Two alternatives were rejected during brainstorming:

- **Full input-method (IME) that swallows and re-emits every keystroke** — visually cleaner (no momentary original text) but makes the app responsible for all text input (backspace, arrows, selection, cursor) in every app; fragile and reinvents an input method. Also requires the user to switch to an "Alfavit" input source, which contradicts "keep my current keyboard."
- **Porting `@alfavit/engine` to Rust** — would fork the single source of truth that keeps conversion byte-identical across web/bot/extension/desktop (including the `oʻ→ö` fix). Rejected; the engine stays the one implementation.

The accepted mechanism keeps the user's keyboard, is "always on" only while the master switch is on, and reuses the one engine.

## Accepted tradeoffs (explicitly agreed)

- **Accessibility permission required.** The observer sees keystrokes. Everything stays 100% on-device — nothing is stored, nothing is sent (consistent with Alfavit's offline ethos). The user grants Accessibility once, and only while the master switch is On does the observer run at all.
- **A brief "flit."** The user momentarily sees the original word before it flips to reformed at the word boundary. Inherent to keeping the user's keyboard.
- **Safe exceptions.** Password/secure fields are always skipped. A few apps (Terminal, some games/Electron apps) may not cooperate. "Everywhere" means "everywhere normal text goes, with safe exceptions."
- **Undo pollution.** Each replacement adds to the app's undo stack. Accepted for Phase 2.
- **Mostly native + user-verified.** The global interception, replacement, and exclusions are verified by the user on their Mac against a checklist, as in Phase 1.

## Architecture

- Extends the existing Tauri v2 app at `apps/desktop` — no new package.
- A background **global keyboard observer** (`CGEventTap`, via the Rust `core-graphics` crate) runs on its own thread/run-loop while the master switch is On.
- At each **word boundary**, the finished word is handed to the app's JS layer, which runs `transliterate`/`detectScript` from `@alfavit/engine` and returns the result. Rust then replaces the word in place if it changed. **One engine, byte-identical everywhere.**
- The observer callback **never blocks**: it hands emitted words to an async worker and returns immediately, so typing stays responsive.

### Data flow (observer never blocks)
```
keyDown → keytap → word_buffer.append
   … on boundary → emit {word, boundary_char, typed_len} → async worker
        → guard (secure input? denied app? enabled?)
        → transform_bridge → JS transliterate → result
        → if changed → replacer (typed_len+1 backspaces, then type reformed + boundary_char)
```

## Components

All extend `apps/desktop`. The Phase 1 tray, ⌥⇧A panel, and in-app converter are unchanged.

### 1. `word_buffer` (Rust, pure logic) — unit-testable core
- Tracks the in-progress word. Appends printable chars; pops on Backspace.
- **Resets** the buffer on anything meaning "cursor/field moved": arrow/Home/End/PageUp/PageDown keys, Return, Tab, any Cmd/Ctrl modifier combination, mouse click, focus change.
- On a **boundary char** (space, tab, return, and `.,!?;:`) emits `{ word: String, boundary_char: char, typed_len: usize }` where `typed_len` is the exact count of user-typed characters in the word (drives the backspace count).
- Pure: consumes an abstract key-event struct, emits words. No OS calls. Thoroughly unit-tested (key sequences in → emitted words + counts out).

### 2. `keytap` (Rust) — global observer
- Creates a `CGEventTap` for `keyDown` on a dedicated thread/run-loop; requires Accessibility.
- Converts each raw event into the abstract event `word_buffer` consumes: unicode char (`CGEventKeyboardGetUnicodeString`), modifier flags, keycode for special keys.
- Never blocks: emitted words are dispatched to the async worker; the callback returns immediately.
- Detects and re-arms if macOS auto-disables the tap (`kCGEventTapDisabledByTimeout` / `kCGEventTapDisabledByUserInput`).
- Panic-safe: a bug in the callback can never take down the user's keyboard.

### 3. `transform_bridge` (Rust ↔ JS) — reuse the one engine
- The async worker sends the finished word to the JS layer (Tauri command); JS runs `transliterate(word).text` and returns it. A small in-JS cache (word → output) avoids repeat round-trips for common words.
- Rust compares the result to the original; if unchanged (English/foreign/already-reformed), does nothing.

### 4. `replacer` (Rust) — in-place edit
- If the word changed: post `typed_len + 1` Backspaces (the word plus the boundary char the user already typed), then type `reformed + boundary_char` via `CGEventKeyboardSetUnicodeString`. The cursor ends where the user expects.
- If new keystrokes arrive mid-replace, abort that replace rather than fight the user's cursor.

### 5. `guard` (Rust) — safety/exclusions
- Skips entirely when `IsSecureEventInputEnabled()` is true (password/secure fields): no buffering, no replacement.
- Per-app deny-list by frontmost bundle id (defaults: `com.apple.Terminal`, `com.googlecode.iterm2`; extensible via config).
- Honors the global master switch.

### 6. `live_mode` controller + tray/permission UI (Rust) — extends Phase 1 shell
- Owns the master enabled flag, the tap lifecycle, the deny-list, and permission state.
- New **checkable tray item "Live transform"** (the master switch). Tooltip/label reflects On/Off.
- **On** → checks Accessibility, then creates the tap; **Off** → tears the tap down completely (observes nothing).
- Enabling when Accessibility is not granted: open System Settings → Privacy & Security → Accessibility and show a short "grant, then turn it back on" hint; leave the switch Off until granted.

### 7. `transform service` (JS/frontend) — headless engine handler
- A no-UI handler in the already-alive hidden panel webview that answers the bridge: `word → transliterate(word).text`. Reuses `@alfavit/engine`. Unit-tested with vitest.

### 8. Config/persistence (Rust)
- A small JSON config in the app's data dir stores the master On/Off state and the app deny-list.
- **Defaults to Off** on first install (opt-in). State is restored on launch; if it was On but Accessibility is no longer granted, it comes up Off with a notice.

## Master on/off control (explicit requirement)

- The **"Live transform" tray toggle is the single master switch**: On → transforms; Off → does nothing.
- **Off fully tears down the event tap** — the app observes nothing while Off (trust + battery), not merely "ignores" input.
- The state persists across restarts and defaults to Off. Turning it On is what triggers the Accessibility-permission flow.
- The tray reflects the current state. The Phase 1 panel/converter and ⌥⇧A hotkey remain available regardless of the switch.

## Error handling

- **Permission missing/revoked while On** → tap creation fails → auto-flip to Off + a clear notice. Never crash.
- **macOS auto-disables the tap** → detect and re-arm automatically.
- **Transform slow/unavailable** (JS not ready) → skip that word's replacement, leave the original, never hang typing.
- **Fast-typing race** → abort the in-flight replace rather than interleave with new input.
- **Tap callback is panic-safe.**

## Testing

- **Automated (assistant):**
  - `word_buffer` boundary/backspace logic — comprehensive Rust unit tests (key sequences → emitted words + `typed_len`).
  - `transform service` — vitest (word → reformed output), reusing the engine.
  - Conversion correctness itself is already covered by `@alfavit/engine`'s test suite.
- **User-verified on Mac (manual checklist):** global interception, replacement across apps, secure-field skipping, app exclusions, and the master On/Off truly starting/stopping the observer. As in Phase 1, real system-wide keystroke interception/replacement cannot be driven headlessly by the assistant.

## Incremental build order (riskiest last; each step independently checkable)

1. `word_buffer` pure module + Rust unit tests.
2. JS `transform service` + vitest.
3. `keytap` **observe-only** (logs detected words, no replacement) — user confirms detection + Accessibility flow across apps.
4. `transform_bridge` wired, still logging ("would replace X → Y") — user confirms conversions are right live.
5. `replacer` — real backspace+retype — user confirms replacement in TextEdit/Notes/browser.
6. `guard` — secure-field skip + app deny-list — user confirms password fields untouched, Terminal excluded.
7. `live_mode` master toggle + persistence + permission UI — user confirms On/Off fully starts/stops the observer.
8. Manual acceptance checklist.

Replacement only switches on after observation is proven; the Off safety net is validated at the end.

## Out of scope / deferred

- Configurable hotkey to toggle live mode (Phase 2 uses the tray toggle only).
- A settings UI for editing the app deny-list (Phase 2 ships sensible defaults + config file).
- Per-keystroke (character-by-character) transformation — Phase 2 transforms on word boundaries.
- Windows/Linux equivalents of the observer.
- Code signing/notarization (still deferred from Phase 1).
- Reducing/avoiding undo-stack pollution.

## Success criteria

- With **Live transform On** (and Accessibility granted), typing Uzbek Cyrillic or old-Latin in a normal text field (e.g. TextEdit, Notes, a browser field) auto-replaces each finished word with reformed new-Latin (`shahar`→`şahar`, `oʻzbek`→`özbek`, `чой`→`çoy`), matching `@alfavit/engine`.
- Typing English/foreign words leaves them unchanged.
- **Password/secure fields are never touched**; excluded apps (Terminal) are left alone.
- **Live transform Off** tears down the observer — nothing is intercepted or transformed.
- The On/Off state persists across restarts and defaults to Off on first install.
- `word_buffer` Rust unit tests and the JS transform-service tests pass; typing stays responsive (observer never blocks).
- The manual acceptance checklist passes on the user's Mac.
