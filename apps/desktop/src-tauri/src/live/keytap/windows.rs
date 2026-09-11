//! Windows observer: a WH_KEYBOARD_LL hook on its own message-loop thread
//! enqueues keystrokes; a worker thread runs the guard, classifies, buffers
//! words and dispatches them (bridge → engine → replacer).
use std::cell::Cell;
use std::sync::atomic::{AtomicU64, Ordering};
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

use super::win_keys::{classify, keystroke_text, CapsLock, Modifiers};
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

/// The active observer's channel, tagged with the epoch of the `start_tap`
/// that installed it. The controller releases its lock before the blocking
/// `stop()`, so a `start_tap` can run inside that window; the epoch lets a
/// lagging `stop()` tear down only its own observer.
static SENDER: Mutex<Option<(u64, mpsc::Sender<Observed>)>> = Mutex::new(None);
static EPOCH: AtomicU64 = AtomicU64::new(0);

/// Drop the channel only if it still belongs to `epoch`.
fn clear_sender(epoch: u64) {
    let mut slot = SENDER.lock().unwrap_or_else(|p| p.into_inner());
    if matches!(*slot, Some((e, _)) if e == epoch) {
        *slot = None;
    }
}

thread_local! {
    /// Dead-key state; the callback only runs on the hook thread.
    static DEAD_PENDING: Cell<bool> = const { Cell::new(false) };
    /// Caps Lock toggle state; the callback only runs on the hook thread.
    static CAPS: Cell<CapsLock> = const { Cell::new(CapsLock::seeded(false)) };
}

/// Handle to a running observer. `stop()` ends both threads and joins them.
pub struct TapHandle {
    hook_thread_id: u32,
    hook: Option<JoinHandle<()>>,
    worker: Option<JoinHandle<()>>,
    epoch: u64,
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
        // Dropping the sender ends the worker's `for ev in rx` loop — but only
        // if it is still ours: a concurrent start_tap may have replaced it.
        clear_sender(self.epoch);
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
    if CAPS.with(|c| c.get().is_on()) {
        state[VK_CAPITAL.0 as usize] = 0x01;
    }
    // SAFETY: plain Win32 queries; `state`/`buf` are valid local buffers.
    let text = unsafe {
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
    if let Ok(guard) = SENDER.lock() {
        if let Some((_, tx)) = guard.as_ref() {
            let _ = tx.send(Observed { vk: kb.vkCode, mods, text, generation });
        }
    }
}

unsafe extern "system" fn hook_proc(ncode: i32, wparam: WPARAM, lparam: LPARAM) -> LRESULT {
    if ncode == HC_ACTION as i32 {
        let msg = wparam.0 as u32;
        // SAFETY: for WH_KEYBOARD_LL, lparam points to a KBDLLHOOKSTRUCT for the callback's duration.
        let kb = unsafe { &*(lparam.0 as *const KBDLLHOOKSTRUCT) };
        // Track Caps Lock transitions in both directions — including injected
        // presses, since an injected Caps Lock press toggles the real state
        // too and we never inject one. WM_KEYUP/WM_SYSKEYUP need no import:
        // any non-key-down message for VK_CAPITAL counts as up.
        if kb.vkCode == VK_CAPITAL.0 as u32 {
            let down = msg == WM_KEYDOWN || msg == WM_SYSKEYDOWN;
            CAPS.with(|c| {
                let mut caps = c.get();
                caps.observe(down);
                c.set(caps);
            });
        }
        if msg == WM_KEYDOWN || msg == WM_SYSKEYDOWN {
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
    let epoch = EPOCH.fetch_add(1, Ordering::Relaxed) + 1;
    *SENDER.lock().unwrap() = Some((epoch, tx));
    DEAD_PENDING.with(|d| d.set(false));

    let hook = std::thread::spawn(move || {
        // SAFETY: standard hook installation + message loop on this thread; the
        // hook is removed before the thread exits.
        unsafe {
            let Ok(hmod) = GetModuleHandleW(None) else { return };
            let Ok(hhook) = SetWindowsHookExW(WH_KEYBOARD_LL, Some(hook_proc), Some(hmod.into()), 0) else {
                return;
            };
            // A new thread's key state is a copy of the global state at the
            // moment it is created, so this is a valid one-time seed even
            // though this thread never reads key messages afterward.
            CAPS.with(|c| c.set(CapsLock::seeded((GetKeyState(VK_CAPITAL.0 as i32) & 1) != 0)));
            let _ = ready_tx.send(GetCurrentThreadId());
            let mut msg = MSG::default();
            // Runs the hook until stop() posts WM_QUIT (0) or GetMessageW errors (-1);
            // either ends the loop, unlike `.as_bool()` which treats -1 as "keep going".
            while GetMessageW(&mut msg, None, 0, 0).0 > 0 {}
            let _ = UnhookWindowsHookEx(hhook);
        }
    });

    // If the thread exited before sending (hook install failed), the dropped
    // sender makes recv() Err — report None instead of panicking the caller.
    let Ok(hook_thread_id) = ready_rx.recv() else {
        let _ = hook.join();
        clear_sender(epoch);
        return None;
    };
    let worker = std::thread::spawn(move || worker(app, rx));
    Some(TapHandle { hook_thread_id, hook: Some(hook), worker: Some(worker), epoch })
}
