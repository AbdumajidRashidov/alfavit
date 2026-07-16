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
        // start_tap returns None if the observer thread failed to come up (e.g.
        // permission revoked in the TOCTOU window) — treat as "could not start".
        match keytap::start_tap(app.clone()) {
            Some(handle) => {
                *self.handle.lock().unwrap() = Some(handle);
                true
            }
            None => false,
        }
    }

    fn stop(&self) {
        // Take the handle out and drop the mutex guard BEFORE the blocking
        // stop()/join(), so no other LiveMode call blocks on shutdown.
        let taken = self.handle.lock().unwrap().take();
        if let Some(handle) = taken {
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
