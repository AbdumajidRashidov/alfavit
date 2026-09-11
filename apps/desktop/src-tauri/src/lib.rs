use tauri::{
    menu::{CheckMenuItem, Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WebviewWindow,
};
use tauri_plugin_autostart::ManagerExt;

pub mod live;

// Toggle the panel: hide it if it is currently visible, otherwise show + focus.
fn toggle_panel(window: &WebviewWindow) {
    if window.is_visible().unwrap_or(false) {
        let _ = window.hide();
    } else {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None::<Vec<&str>>,
        ))
        .manage(live::bridge::TransformBridge::default())
        .manage(live::controller::LiveMode::default())
        .invoke_handler(tauri::generate_handler![
            live::bridge::submit_transform,
            live::controller::live_transform_enabled,
            live::controller::set_live_transform,
        ])
        .setup(|app| {
            // Show BOTH a Dock icon and the menu-bar tray icon. Regular is the
            // default policy (Dock icon + Cmd-Tab presence); the tray icon below
            // is created regardless of policy. Clicking the Dock icon is handled
            // by the RunEvent::Reopen arm below so it reveals the panel.
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Regular);

            // Restore persisted live-transform state BEFORE building the tray, so
            // the "Live transform" checkbox reflects the actual (possibly resumed)
            // state instead of always rendering unchecked on launch.
            app.state::<live::controller::LiveMode>().restore(app.handle());

            // Tray menu: Show / Launch at login (checkable) / Quit.
            let launch_at_login = CheckMenuItem::with_id(
                app,
                "launch_at_login",
                "Launch at login",
                true,
                app.autolaunch().is_enabled().unwrap_or(false),
                None::<&str>,
            )?;
            let show_i = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
            let live_item = CheckMenuItem::with_id(
                app,
                "live_transform",
                "Live transform",
                true,
                app.state::<live::controller::LiveMode>().is_enabled(),
                None::<&str>,
            )?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &live_item, &launch_at_login, &quit_i])?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                    "launch_at_login" => {
                        let mgr = app.autolaunch();
                        if mgr.is_enabled().unwrap_or(false) {
                            let _ = mgr.disable();
                        } else {
                            let _ = mgr.enable();
                        }
                    }
                    "live_transform" => {
                        let live = app.state::<live::controller::LiveMode>();
                        let was_on = live.is_enabled();
                        let now_on = live.toggle(app);
                        // Only prompt for Accessibility when the user tried to turn
                        // it ON and it couldn't start — never when turning it off.
                        if !was_on && !now_on && !live::guard::accessibility_granted() {
                            // Needs permission: open the pane so the user can grant it.
                            live::guard::open_permission_settings();
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        if let Some(w) = tray.app_handle().get_webview_window("main") {
                            toggle_panel(&w);
                        }
                    }
                })
                .build(app)?;

            // Global hotkey: Option+Shift+A toggles the panel from any app.
            #[cfg(desktop)]
            {
                use tauri_plugin_global_shortcut::{
                    Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState,
                };
                let toggle = Shortcut::new(Some(Modifiers::ALT | Modifiers::SHIFT), Code::KeyA);
                app.handle().plugin(
                    tauri_plugin_global_shortcut::Builder::new()
                        .with_handler(move |app, shortcut, event| {
                            if shortcut == &toggle && event.state() == ShortcutState::Pressed {
                                if let Some(w) = app.get_webview_window("main") {
                                    toggle_panel(&w);
                                }
                            }
                        })
                        .build(),
                )?;
                app.global_shortcut().register(toggle)?;
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            // Hide the panel when it loses focus (e.g. the user clicks elsewhere).
            if let tauri::WindowEvent::Focused(false) = event {
                let _ = window.hide();
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building Alfavit desktop")
        .run(|app_handle, event| {
            // Clicking the Dock icon (macOS) reveals the panel — otherwise, since
            // the window hides on blur, a Dock click on the running app does nothing.
            // `RunEvent::Reopen` only exists on macOS; Windows has no Dock.
            #[cfg(target_os = "macos")]
            if let tauri::RunEvent::Reopen { .. } = event {
                if let Some(w) = app_handle.get_webview_window("main") {
                    let _ = w.show();
                    let _ = w.set_focus();
                }
            }
            #[cfg(not(target_os = "macos"))]
            let _ = (app_handle, event);
        });
}
