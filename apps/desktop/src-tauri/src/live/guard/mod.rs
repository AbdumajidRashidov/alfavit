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
