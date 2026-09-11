//! Apps where auto-transform is disabled: terminals take raw input and mangle
//! synthetic backspaces. Matched on the executable file name.

const DENYLIST: &[&str] = &[
    "windowsterminal.exe",
    "cmd.exe",
    "powershell.exe",
    "pwsh.exe",
    "conhost.exe",
    "mintty.exe",
    "alacritty.exe",
    "wezterm-gui.exe",
];

/// True when `image_path` (full path or bare file name) is a denylisted app.
pub fn is_denylisted(image_path: &str) -> bool {
    let name = image_path
        .rsplit(['\\', '/'])
        .next()
        .unwrap_or(image_path)
        .to_ascii_lowercase();
    DENYLIST.contains(&name.as_str())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn matches_terminals_by_file_name_case_insensitively() {
        assert!(is_denylisted(r"C:\Program Files\WindowsApps\Microsoft.WindowsTerminal_1.x\WindowsTerminal.exe"));
        assert!(is_denylisted(r"C:\WINDOWS\system32\cmd.exe"));
        assert!(is_denylisted("POWERSHELL.EXE"));
        assert!(is_denylisted(r"C:\Program Files\PowerShell\7\pwsh.exe"));
        assert!(is_denylisted(r"C:\Program Files\WezTerm\wezterm-gui.exe"));
    }

    #[test]
    fn everything_else_passes() {
        assert!(!is_denylisted(r"C:\Windows\System32\notepad.exe"));
        assert!(!is_denylisted(r"C:\Program Files\Microsoft Office\root\Office16\WINWORD.EXE"));
        assert!(!is_denylisted(r"C:\Program Files\Google\Chrome\Application\chrome.exe"));
        assert!(!is_denylisted(""));
    }
}
