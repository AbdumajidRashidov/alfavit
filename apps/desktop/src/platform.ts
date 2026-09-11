/** True when the panel runs in WebView2 on Windows. Copy that names an OS
 *  setting (the macOS Accessibility pane) branches on this. */
export function isWindows(): boolean {
  return typeof navigator !== 'undefined' && /Windows NT/.test(navigator.userAgent)
}
