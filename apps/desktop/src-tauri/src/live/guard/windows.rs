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
