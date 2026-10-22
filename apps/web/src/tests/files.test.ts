import { expect, test } from 'vitest'
import JSZip from 'jszip'
import { convertDocx } from '../files/docx'
import { convertFile, outputFilename, UnsupportedFormatError } from '../files/index'

test('outputFilename inserts the suffix before the extension', () => {
  expect(outputFilename('hujjat.docx')).toBe('hujjat (yangi lotin).docx')
  expect(outputFilename('notes')).toBe('notes (yangi lotin)')
})

test('convertDocx transliterates document.xml text, preserves the zip', async () => {
  const zip = new JSZip()
  zip.file('word/document.xml', '<w:document><w:body><w:p><w:r><w:t>Салом дунё</w:t></w:r></w:p></w:body></w:document>')
  zip.file('word/styles.xml', '<styles/>') // untouched entry
  const bytes = await zip.generateAsync({ type: 'uint8array' })

  const out = await convertDocx(bytes)
  const rt = await JSZip.loadAsync(out)
  expect(await rt.file('word/document.xml')!.async('string')).toContain('Salom dunyo')
  expect(await rt.file('word/styles.xml')!.async('string')).toBe('<styles/>')
})

test('convertDocx transliterates footnotes and endnotes', async () => {
  // Word's own notes parts: separator notes, then each note's paragraph led by its number mark.
  const notes = (kind: 'footnote' | 'endnote', text: string) =>
    `<w:${kind}s><w:${kind} w:type="separator" w:id="-1"><w:p><w:r><w:separator/></w:r></w:p></w:${kind}>`
    + `<w:${kind} w:id="1"><w:p><w:r><w:rPr><w:rStyle w:val="${kind === 'footnote' ? 'Footnote' : 'Endnote'}Reference"/></w:rPr><w:${kind}Ref/></w:r>`
    + `<w:r><w:t xml:space="preserve"> ${text}</w:t></w:r></w:p></w:${kind}></w:${kind}s>`
  const zip = new JSZip()
  zip.file('word/document.xml', '<w:document><w:body><w:p><w:r><w:t>Қонун</w:t></w:r></w:p></w:body></w:document>')
  zip.file('word/footnotes.xml', notes('footnote', 'Ўзбекистон Республикаси қонуни'))
  zip.file('word/endnotes.xml', notes('endnote', 'Тошкент шаҳри'))
  const bytes = await zip.generateAsync({ type: 'uint8array' })

  const rt = await JSZip.loadAsync(await convertDocx(bytes))
  expect(await rt.file('word/footnotes.xml')!.async('string'))
    .toBe(notes('footnote', 'Özbekiston Respublikasi qonuni'))
  expect(await rt.file('word/endnotes.xml')!.async('string')).toBe(notes('endnote', 'Toşkent şahri'))
})

test('convertFile converts a .txt File and names the download', async () => {
  const file = new File(['салом'], 'note.txt', { type: 'text/plain' })
  const { blob, filename } = await convertFile(file)
  expect(await blob.text()).toBe('salom')
  expect(filename).toBe('note (yangi lotin).txt')
})

test('convertFile rejects unsupported types', async () => {
  const file = new File(['x'], 'a.pdf', { type: 'application/pdf' })
  await expect(convertFile(file)).rejects.toBeInstanceOf(UnsupportedFormatError)
})
