use objc2_app_kit::NSWorkspace;

/// Apps where auto-transform is disabled by default (terminals mangle synthetic
/// backspaces / take raw input).
const DENYLIST: &[&str] = &["com.apple.Terminal", "com.googlecode.iterm2"];

#[link(name = "Carbon", kind = "framework")]
unsafe extern "C" {
    fn IsSecureEventInputEnabled() -> bool;
}

/// True while a password/secure text field has focus anywhere on the system.
pub fn is_secure_input() -> bool {
    unsafe { IsSecureEventInputEnabled() }
}

/// Bundle id of the frontmost application, if available.
pub fn frontmost_bundle_id() -> Option<String> {
    // These objc2-app-kit calls are safe wrappers (no `unsafe` needed).
    let workspace = NSWorkspace::sharedWorkspace();
    let app = workspace.frontmostApplication()?;
    app.bundleIdentifier().map(|s| s.to_string())
}

/// True when the current context must not be transformed.
pub fn is_blocked() -> bool {
    if is_secure_input() {
        return true;
    }
    match frontmost_bundle_id() {
        Some(id) => DENYLIST.contains(&id.as_str()),
        None => false,
    }
}

#[link(name = "ApplicationServices", kind = "framework")]
unsafe extern "C" {
    fn AXIsProcessTrusted() -> bool;
}

/// True when this app has been granted macOS Accessibility permission.
pub fn accessibility_granted() -> bool {
    unsafe { AXIsProcessTrusted() }
}

/// Open the Accessibility pane so the user can grant the permission the
/// observer needs. Called only after an attempt to turn Live transform on failed.
pub fn open_permission_settings() {
    let _ = std::process::Command::new("open")
        .arg("x-apple.systempreferences:com.apple.settings.PrivacySecurity.extension?Privacy_Accessibility")
        .spawn();
}
