use core_graphics::event::{CGEvent, CGEventTapLocation, EventField};
use core_graphics::event_source::{CGEventSource, CGEventSourceStateID};

use crate::live::keytap::ALFAVIT_MARKER;

const KEY_DELETE: core_graphics::event::CGKeyCode = 51;

fn post(event: &CGEvent) {
    // Stamp so our own tap ignores this synthetic event (no feedback loop).
    event.set_integer_value_field(EventField::EVENT_SOURCE_USER_DATA, ALFAVIT_MARKER);
    event.post(CGEventTapLocation::HID);
}

/// Delete the word the user just finished (plus the boundary char they typed)
/// and type the reformed word followed by the same boundary char.
pub fn replace_word(typed_len: usize, reformed: &str, boundary: char) {
    let Ok(source) = CGEventSource::new(CGEventSourceStateID::HIDSystemState) else {
        return;
    };
    // Backspace over the word and the boundary char.
    for _ in 0..(typed_len + 1) {
        if let Ok(down) = CGEvent::new_keyboard_event(source.clone(), KEY_DELETE, true) {
            post(&down);
        }
        if let Ok(up) = CGEvent::new_keyboard_event(source.clone(), KEY_DELETE, false) {
            post(&up);
        }
    }
    // Type the reformed word + boundary char back.
    let mut out = String::from(reformed);
    out.push(boundary);
    if let Ok(event) = CGEvent::new_keyboard_event(source.clone(), 0, true) {
        event.set_string(&out);
        post(&event);
    }
}
