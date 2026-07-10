import { convertPlainText } from './convert'
import { convertDocx } from './docx'

export class UnsupportedFormatError extends Error {
  constructor(what: string) {
    super(`Unsupported format: ${what}`)
    this.name = 'UnsupportedFormatError'
  }
}

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export function outputFilename(name: string): string {
  const dot = name.lastIndexOf('.')
  const base = dot > 0 ? name.slice(0, dot) : name
  const ext = dot > 0 ? name.slice(dot) : ''
  return `${base} (yangi lotin)${ext}`
}

export async function convertFile(file: File): Promise<{ blob: Blob; filename: string }> {
  const lower = file.name.toLowerCase()
  const filename = outputFilename(file.name)

  if (lower.endsWith('.txt') || lower.endsWith('.srt')) {
    const type = lower.endsWith('.srt') ? 'application/x-subrip' : 'text/plain'
    return { blob: new Blob([convertPlainText(await file.text())], { type }), filename }
  }
  if (lower.endsWith('.docx')) {
    const out = await convertDocx(new Uint8Array(await file.arrayBuffer()))
    return { blob: new Blob([out], { type: DOCX_MIME }), filename }
  }
  const dot = lower.lastIndexOf('.')
  throw new UnsupportedFormatError(dot >= 0 ? lower.slice(dot) : file.name)
}
