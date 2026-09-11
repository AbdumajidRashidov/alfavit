use std::sync::Mutex;

use tauri::{AppHandle, Manager, State};

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

    /// Explicitly set the switch on/off (used by the in-panel toggle). Returns
    /// the resulting enabled state (false if On could not start for lack of
    /// permission).
    pub fn set(&self, app: &tauri::AppHandle, on: bool) -> bool {
        if on {
            let started = if self.is_enabled() { true } else { self.start(app) };
            save_enabled(app, started);
            started
        } else {
            self.stop();
            save_enabled(app, false);
            false
        }
    }

    /// On launch: if it was On last time and permission is still granted, resume.
    pub fn restore(&self, app: &tauri::AppHandle) {
        if config_enabled(app) && guard::accessibility_granted() {
            self.start(app);
        }
    }
}

/// Current live-transform state, so the panel toggle reflects reality on open.
#[tauri::command]
pub fn live_transform_enabled(live: State<LiveMode>) -> bool {
    live.is_enabled()
}

/// Set live transform on/off from the UI; returns the resulting state. If the
/// user asked to turn it on but Accessibility isn't granted, opens the pane so
/// they can grant it (then toggle again).
#[tauri::command]
pub fn set_live_transform(on: bool, app: AppHandle, live: State<LiveMode>) -> bool {
    let now_on = live.set(&app, on);
    if on && !now_on && !guard::accessibility_granted() {
        guard::open_permission_settings();
    }
    now_on
}
