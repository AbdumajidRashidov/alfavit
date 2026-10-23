import { expect, test } from 'vitest'
import { readFileSync } from 'node:fs'
import { generateKlc, encodeKlc } from '../windows/klc.js'

const klc = generateKlc()

// Cap 5 = CAPLOK | CAPLOKALTGR: Caps Lock capitalises the AltGr letters too
// (Caps Lock + AltGr+s gives Ş — Review Focus 3, on Windows).
test.each([
  ['18\tO\t\t5\to\tO\t-1\t00f6\t00d6'],
  ['22\tG\t\t5\tg\tG\t-1\t011f\t011e'],
  ['1f\tS\t\t5\ts\tS\t-1\t015f\t015e'],
  ['2e\tC\t\t5\tc\tC\t-1\t00e7\t00c7'],
  ['28\tOEM_7\t\t0\t0027\t0022\t-1\t02bc\t02bc'], // Review Focus 5
])('carries the row %s', (row) => expect(klc).toContain(row))

test('no AltGr output on any other key', () => {
  const layout = klc.slice(klc.indexOf('\r\nLAYOUT'), klc.indexOf('\r\nKEYNAME'))
  const rows = layout.split('\r\n').filter((l) => /^[0-9a-f]{2}\t/.test(l))
  const withAltGr = rows.filter((r) => { const c = r.split('\t').filter(Boolean); return c[6] !== '-1' || c[7] !== '-1' })
  expect(withAltGr.map((r) => r.slice(0, 2)).sort()).toEqual(['18', '1f', '22', '28', '2e'])
})

test('names the layout and the Uzbek (Latin) locale', () => {
  expect(klc).toContain('KBD\talfavit\t"Özbek (yangi alifbo)"')
  expect(klc).toContain('LOCALENAME\t"uz-Latn-UZ"')
  expect(klc).toContain('LOCALEID\t"00000443"')
  expect(klc.trimEnd().endsWith('ENDKBD')).toBe(true)
})

test('CRLF only, and encoded UTF-16LE with a BOM', () => {
  expect(klc).not.toMatch(/[^\r]\n/)
  const bytes = encodeKlc(klc)
  expect([...bytes.subarray(0, 2)]).toEqual([0xff, 0xfe])
  expect(bytes.subarray(2).toString('utf16le')).toBe(klc)
})

test('the committed file is what the generator produces', () => {
  expect(readFileSync(new URL('../../out/windows/ozbek-yangi-alifbo.klc', import.meta.url)).equals(encodeKlc(klc))).toBe(true)
})
