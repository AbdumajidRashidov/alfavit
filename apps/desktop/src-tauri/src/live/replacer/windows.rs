//! Windows replacer: the whole edit goes out as ONE `SendInput` batch, which
//! lands atomically in the input queue (tighter than macOS's per-event posting).
use windows::Win32::UI::Input::KeyboardAndMouse::{
    MapVirtualKeyW, SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT, KEYBD_EVENT_FLAGS,
    KEYEVENTF_KEYUP, KEYEVENTF_UNICODE, MAPVK_VK_TO_VSC, VIRTUAL_KEY, VK_BACK,
};

use super::win_input::{plan_replacement, Stroke};
use crate::live::keytap::ALFAVIT_MARKER;

fn key(vk: VIRTUAL_KEY, scan: u16, flags: KEYBD_EVENT_FLAGS) -> INPUT {
    INPUT {
        r#type: INPUT_KEYBOARD,
        Anonymous: INPUT_0 {
            ki: KEYBDINPUT {
                wVk: vk,
                wScan: scan,
                dwFlags: flags,
                time: 0,
                // Stamp so our own hook ignores these events (no feedback loop).
                dwExtraInfo: ALFAVIT_MARKER as usize,
            },
        },
    }
}

/// Delete the word the user just finished (plus the boundary char they typed)
/// and type the reformed word followed by the same boundary char.
pub fn replace_word(typed_len: usize, reformed: &str, boundary: char) {
    // SAFETY: MapVirtualKeyW has no preconditions.
    let back_scan = unsafe { MapVirtualKeyW(VK_BACK.0 as u32, MAPVK_VK_TO_VSC) } as u16;
    let inputs: Vec<INPUT> = plan_replacement(typed_len, reformed, boundary)
        .into_iter()
        .map(|stroke| match stroke {
            Stroke::BackspaceDown => key(VK_BACK, back_scan, KEYBD_EVENT_FLAGS::default()),
            Stroke::BackspaceUp => key(VK_BACK, back_scan, KEYEVENTF_KEYUP),
            Stroke::UnicodeDown(u) => key(VIRTUAL_KEY(0), u, KEYEVENTF_UNICODE),
            Stroke::UnicodeUp(u) => key(VIRTUAL_KEY(0), u, KEYEVENTF_UNICODE | KEYEVENTF_KEYUP),
        })
        .collect();
    // A short count means the target window is elevated (UIPI blocks input from
    // a normal-privilege process). Nothing to retry: the word stays as typed.
    // SAFETY: `inputs` is a valid slice of correctly sized INPUT structs.
    let _sent = unsafe { SendInput(&inputs, std::mem::size_of::<INPUT>() as i32) };
}
