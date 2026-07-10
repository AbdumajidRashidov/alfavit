import { transliterate } from '@alfavit/engine'

export function convertPlainText(text: string): string {
  return transliterate(text).text
}

// The `(?<!\/)` excludes self-closing `<w:t/>` runs from the open-tag match —
// otherwise the lazy inner match would swallow markup up to the next </w:t> and
// corrupt the document (empty <w:t/> runs are common in real Word output).
const WT_RE = /(<w:t\b[^>]*(?<!\/)>)([\s\S]*?)(<\/w:t>)/g

function xmlUnescape(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&') // must be last
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;') // must be first
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function transliterateDocxXml(xml: string): string {
  return xml.replace(WT_RE, (_m, open: string, inner: string, close: string) => {
    const converted = transliterate(xmlUnescape(inner)).text
    return open + xmlEscape(converted) + close
  })
}
