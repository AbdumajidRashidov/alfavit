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

test('convertDocx transliterates comment text and leaves comment attributes as they are', async () => {
  // Word's comments part: each comment's paragraph starts with its annotation mark.
  const comments = (text: string) =>
    '<w:comments><w:comment w:id="0" w:author="Абдумажид" w:date="2026-10-23T10:00:00Z" w:initials="А">'
    + '<w:p><w:pPr><w:pStyle w:val="CommentText"/></w:pPr><w:r><w:rPr><w:rStyle w:val="CommentReference"/></w:rPr><w:annotationRef/></w:r>'
    + `<w:r><w:t>${text}</w:t></w:r></w:p></w:comment></w:comments>`
  const zip = new JSZip()
  zip.file('word/document.xml', '<w:document><w:body><w:p><w:r><w:t>Қонун</w:t></w:r></w:p></w:body></w:document>')
  zip.file('word/comments.xml', comments('Шу бандни текширинг'))
  const bytes = await zip.generateAsync({ type: 'uint8array' })

  const rt = await JSZip.loadAsync(await convertDocx(bytes))
  expect(await rt.file('word/comments.xml')!.async('string')).toBe(comments('Şu bandni tekşiring'))
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
