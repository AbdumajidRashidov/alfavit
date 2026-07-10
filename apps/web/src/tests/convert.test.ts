import { expect, test } from 'vitest'
import { convertPlainText, transliterateDocxXml } from '../files/convert'

test('convertPlainText converts Cyrillic and old-Latin', () => {
  expect(convertPlainText('салом дунё')).toBe('salom dunyo')
  expect(convertPlainText("o'zbek")).toBe('ŏzbek')
})

test('convertPlainText preserves .srt timecodes and indices', () => {
  const srt = '1\n00:00:01,000 --> 00:00:04,000\nСалом дунё\n'
  expect(convertPlainText(srt)).toBe('1\n00:00:01,000 --> 00:00:04,000\nSalom dunyo\n')
})

test('transliterateDocxXml converts w:t text, preserves tags and attrs', () => {
  expect(transliterateDocxXml('<w:t>Салом</w:t>')).toBe('<w:t>Salom</w:t>')
  expect(transliterateDocxXml('<w:t xml:space="preserve"> чой </w:t>'))
    .toBe('<w:t xml:space="preserve"> çoy </w:t>')
})

test('transliterateDocxXml round-trips XML entities', () => {
  expect(transliterateDocxXml('<w:t>А &amp; Б</w:t>')).toBe('<w:t>A &amp; B</w:t>')
})

test('transliterateDocxXml leaves non-w:t markup and empty runs untouched', () => {
  expect(transliterateDocxXml('<w:p><w:pPr/></w:p>')).toBe('<w:p><w:pPr/></w:p>')
  expect(transliterateDocxXml('<w:t/>')).toBe('<w:t/>')
})

test('transliterateDocxXml skips a self-closing run adjacent to a real run (no corruption)', () => {
  const xml = '<w:t/></w:r><w:r><w:t>Салом</w:t>'
  expect(transliterateDocxXml(xml)).toBe('<w:t/></w:r><w:r><w:t>Salom</w:t>')
})
