use crate::live::word_buffer::Key;

/// Marker stamped on our own synthetic events (EVENT_SOURCE_USER_DATA) so the
/// tap can ignore them and avoid a feedback loop.
pub const ALFAVIT_MARKER: i64 = 0x0A1F_A710;

/// Map a raw key event to an abstract `Key`. Pure — unit-tested.
/// macOS virtual keycodes: Delete=51, Return=36, Tab=48, Escape=53,
/// KeypadEnter=76, arrows=123..=126, Home/End/PageUp/PageDown/etc=115..=121.
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

use std::cell::RefCell;
use std::sync::atomic::AtomicU64;

use core_foundation::runloop::{kCFRunLoopCommonModes, CFRunLoop, CFRunLoopRef};
use core_graphics::event::{
    CGEvent, CGEventFlags, CGEventTap, CGEventTapLocation, CGEventTapOptions,
    CGEventTapPlacement, CGEventType, CallbackResult, EventField,
};
use foreign_types::ForeignType;

use crate::live::word_buffer::{Emitted, WordBuffer};

use core_foundation::base::TCFType;
use std::sync::Mutex;
use tauri::Manager;

/// The running tap's mach port, so the callback can re-enable the tap if macOS
/// disables it. Updated each time the tap starts.
struct SendPort(core_foundation::mach_port::CFMachPortRef);
unsafe impl Send for SendPort {}
static TAP_PORT: Mutex<Option<SendPort>> = Mutex::new(None);

/// Handle to a running observer thread. `stop()` ends the tap and joins.
pub struct TapHandle {
    runloop: SendRunLoop,
    thread: Option<std::thread::JoinHandle<()>>,
}

struct SendRunLoop(CFRunLoopRef);
// CFRunLoopStop is documented thread-safe; we only ever call stop() cross-thread.
unsafe impl Send for SendRunLoop {}

impl TapHandle {
    /// Stop the observer: stop its run loop (ends `run_current`) and join.
    pub fn stop(mut self) {
        unsafe {
            CFRunLoop::wrap_under_get_rule(self.runloop.0).stop();
        }
        if let Some(t) = self.thread.take() {
            let _ = t.join();
        }
    }
}

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
    fn CGEventTapEnable(tap: core_foundation::mach_port::CFMachPortRef, enable: bool);
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
    let n = (actual as usize).min(buf.len());
    String::from_utf16_lossy(&buf[..n])
}

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

/// Spawn the observer thread: install a keyDown tap, feed the word buffer, and
/// deliver finished words to `on_word`. Runs its own CFRunLoop.
pub fn start_tap(app: tauri::AppHandle) -> Option<TapHandle> {
    let (tx, rx) = std::sync::mpsc::channel::<SendRunLoop>();
    let thread = std::thread::spawn(move || {
        let buffer = RefCell::new(WordBuffer::new());
        let tap = CGEventTap::new(
            CGEventTapLocation::HID,
            CGEventTapPlacement::HeadInsertEventTap,
            CGEventTapOptions::ListenOnly,
            // Only KeyDown is registered in the mask. The TapDisabled* sentinel
            // values (0xFFFFFFFE/FF) must NOT go in the mask — the crate folds
            // it via `1 << etype`, which overflows and panics. macOS delivers
            // the disable notifications to the callback regardless of the mask.
            vec![CGEventType::KeyDown],
            move |_proxy, etype, event| {
                if matches!(
                    etype,
                    CGEventType::TapDisabledByTimeout | CGEventType::TapDisabledByUserInput
                ) {
                    if let Some(p) = TAP_PORT.lock().unwrap().as_ref() {
                        unsafe { CGEventTapEnable(p.0, true) };
                    }
                    return CallbackResult::Keep;
                }
                // Ignore our own synthetic events (marker) to avoid a loop.
                if event.get_integer_value_field(EventField::EVENT_SOURCE_USER_DATA)
                    == ALFAVIT_MARKER
                {
                    return CallbackResult::Keep;
                }
                // Never observe/transform in password fields or excluded apps.
                if crate::live::guard::is_blocked() {
                    return CallbackResult::Keep;
                }
                let keycode = event.get_integer_value_field(EventField::KEYBOARD_EVENT_KEYCODE);
                let flags = event.get_flags();
                let has_cmd = flags.contains(CGEventFlags::CGEventFlagCommand);
                let has_ctrl = flags.contains(CGEventFlags::CGEventFlagControl);
                let unicode = event_string(event);
                let key = classify(keycode, has_cmd, has_ctrl, &unicode);

                // Bump on EVERY observed key (not just Char/Backspace): any
                // subsequent keystroke — including the next space/punctuation or
                // a nav key arriving during the transform round-trip — must abort
                // a pending replace. Otherwise `replace_word` would backspace a
                // now-shifted span and corrupt text on common "word, "/"word. "
                // input. This degrades the race to a harmless missed-replace.
                // (Note: mouse clicks that reposition the cursor are not observed,
                // so a click mid-round-trip can still mis-target — inherent to the
                // approach, accepted for Phase 2.)
                GENERATION.fetch_add(1, std::sync::atomic::Ordering::Relaxed);

                if let Some(emitted) = buffer.borrow_mut().push(key) {
                    on_word(&app, emitted);
                }
                CallbackResult::Keep
            },
        );
        // Tap creation can fail if Accessibility was revoked between the
        // caller's permission check and here. Exit the thread cleanly; the
        // dropped sender makes the caller's rx.recv() return Err (-> None),
        // rather than panicking the calling (tray/main) thread.
        let tap = match tap {
            Ok(t) => t,
            Err(_) => return,
        };

        *TAP_PORT.lock().unwrap() = Some(SendPort(tap.mach_port().as_concrete_TypeRef()));

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

    match rx.recv() {
        Ok(runloop) => Some(TapHandle { runloop, thread: Some(thread) }),
        Err(_) => {
            // Thread exited before sending (tap creation failed) — join and report None.
            let _ = thread.join();
            None
        }
    }
}
