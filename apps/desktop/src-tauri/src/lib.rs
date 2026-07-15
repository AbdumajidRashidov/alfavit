use tauri::{
    menu::{CheckMenuItem, Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WebviewWindow,
};
use tauri_plugin_autostart::ManagerExt;

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
        .setup(|app| {
            // Menu-bar (accessory) app: tray icon only, no Dock icon.
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

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
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &launch_at_login, &quit_i])?;

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
        .run(tauri::generate_context!())
        .expect("error while running Alfavit desktop");
}
