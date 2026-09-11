//! Windows guard. Windows has no system-wide "secure input" flag, so the
//! password check is best-effort via UI Automation: browsers, Win32 EDIT
//! controls with ES_PASSWORD and WinUI PasswordBox all report `IsPassword`.
//! Terminal apps are excluded by executable name.
use std::cell::RefCell;

use windows::core::{BOOL, PWSTR};
use windows::Win32::Foundation::{CloseHandle, HWND};
use windows::Win32::System::Com::{
    CoCreateInstance, CoInitializeEx, CLSCTX_INPROC_SERVER, COINIT_MULTITHREADED,
};
use windows::Win32::System::Threading::{
    OpenProcess, QueryFullProcessImageNameW, PROCESS_NAME_WIN32, PROCESS_QUERY_LIMITED_INFORMATION,
};
use windows::Win32::UI::Accessibility::{CUIAutomation, IUIAutomation};
use windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, GetWindowThreadProcessId};

use super::win_denylist::is_denylisted;

thread_local! {
    /// One UI Automation client per thread: COM objects are apartment-bound,
    /// and `is_blocked` only ever runs on the observer's worker thread.
    static UIA: RefCell<Option<IUIAutomation>> = const { RefCell::new(None) };
}

fn uia() -> Option<IUIAutomation> {
    UIA.with(|slot| {
        if slot.borrow().is_none() {
            // SAFETY: plain COM initialisation/creation; failure leaves the slot
            // empty and the guard degrades to "not a password field".
            unsafe {
                // Already-initialised (S_FALSE) and mode-mismatch results still leave
                // COM usable on this thread, so the HRESULT is deliberately ignored.
                let _ = CoInitializeEx(None, COINIT_MULTITHREADED);
                if let Ok(a) = CoCreateInstance::<_, IUIAutomation>(&CUIAutomation, None, CLSCTX_INPROC_SERVER) {
                    *slot.borrow_mut() = Some(a);
                }
            }
        }
        slot.borrow().clone()
    })
}

/// Best-effort: true when the focused UI element reports itself as a password field.
pub fn is_secure_input() -> bool {
    let Some(uia) = uia() else { return false };
    // SAFETY: COM calls on an interface owned by this thread.
    unsafe {
        match uia.GetFocusedElement() {
            Ok(el) => el.CurrentIsPassword().map(|b: BOOL| b.as_bool()).unwrap_or(false),
            Err(_) => false,
        }
    }
}

/// Full image path of the foreground window's process, if readable.
pub fn frontmost_exe() -> Option<String> {
    // SAFETY: Win32 calls with valid, locally owned buffers; the handle is closed.
    unsafe {
        let hwnd: HWND = GetForegroundWindow();
        if hwnd.0.is_null() {
            return None;
        }
        let mut pid = 0u32;
        GetWindowThreadProcessId(hwnd, Some(&mut pid));
        if pid == 0 {
            return None;
        }
        let handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid).ok()?;
        let mut buf = [0u16; 1024];
        let mut len = buf.len() as u32;
        let result = QueryFullProcessImageNameW(handle, PROCESS_NAME_WIN32, PWSTR(buf.as_mut_ptr()), &mut len);
        let _ = CloseHandle(handle);
        result.ok()?;
        Some(String::from_utf16_lossy(&buf[..len as usize]))
    }
}

/// True when the current context must not be observed or transformed.
pub fn is_blocked() -> bool {
    if is_secure_input() {
        return true;
    }
    frontmost_exe().map(|path| is_denylisted(&path)).unwrap_or(false)
}

/// A low-level keyboard hook needs no permission on Windows.
pub fn accessibility_granted() -> bool {
    true
}

/// Nothing to open: there is no permission to grant on Windows.
pub fn open_permission_settings() {}
