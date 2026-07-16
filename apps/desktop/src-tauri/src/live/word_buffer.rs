#[derive(Debug, Clone, PartialEq)]
pub enum Key {
    Char(char),
    Backspace,
    Boundary(char),
    Reset,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Emitted {
    pub word: String,
    pub boundary: char,
    pub typed_len: usize,
}

#[derive(Default)]
pub struct WordBuffer {
    buf: String,
}

impl WordBuffer {
    pub fn new() -> Self {
        Self { buf: String::new() }
    }

    pub fn push(&mut self, key: Key) -> Option<Emitted> {
        match key {
            Key::Char(c) => {
                self.buf.push(c);
                None
            }
            Key::Backspace => {
                self.buf.pop();
                None
            }
            Key::Reset => {
                self.buf.clear();
                None
            }
            Key::Boundary(boundary) => {
                if self.buf.is_empty() {
                    None
                } else {
                    let word = std::mem::take(&mut self.buf);
                    let typed_len = word.chars().count();
                    Some(Emitted { word, boundary, typed_len })
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn feed(seq: &[Key]) -> Vec<Emitted> {
        let mut wb = WordBuffer::new();
        seq.iter().filter_map(|k| wb.push(k.clone())).collect()
    }

    #[test]
    fn emits_word_on_boundary_with_typed_len() {
        let out = feed(&[
            Key::Char('s'), Key::Char('h'), Key::Char('a'),
            Key::Char('h'), Key::Char('a'), Key::Char('r'),
            Key::Boundary(' '),
        ]);
        assert_eq!(out, vec![Emitted { word: "shahar".into(), boundary: ' ', typed_len: 6 }]);
    }

    #[test]
    fn backspace_pops_and_reset_clears() {
        // type "wronk", backspace to "wron", then reset, then "choy " -> only "choy"
        let out = feed(&[
            Key::Char('w'), Key::Char('r'), Key::Char('o'), Key::Char('n'), Key::Char('k'),
            Key::Backspace,
            Key::Reset,
            Key::Char('c'), Key::Char('h'), Key::Char('o'), Key::Char('y'),
            Key::Boundary('.'),
        ]);
        assert_eq!(out, vec![Emitted { word: "choy".into(), boundary: '.', typed_len: 4 }]);
    }

    #[test]
    fn boundary_on_empty_buffer_emits_nothing() {
        let out = feed(&[Key::Boundary(' '), Key::Boundary(' ')]);
        assert!(out.is_empty());
    }

    #[test]
    fn counts_chars_not_bytes_for_cyrillic() {
        // Cyrillic "чой" is 3 chars (6 bytes) -> typed_len 3
        let out = feed(&[Key::Char('ч'), Key::Char('о'), Key::Char('й'), Key::Boundary(' ')]);
        assert_eq!(out, vec![Emitted { word: "чой".into(), boundary: ' ', typed_len: 3 }]);
    }
}
