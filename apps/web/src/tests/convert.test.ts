import { expect, test } from 'vitest'
import { transliterate } from '@alfavit/engine'
import { convertPlainText, transliterateDocxXml } from '../files/convert'

test('convertPlainText converts Cyrillic and old-Latin', () => {
  expect(convertPlainText('салом дунё')).toBe('salom dunyo')
  expect(convertPlainText("o'zbek")).toBe('özbek')
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

test('transliterateDocxXml converts text written as numeric character references', () => {
  // Some document generators write every non-ASCII letter as a reference: Тошкент.
  expect(transliterateDocxXml('<w:t>&#1058;&#1086;&#1096;&#x43A;&#x435;&#x43D;&#x442;</w:t>')).toBe('<w:t>Toşkent</w:t>')
  // A reference to anything else comes back as the character itself.
  expect(transliterateDocxXml('<w:t>&#169; &#x2014; &#128512;</w:t>')).toBe('<w:t>© — 😀</w:t>')
})

test('transliterateDocxXml leaves escaped reference text as text', () => {
  expect(transliterateDocxXml('<w:t>&amp;#1058; &amp;lt;</w:t>')).toBe('<w:t>&amp;#1058; &amp;lt;</w:t>')
})

test('transliterateDocxXml keeps a carriage return reference and reads a raw one as a line feed', () => {
  // An XML parser reads a raw CR (or CR LF) as LF; only &#13; is a real CR.
  expect(transliterateDocxXml('<w:t>А&#13;Б</w:t>')).toBe('<w:t>A&#13;B</w:t>')
  expect(transliterateDocxXml('<w:t>А\r\nБ\rВ</w:t>')).toBe('<w:t>A\nB\nV</w:t>')
})

test('transliterateDocxXml leaves non-w:t markup and empty runs untouched', () => {
  expect(transliterateDocxXml('<w:p><w:pPr/></w:p>')).toBe('<w:p><w:pPr/></w:p>')
  expect(transliterateDocxXml('<w:t/>')).toBe('<w:t/>')
})

test('transliterateDocxXml skips a self-closing run adjacent to a real run (no corruption)', () => {
  const xml = '<w:t/></w:r><w:r><w:t>Салом</w:t>'
  expect(transliterateDocxXml(xml)).toBe('<w:t/></w:r><w:r><w:t>Salom</w:t>')
})

// Word splits a word across runs after an edit (rsid), at spellcheck marks and
// at a formatting change. The engine has to see the paragraph, not the pieces.
const para = (...runs: string[]) => `<w:p>${runs.map((r) => `<w:r>${r}</w:r>`).join('')}</w:p>`
const runTexts = (xml: string) => [...xml.matchAll(/<w:t\b[^>]*(?<!\/)>([\s\S]*?)<\/w:t>/g)].map((m) => m[1])

test('transliterateDocxXml converts a word split across runs as one word', () => {
  // On its own, the ЕНТ run reads as word-initial е: TOŞK + YeNT.
  expect(transliterateDocxXml(para('<w:t>ТОШК</w:t>', '<w:t>ЕНТ</w:t>')))
    .toBe(para('<w:t>TOŞKENT</w:t>', '<w:t></w:t>'))
  expect(runTexts(transliterateDocxXml(para('<w:t>Тошк</w:t>', '<w:t>ент</w:t>')))).toEqual(['Toşkent', ''])
})

test('transliterateDocxXml keeps rules that need the whole word across a split', () => {
  const joined = (...texts: string[]) =>
    runTexts(transliterateDocxXml(para(...texts.map((t) => `<w:t xml:space="preserve">${t}</w:t>`)))).join('')
  expect(joined('Мен ', 'shahar', '.uz', ' сайтида')).toBe('Men shahar.uz saytida') // protected address
  expect(joined('Wa', 'shington')).toBe('Washington') // foreign word
  expect(joined('Ish', 'oq')).toBe('Ishoq') // s + h word list
  expect(joined('ЦИ', 'РК')).toBe(transliterate('ЦИРК').text) // exception list
})

test('transliterateDocxXml keeps run boundaries where the split converts cleanly', () => {
  // A bold first letter stays bold: Т + ошкент converts to T + oşkent either way.
  const bold = '<w:rPr><w:b/></w:rPr>'
  expect(transliterateDocxXml(para(`${bold}<w:t>Т</w:t>`, '<w:t xml:space="preserve">ошкент шаҳри</w:t>')))
    .toBe(para(`${bold}<w:t>T</w:t>`, '<w:t xml:space="preserve">oşkent şahri</w:t>'))
})

test('transliterateDocxXml joins runs through spellcheck and bookmark marks', () => {
  const xml = '<w:p><w:proofErr w:type="spellStart"/><w:r w:rsidR="00A1"><w:t>Тошк</w:t></w:r>'
    + '<w:bookmarkStart w:id="0" w:name="x"/><w:r w:rsidR="00B2"><w:rPr><w:i/></w:rPr><w:t>ент</w:t></w:r>'
    + '<w:proofErr w:type="spellEnd"/></w:p>'
  expect(transliterateDocxXml(xml)).toBe(xml.replace('Тошк', 'Toşkent').replace('ент', ''))
})

test('transliterateDocxXml does not join separate paragraphs', () => {
  expect(transliterateDocxXml(para('<w:t>Тошк</w:t>') + para('<w:t>ент</w:t>')))
    .toBe(para('<w:t>Toşk</w:t>') + para('<w:t>yent</w:t>'))
})

test('transliterateDocxXml treats tabs and line breaks between runs as word breaks', () => {
  expect(runTexts(transliterateDocxXml(para('<w:t>Салом</w:t>', '<w:tab/><w:t>ер</w:t>')))).toEqual(['Salom', 'yer'])
  expect(runTexts(transliterateDocxXml(para('<w:t>Салом</w:t>', '<w:br/><w:t>ер</w:t>')))).toEqual(['Salom', 'yer'])
})

test('transliterateDocxXml converts a text box paragraph apart from the paragraph holding it', () => {
  const box = (...runs: string[]) => `<w:drawing><w:txbxContent>${para(...runs)}</w:txbxContent></w:drawing>`
  // The text after each box belongs to the paragraph around it, not to the box
  // and not to the next paragraph's text.
  const xml = para('<w:t>Салом</w:t>', box('<w:t>Тошк</w:t>', '<w:t>ент</w:t>'), '<w:t xml:space="preserve"> Тошк</w:t>')
    + para(box('<w:t>Ер</w:t>'), '<w:t>ент</w:t>')
  expect(runTexts(transliterateDocxXml(xml))).toEqual(['Salom', 'Toşkent', '', ' Toşk', 'Yer', 'yent'])
})

test('transliterateDocxXml maps split text through XML entities', () => {
  expect(transliterateDocxXml(para('<w:t>&lt;Тошк</w:t>', '<w:t>ент&gt; &amp;</w:t>')))
    .toBe(para('<w:t>&lt;Toşkent</w:t>', '<w:t>&gt; &amp;</w:t>'))
})

test('transliterateDocxXml converts a one-run paragraph exactly as the engine converts its text', () => {
  const text = 'Ер юзида 2027 йил, ЦИРК ва www.shahar.uz/ish. Шарқ — «Тошкент»!'
  expect(transliterateDocxXml(para(`<w:t xml:space="preserve">${text}</w:t>`)))
    .toBe(para(`<w:t xml:space="preserve">${transliterate(text).text}</w:t>`))
})
