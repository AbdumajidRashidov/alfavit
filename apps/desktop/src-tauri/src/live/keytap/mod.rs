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
