// Injected into the page via chrome.scripting.executeScript. MUST be
// self-contained: no imports, no references to module-scope bindings — only
// its argument and page globals (document, navigator).
export function applyConversion(converted: string): void {
  const el = document.activeElement as HTMLElement | null
  const tag = el?.tagName
  if (el && (tag === 'INPUT' || tag === 'TEXTAREA')) {
    const field = el as HTMLInputElement | HTMLTextAreaElement
    const start = field.selectionStart ?? field.value.length
    const end = field.selectionEnd ?? field.value.length
    field.value = field.value.slice(0, start) + converted + field.value.slice(end)
    field.selectionStart = field.selectionEnd = start + converted.length
    field.dispatchEvent(new Event('input', { bubbles: true }))
    return
  }
  if (el && el.isContentEditable) {
    document.execCommand('insertText', false, converted)
    return
  }
  void navigator.clipboard.writeText(converted).catch(() => {})
  const toast = document.createElement('div')
  toast.textContent = 'Copied — new Latin'
  toast.style.cssText =
    'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#000;color:#fff;padding:10px 16px;border-radius:999px;font:14px sans-serif;z-index:2147483647;opacity:.95'
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 1800)
}
