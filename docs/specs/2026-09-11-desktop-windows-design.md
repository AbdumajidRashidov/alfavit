# Alfavit Desktop — Windows Port Design

**Date:** 2026-09-11
**Status:** Design approved in conversation; spec pending owner review.
**Builds on:** [Desktop app (Phase 1)](2026-07-15-desktop-app-design.md) and
[Live transform (Phase 2)](2026-07-16-desktop-live-transform-design.md).

## Goal

Ship the Alfavit desktop app on Windows with the same behaviour as the macOS
app: a tray icon and Alt+Shift+A open a small always-on-top panel holding the
**Live transform** switch; when it is on, every word the user finishes in any
text field (with space or `.,!?;:`) is rewritten from Uzbek Cyrillic or
old-Latin to the reformed new-Latin script, on-device, using the shared
`@alfavit/engine`. Deliver it as an unsigned NSIS installer built by CI,
hosted on alfavit.uz, with the Windows card on the Apps page flipped from
"Coming soon" to Download.

## Constraints that shaped the design

- **No Windows machine for the owner or the assistant.** The assistant can
  compile-check Windows code from macOS (`cargo check --target
  x86_64-pc-windows-msvc`) and CI can build and run unit tests on a Windows
  runner, but end-to-end verification of the keyboard hook is done by a
  third-party tester following a checklist in `apps/desktop/README.md`.
- **$0 budget.** Unsigned builds, GitHub-hosted runners within the free
  minutes, no store listing.
- **Mac behaviour must not change.** The port is additive: shared files keep
  their semantics, macOS code moves verbatim into platform files.

## Architecture

The `live/` module splits along platform lines. Pure logic stays shared; the
three OS-touching modules become thin dispatchers over a macOS and a Windows
implementation with identical signatures.

```
apps/desktop/src-tauri/src/live/
  mod.rs
  word_buffer.rs        shared, unchanged
  bridge.rs             shared, unchanged
  controller.rs         shared; the macOS-only "open Accessibility pane"
                        call moves into guard::open_permission_settings()
  keytap/
    mod.rs              #[cfg] re-exports: start_tap, TapHandle, GENERATION,
                        ALFAVIT_MARKER
    macos.rs            today's keytap.rs, moved verbatim
    windows.rs          new: WH_KEYBOARD_LL hook thread + worker thread
  replacer/
    mod.rs · macos.rs · windows.rs
                        replace_word(typed_len, reformed, boundary)
  guard/
    mod.rs · macos.rs · windows.rs
                        is_blocked(), accessibility_granted(),
                        open_permission_settings()
```

Decisions:

- **Same contract, two backends.** The controller, bridge, word buffer and
  the whole frontend never learn which OS they run on.
  `open_permission_settings()` is new: on macOS it runs the existing
  `open x-apple.systempreferences:…Privacy_Accessibility`; on Windows it is
  a no-op and `accessibility_granted()` always returns `true`, because a
  low-level keyboard hook needs no permission there. This removes the two
  `std::process::Command::new("open")` calls from shared code (`lib.rs` tray
  handler and `controller.rs`).
- **Cargo dependencies gated per target.** `core-graphics`,
  `core-foundation`, `foreign-types`, `libc` and `objc2-app-kit` move under
  `[target.'cfg(target_os = "macos")'.dependencies]`. Windows gets
  `windows = "0.61"` (the version Tauri 2.11 already compiles, so no
  duplicate crate) with the Win32 features for hooks and messages, keyboard
  input, threading and process names, COM, and UI Automation.
- **Shared invariants keep their names.** `ALFAVIT_MARKER` (stamped on our
  synthetic events so the observer ignores them), `GENERATION` (bumped on
  every observed key; a replacement whose generation is stale is aborted),
  and the `Key` enum are identical on both platforms. Each platform has its
  own pure `classify()` mapping its native key codes to `Key`, with unit
  tests of the same shape.

### Data flow on Windows

```
user keystroke
  → hook thread  (WH_KEYBOARD_LL callback: skip own events, read modifiers,
                  ToUnicodeEx, bump GENERATION, enqueue, CallNextHookEx)
  → worker thread (guard::is_blocked? [denylist, then cached UIA] → blocked: clear word | else classify → WordBuffer::push)
  → on_word       (same as macOS: TransformBridge → JS engine → replacer)
  → replacer      (one SendInput batch: backspaces + reformed word + boundary)
```

The hook callback never blocks and never calls COM. Windows silently removes
a low-level hook whose callback is slow; keeping the callback to a channel
push is what makes the design safe.

## Components

### 1. `keytap/windows.rs` — observer

`start_tap(app) -> Option<TapHandle>` spawns the **hook thread**, which:

1. Installs `SetWindowsHookExW(WH_KEYBOARD_LL, …)` and runs a `GetMessageW`
   loop (the Windows analogue of the Mac's `CFRunLoop::run_current`).
2. In the callback, for `WM_KEYDOWN` / `WM_SYSKEYDOWN`:
   - Skip our own events: `LLKHF_INJECTED` set **and**
     `dwExtraInfo == ALFAVIT_MARKER`. Injected input from other tools
     (AutoHotkey remaps, remote desktop) still counts as typing, matching the
     Mac, which also ignores only its own marker.
   - Pure modifier and lock keys (Shift, Ctrl, Alt, Win, Caps Lock, Num Lock,
     Scroll Lock) are not observed as keystrokes and are not enqueued —
     macOS never sees them either, since `FlagsChanged` is
     outside its tap mask — so the Shift before `!`, or the Cyrillic comma
     (Shift+`.`), does not clear the word. Ctrl, Alt and Win presses do still bump `GENERATION`, so a replacement pending during the engine round-trip is aborted rather than injected as Ctrl+Backspace (word delete) or Alt+Backspace (undo); Shift and the lock keys do not, because a Shift right after a space is how the next word's capital is typed.
   - Read modifiers with `GetAsyncKeyState` (Shift, Ctrl, Alt, Win).
   - Translate to text with `ToUnicodeEx` against the **foreground window's
     keyboard layout** (`GetKeyboardLayout(GetWindowThreadProcessId(
     GetForegroundWindow()))`), passing the `1 << 2` flag ("do not change
     keyboard state", Windows 10 1607+) so observing a dead key does not eat
     the user's next composed character.
   - `GENERATION.fetch_add(1)` on every observed key (same rule as macOS).
   - Push `{vk, modifiers, text}` onto an `mpsc` channel; return
     `CallNextHookEx`.
   - Caps Lock key events (down and up) are also fed to a tracker, seeded
     once from `GetKeyState` on the UI thread that turns the switch on (it
     pumps input, so its key state is current) and handed to the hook
     thread, then flipped on each observed Caps Lock press — because
     `GetKeyState` only reflects a thread's own input queue and the hook
     thread never reads key messages.
3. Sends its thread id back to the caller once the hook is installed; if
   `SetWindowsHookExW` fails, the thread exits, the sender drops, and
   `start_tap` returns `None`.

The **worker thread** drains the channel in order: `guard::is_blocked()` →
`classify()` → `WordBuffer::push()` → `on_word()` (shared code, unchanged).
A blocked key is dropped **and clears the word buffer**: the first characters
typed into a password field can arrive before the cached verdict flips, and
they must never survive into the next field. (macOS skips without clearing —
its secure-input flag is instantaneous, so nothing is ever buffered there.)

`TapHandle::stop()` posts `WM_QUIT` to the hook thread, which unhooks and
exits, and joins it. Dropping the channel sender ends the worker, which is
**not** joined: `stop()` runs on the UI thread, and the worker may be inside a
UI Automation call that marshals to that same thread — joining would
deadlock. The shared channel is tagged with the epoch of the `start_tap` that installed
it, so a `stop()` that overlaps a newer `start_tap` (the controller releases
its lock before the blocking stop) tears down only its own observer.

### 2. Windows `classify(vk, Modifiers { ctrl, alt, win }, text) -> Key`

- Ctrl held without Alt, or Win held → `Reset` (a shortcut, not text).
- Ctrl **and** Alt together is AltGr, which produces characters on many
  layouts → falls through to the text rules.
- `VK_BACK` → `Backspace`.
- `VK_RETURN`, `VK_TAB`, `VK_ESCAPE`, arrows (`0x25..=0x28`), `VK_HOME`,
  `VK_END`, `VK_PRIOR`, `VK_NEXT`, `VK_INSERT`, `VK_DELETE` → `Reset`.
- Otherwise, as today: exactly one printable char → `Char`; space or one of
  `.,!?;:` → `Boundary`; control char, empty or multi-char text → `Reset`.

### 3. `replacer/windows.rs`

`replace_word(typed_len, reformed, boundary)` builds **one `SendInput`
batch**: `typed_len + 1` pairs of `VK_BACK` down/up, then for each UTF-16
unit of `reformed + boundary` a `KEYEVENTF_UNICODE` down/up pair. Every
`KEYBDINPUT.dwExtraInfo` carries `ALFAVIT_MARKER`. A single batch lands
atomically in the input queue, which is tighter than the Mac's per-event
posting. The return value (events actually inserted) is checked only to
decide there is nothing to retry: a short count means the target window is
elevated and the word stays as typed.

### 4. `guard/windows.rs`

- `is_blocked()` returns `true` when either:
  - **Password field:** UI Automation `GetFocusedElement()` reports
    `CurrentIsPassword`. Browsers, Win32 `EDIT` with `ES_PASSWORD` and WinUI
    `PasswordBox` all set it. Windows has no system-wide secure-input flag,
    so this is best-effort by design and the README says so. The COM
    apartment is initialised once on the worker thread; the
    `IUIAutomation` instance is created once and reused. The verdict is
    cached for 250 ms per worker thread and the cheap executable-name check
    runs first: UI Automation is a cross-process call, so asking on every
    keystroke would lag fast typing (aborting replacements via `GENERATION`)
    and keep browsers in accessibility mode. Within that window, keystrokes
    after a click into a password field may be buffered in memory; a
    replacement there would need a boundary character typed within 250 ms of
    the click.
  - **Denylisted app:** the foreground window's process executable name
    (`GetForegroundWindow` → `GetWindowThreadProcessId` → `OpenProcess` →
    `QueryFullProcessImageNameW`, file name compared case-insensitively) is
    one of `WindowsTerminal.exe`, `cmd.exe`, `powershell.exe`, `pwsh.exe`,
    `conhost.exe`, `mintty.exe`, `alacritty.exe`, `wezterm-gui.exe`.
- `accessibility_granted()` → `true`.
- `open_permission_settings()` → no-op.

### 5. Shell (`lib.rs`) and config

- The `RunEvent::Reopen` arm (Dock-icon click) is a macOS-only enum variant
  in Tauri and does not compile elsewhere; it gets `#[cfg(target_os =
  "macos")]`. Windows has no Dock; the tray icon and the hotkey are the two
  entry points.
- Tray icon, tray menu, `tauri-plugin-global-shortcut` and
  `tauri-plugin-autostart` work on Windows unchanged. Autostart uses the
  per-user registry `Run` key; the `MacosLauncher` argument is ignored off
  macOS.
- **Hotkey stays Alt+Shift+A**, the literal twin of ⌥⇧A. Windows switches
  input language on Alt+Shift alone but not when a third key joins the
  chord, so the two should coexist. Uzbek users switch layouts constantly,
  so this is an explicit tester checklist item.
- **Tray-click blur race.** On Windows the tray belongs to Explorer, so
  clicking the icon blurs the panel *first*: the `Focused(false)` handler
  hides it, and the click's toggle that follows would show it again — the
  panel could never be closed from the tray. The blur handler records when
  it hid the panel; a tray click arriving within 250 ms of that is the same
  gesture and does not toggle. Gated to Windows (`#[cfg(target_os =
  "windows")]`) so macOS, where the status item belongs to our app and no
  blur occurs, is untouched.
- **Platform config files.** Tauri merges `tauri.macos.conf.json` and
  `tauri.windows.conf.json` over `tauri.conf.json` on each platform. The base
  file keeps the macOS targets `["dmg", "app"]` and ad-hoc `signingIdentity`;
  `tauri.windows.conf.json` replaces the targets array with `["nsis"]` with
  `installMode: "currentUser"` (no UAC prompt, keeps the app un-elevated) and
  the default WebView2 `downloadBootstrapper` mode (Windows 10/11 usually
  have WebView2 already). No MSI: it needs WiX and per-machine install and
  adds nothing. The existing `icons/icon.ico` covers Windows.

### 6. Frontend

- `LiveToggle`'s permission hint is Mac-specific ("Enable Alfavit in System
  Settings → Accessibility, then toggle again."). On Windows a `false` from
  `set_live_transform(true)` means the hook failed to install, so the hint
  reads "Couldn't start live transform. Try again or restart Alfavit."
  Platform comes from a tiny `isWindows()` helper in
  `apps/desktop/src/platform.ts` reading `navigator.userAgent` (WebView2
  reports `Windows NT`); no new dependency.
- The panel's descriptive hint and everything else are already
  platform-neutral.

### 7. README

Retitled from "macOS menu-bar + Dock app" to cover both platforms. Adds a
Windows section: install via the NSIS `Alfavit-Setup.exe`, the SmartScreen
bypass ("More info → Run anyway", the Windows counterpart of the Gatekeeper
note), "no permission prompt on Windows", the elevated-app limit, and the
Windows acceptance checklist (see Testing).

## Build, CI and distribution

- **CI.** `.github/workflows/desktop-release.yml` gains a `build-windows`
  job on `windows-latest` beside the existing macOS job, same triggers
  (`desktop-v*` tag, manual dispatch), same `tauri-apps/tauri-action`,
  target `x86_64-pc-windows-msvc`. It runs `cargo test` in `src-tauri`
  first, so the Windows `classify` and word-buffer tests execute on Windows,
  then bundles the NSIS installer and attaches it to the **same draft
  release** as the `.dmg`. Windows minutes bill at 2×; a ~15 min build costs
  ~30 of the 2,000 free monthly minutes on a private repo, and it runs only
  on tags and manual dispatch. Everyday CI (`ci.yml`, Ubuntu) is unchanged.
- **Local compile check.** Every Windows Rust change gets
  `cargo check --target x86_64-pc-windows-msvc` from macOS before commit
  (after a one-time `rustup target add x86_64-pc-windows-msvc`). This catches
  type and API errors; only linking and running need real Windows.
- **Hosting.** Unsigned, like the Mac. The installer is committed as
  `apps/web/public/download/Alfavit-Setup.exe` (stable filename, replaced per
  release, ~3-5 MB) and served by Cloudflare Pages beside `Alfavit.dmg`.
  tauri-action names the artifact `Alfavit_<ver>_x64-setup.exe`; it is
  renamed on copy.
- **Release flow** mirrors the Mac's: bump the version in
  `apps/desktop/package.json`, `src-tauri/tauri.conf.json`,
  `src-tauri/Cargo.toml` and `Cargo.lock`; push a `desktop-v*` tag; download
  both artifacts from the draft release; copy each into
  `apps/web/public/download/`; verify; push. `docs/deployment.md` and the
  desktop README describe both artifacts. Neither platform has auto-update.
  This port ships as **0.3.0**. The Mac `.dmg` need not be rehosted, since
  macOS behaviour is unchanged; the hosted `Alfavit.dmg` stays at 0.2.1
  until the next engine fix.
- **Website card.** The Windows item in `apps/web/src/components/Channels.tsx`
  flips to `live: true`, `href: '/download/Alfavit-Setup.exe'`,
  `download: true`, `badge: 'new'`, with new i18n keys
  `channels.windows.desc` and `channels.windows.note` in en/uz/ru. The note
  says, in effect: "Unsigned — if SmartScreen blocks the first run, choose
  More info → Run anyway." The owner verifies the Uzbek and Russian copy
  before merge. `Channels.test.tsx` asserts two Download links and three
  "Coming soon" cards (two in the extension-live variant).
- **Sequencing.** The card flip and the hosted installer are the **last
  task**, in their own commit, held until the tester reports the checklist
  passing. Everything else can land on `main` first: a Windows CI job that
  runs only on tags changes nothing for the live site.

## Error handling

Every failure degrades to "no transform", never to corrupted text:

| Failure | Behaviour |
|---|---|
| `SetWindowsHookExW` fails | `start_tap` → `None`; switch stays Off; panel shows the Windows hint |
| `ToUnicodeEx` yields nothing or several chars | `Reset`; word dropped |
| UI Automation unavailable / focused element unreadable | treated as not a password field; transform proceeds (best-effort guard) |
| Engine round-trip > 500 ms, or any key during it | replacement aborted via `GENERATION` (existing rule) |
| `SendInput` inserts fewer events than requested (elevated window) | nothing retried; word stays as typed |
| Worker lags a foreground change (slow UIA call, busy machine) | the guard verdict for a few keys applies to the window the user has left — wrong verdict, no corruption |
| Windows silently removes the hook | switch still reads On (hook bookkeeping only); Off→On reinstalls. Documented limit |

## Testing

1. **Unit (runs everywhere).** Windows `classify`: Ctrl shortcut resets,
   AltGr passes through, Backspace, Enter/Tab/Esc/arrows/nav reset, boundary
   and char cases including Cyrillic. Word buffer unchanged. `LiveToggle`
   gains a Windows-hint case. `Channels.test.tsx` updated. Web
   `test:dist` unchanged.
2. **Compile.** `cargo check --target x86_64-pc-windows-msvc` locally on
   every Windows change; `cargo test` on the Windows runner in CI.
3. **Manual, by the tester on Windows 10/11 x64**, from the README
   checklist:
   - Installer runs after the SmartScreen bypass; app appears in the tray.
   - Left-click tray toggles the panel; right-click shows Show / Live
     transform / Launch at login / Quit.
   - Alt+Shift+A toggles the panel from any app, **with at least two
     keyboard layouts installed** (confirms no language-switch conflict).
   - Panel is frameless, always-on-top, hides on blur and Esc, follows
     light/dark.
   - Fresh install: Live transform Off; typing untouched.
   - Switch On: in Notepad, Word and a browser field, `shahar `→`şahar `,
     `oʻzbek `→`özbek `, `чой `→`çoy `; `hello ` unchanged.
   - A browser password field is never modified.
   - Windows Terminal / PowerShell are not transformed.
   - Off stops all transformation immediately; On/Off survives quit and
     relaunch; typing stays responsive.
   - Launch at login survives sign-out/sign-in.
   - No network requests (offline app).

## Success criteria

- A `desktop-v*` tag produces both a `.dmg` and an NSIS installer on one
  draft release; `cargo test` passes on the Windows runner.
- macOS behaviour is unchanged: no shared file changes semantics, macOS
  tests pass, the Mac tray/hotkey/permission flow is untouched.
- The tester's checklist passes on Windows 10 or 11, x64.
- The Windows card on alfavit.uz downloads a working installer, with copy the
  owner has verified.

## Out of scope / deferred

- Code signing on either platform; auto-update; Microsoft Store listing.
- ARM64 and 32-bit Windows; Linux.
- A Text Services Framework backend (robust in-document editing without
  synthetic backspaces).
- Configurable hotkey; UI localisation; settings beyond launch-at-login.
