//! Windows observer — Task 8 replaces this stub with the WH_KEYBOARD_LL hook.
pub struct TapHandle;

impl TapHandle {
    pub fn stop(self) {}
}

pub fn start_tap(_app: tauri::AppHandle) -> Option<TapHandle> {
    None
}
