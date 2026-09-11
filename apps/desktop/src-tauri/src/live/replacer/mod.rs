//! In-place replacement of the word the user just finished. One backend per
//! platform; `win_input` is the pure replacement plan (tests run everywhere).
pub mod win_input;

#[cfg(target_os = "macos")]
mod macos;
#[cfg(target_os = "macos")]
pub use macos::replace_word;

#[cfg(target_os = "windows")]
mod windows;
#[cfg(target_os = "windows")]
pub use windows::replace_word;

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
pub fn replace_word(_typed_len: usize, _reformed: &str, _boundary: char) {}
