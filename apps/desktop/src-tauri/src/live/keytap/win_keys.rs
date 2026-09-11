//! Windows virtual-key → `Key` mapping. Pure and platform-independent so the
//! tests run on every host; the hook (`windows.rs`) feeds it real events.
use crate::live::word_buffer::Key;

pub const VK_BACK: u32 = 0x08;
pub const VK_TAB: u32 = 0x09;
pub const VK_RETURN: u32 = 0x0D;
pub const VK_ESCAPE: u32 = 0x1B;
pub const VK_PRIOR: u32 = 0x21; // Page Up
pub const VK_DOWN: u32 = 0x28; // Down arrow; 0x21..=0x28 is PgUp, PgDn, End, Home, ←, ↑, →, ↓
pub const VK_HOME: u32 = 0x24;
pub const VK_LEFT: u32 = 0x25;
pub const VK_INSERT: u32 = 0x2D;
pub const VK_DELETE: u32 = 0x2E;

/// Modifier state at the moment of the keystroke (Shift is folded into the
/// text by `ToUnicodeEx`, so it is not needed here).
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct Modifiers {
    pub ctrl: bool,
    pub alt: bool,
    pub win: bool,
}

/// Win, or exactly one of Ctrl/Alt, means a shortcut or menu accelerator.
/// Ctrl+Alt together is AltGr, which types characters on many layouts.
fn is_shortcut(m: Modifiers) -> bool {
    m.win || (m.ctrl != m.alt)
}

/// Map a raw Windows key event to an abstract `Key`.
pub fn classify(vk: u32, mods: Modifiers, text: &str) -> Key {
    if is_shortcut(mods) {
        return Key::Reset;
    }
    match vk {
        VK_BACK => return Key::Backspace,
        VK_RETURN | VK_TAB | VK_ESCAPE => return Key::Reset,
        VK_PRIOR..=VK_DOWN => return Key::Reset, // navigation cluster + arrows
        VK_INSERT | VK_DELETE => return Key::Reset,
        _ => {}
    }
    let mut chars = text.chars();
    match (chars.next(), chars.next()) {
        (Some(c), None) => {
            if c == ' ' || ".,!?;:".contains(c) {
                Key::Boundary(c)
            } else if c.is_control() {
                Key::Reset
            } else {
                Key::Char(c)
            }
        }
        _ => Key::Reset, // empty or multi-char string
    }
}

/// Caps Lock toggle state, tracked from observed key events. `GetKeyState`
/// only reflects a thread's own input queue and the hook thread never reads
/// key messages, so the toggle is seeded once from the OS when the hook
/// thread starts (a new thread's key state is a copy of the global state at
/// that moment) and then flipped on each Caps Lock press. A held key
/// auto-repeats; only the first key-down of a press toggles.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct CapsLock {
    on: bool,
    held: bool,
}

impl CapsLock {
    pub const fn seeded(on: bool) -> Self {
        Self { on, held: false }
    }

    pub fn is_on(self) -> bool {
        self.on
    }

    /// Feed every Caps Lock key event: `down` is true for key-down, false for key-up.
    pub fn observe(&mut self, down: bool) {
        if down {
            if !self.held {
                self.on = !self.on;
                self.held = true;
            }
        } else {
            self.held = false;
        }
    }
}

/// The text a keystroke produced, given `ToUnicodeEx`'s return value `n` and
/// its buffer. A dead key (`n < 0`) produces nothing and poisons the next key:
/// we do not track composition, so that key's real character is unknown and it
/// must not be buffered as a plain letter.
pub fn keystroke_text(n: i32, buf: &[u16], dead_pending: &mut bool) -> String {
    if n < 0 {
        *dead_pending = true;
        return String::new();
    }
    if *dead_pending {
        *dead_pending = false;
        return String::new();
    }
    let n = (n as usize).min(buf.len());
    String::from_utf16_lossy(&buf[..n])
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::live::word_buffer::Key;

    const NONE: Modifiers = Modifiers { ctrl: false, alt: false, win: false };
    const CTRL: Modifiers = Modifiers { ctrl: true, alt: false, win: false };
    const ALT: Modifiers = Modifiers { ctrl: false, alt: true, win: false };
    const ALTGR: Modifiers = Modifiers { ctrl: true, alt: true, win: false };
    const WIN: Modifiers = Modifiers { ctrl: false, alt: false, win: true };

    #[test]
    fn shortcuts_reset() {
        assert_eq!(classify(0x43, CTRL, "c"), Key::Reset); // Ctrl+C
        assert_eq!(classify(0x46, ALT, "f"), Key::Reset); // Alt+F (menu)
        assert_eq!(classify(0x41, WIN, "a"), Key::Reset); // Win+A
        assert_eq!(classify(0x41, Modifiers { ctrl: false, alt: true, win: false }, "A"), Key::Reset); // Alt+Shift+A hotkey
    }

    #[test]
    fn altgr_is_text() {
        assert_eq!(classify(0x51, ALTGR, "@"), Key::Char('@'));
    }

    #[test]
    fn special_keys() {
        assert_eq!(classify(VK_BACK, NONE, "\u{8}"), Key::Backspace);
        assert_eq!(classify(VK_RETURN, NONE, "\r"), Key::Reset);
        assert_eq!(classify(VK_TAB, NONE, "\t"), Key::Reset);
        assert_eq!(classify(VK_ESCAPE, NONE, "\u{1b}"), Key::Reset);
        assert_eq!(classify(VK_LEFT, NONE, ""), Key::Reset);
        assert_eq!(classify(VK_HOME, NONE, ""), Key::Reset);
        assert_eq!(classify(VK_DELETE, NONE, ""), Key::Reset);
    }

    #[test]
    fn boundary_and_char() {
        assert_eq!(classify(0x20, NONE, " "), Key::Boundary(' '));
        assert_eq!(classify(0xBE, NONE, "."), Key::Boundary('.'));
        assert_eq!(classify(0x53, NONE, "s"), Key::Char('s'));
        assert_eq!(classify(0x58, NONE, "ч"), Key::Char('ч')); // Cyrillic layout
    }

    #[test]
    fn empty_or_multichar_text_resets() {
        assert_eq!(classify(0x41, NONE, ""), Key::Reset);
        assert_eq!(classify(0x41, NONE, "ab"), Key::Reset);
    }

    #[test]
    fn keystroke_text_reads_utf16_prefix() {
        let mut dead = false;
        let buf = ['ş' as u16, 0, 0, 0];
        assert_eq!(keystroke_text(1, &buf, &mut dead), "ş");
        assert!(!dead);
        assert_eq!(keystroke_text(0, &buf, &mut dead), "");
    }

    #[test]
    fn dead_key_poisons_the_next_key_only() {
        let mut dead = false;
        let buf = ['a' as u16, 0, 0, 0];
        assert_eq!(keystroke_text(-1, &buf, &mut dead), ""); // dead key itself
        assert!(dead);
        assert_eq!(keystroke_text(1, &buf, &mut dead), ""); // composed char unknown → no text
        assert!(!dead);
        assert_eq!(keystroke_text(1, &buf, &mut dead), "a"); // back to normal
    }

    #[test]
    fn caps_lock_seed_is_reported() {
        assert!(CapsLock::seeded(true).is_on());
        assert!(!CapsLock::seeded(false).is_on());
    }

    #[test]
    fn caps_lock_toggles_once_per_press_despite_auto_repeat() {
        let mut caps = CapsLock::seeded(false);
        caps.observe(true); // press
        assert!(caps.is_on());
        caps.observe(true); // auto-repeat while held
        caps.observe(true);
        assert!(caps.is_on());
        caps.observe(false); // release
        caps.observe(true); // second press
        assert!(!caps.is_on());
    }
}
