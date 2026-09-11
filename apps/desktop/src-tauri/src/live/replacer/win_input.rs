//! The keystroke sequence that replaces a finished word, independent of the
//! OS input API. `windows.rs` turns it into one `SendInput` batch.

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Stroke {
    BackspaceDown,
    BackspaceUp,
    /// One UTF-16 code unit typed as a Unicode key event.
    UnicodeDown(u16),
    UnicodeUp(u16),
}

/// Backspace over the typed word and the boundary character, then type the
/// reformed word followed by the same boundary character.
pub fn plan_replacement(typed_len: usize, reformed: &str, boundary: char) -> Vec<Stroke> {
    let mut text = String::from(reformed);
    text.push(boundary);
    let mut plan = Vec::with_capacity((typed_len + 1) * 2 + text.len() * 2);
    for _ in 0..(typed_len + 1) {
        plan.push(Stroke::BackspaceDown);
        plan.push(Stroke::BackspaceUp);
    }
    for unit in text.encode_utf16() {
        plan.push(Stroke::UnicodeDown(unit));
        plan.push(Stroke::UnicodeUp(unit));
    }
    plan
}

#[cfg(test)]
mod tests {
    use super::*;

    fn backspaces(plan: &[Stroke]) -> usize {
        plan.iter().filter(|s| matches!(s, Stroke::BackspaceDown)).count()
    }

    fn typed(plan: &[Stroke]) -> String {
        let units: Vec<u16> = plan
            .iter()
            .filter_map(|s| match s {
                Stroke::UnicodeDown(u) => Some(*u),
                _ => None,
            })
            .collect();
        String::from_utf16(&units).unwrap()
    }

    #[test]
    fn deletes_word_plus_boundary_then_types_reformed_plus_boundary() {
        let plan = plan_replacement(6, "şahar", ' ');
        assert_eq!(backspaces(&plan), 7); // "shahar" + the space
        assert_eq!(typed(&plan), "şahar ");
    }

    #[test]
    fn counts_typed_chars_not_bytes() {
        let plan = plan_replacement(3, "çoy", '.'); // "чой" is 3 chars, 6 bytes
        assert_eq!(backspaces(&plan), 4);
        assert_eq!(typed(&plan), "çoy.");
    }

    #[test]
    fn every_down_has_a_matching_up_in_order() {
        let plan = plan_replacement(1, "ö", ',');
        assert_eq!(
            plan,
            vec![
                Stroke::BackspaceDown,
                Stroke::BackspaceUp,
                Stroke::BackspaceDown,
                Stroke::BackspaceUp,
                Stroke::UnicodeDown('ö' as u16),
                Stroke::UnicodeUp('ö' as u16),
                Stroke::UnicodeDown(',' as u16),
                Stroke::UnicodeUp(',' as u16),
            ]
        );
    }
}
