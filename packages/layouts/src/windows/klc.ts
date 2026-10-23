// The Windows source for Phase 1b: a Microsoft Keyboard Layout Creator .klc,
// U.S. with ö ğ ş ç ʼ on AltGr (Ctrl+Alt). Checked in now so the CI build in
// 1b starts from a known-good file; nothing here is built or shipped yet.
import { KEY_TABLE, LAYOUT_NAME, type KeyBase } from '../keys.js'

/** U.S. rows: scan code, virtual key, Caps Lock acts as Shift, then the
 * characters for no modifier, Shift, and Ctrl (null = none). */
const US_ROWS: [string, string, number, string, string, string | null][] = [
  ['02', '1', 0, '1', '!', null], ['03', '2', 0, '2', '@', null], ['04', '3', 0, '3', '#', null],
  ['05', '4', 0, '4', '$', null], ['06', '5', 0, '5', '%', null], ['07', '6', 0, '6', '^', null],
  ['08', '7', 0, '7', '&', null], ['09', '8', 0, '8', '*', null], ['0a', '9', 0, '9', '(', null],
  ['0b', '0', 0, '0', ')', null], ['0c', 'OEM_MINUS', 0, '-', '_', null], ['0d', 'OEM_PLUS', 0, '=', '+', null],
  ['10', 'Q', 1, 'q', 'Q', null], ['11', 'W', 1, 'w', 'W', null], ['12', 'E', 1, 'e', 'E', null],
  ['13', 'R', 1, 'r', 'R', null], ['14', 'T', 1, 't', 'T', null], ['15', 'Y', 1, 'y', 'Y', null],
  ['16', 'U', 1, 'u', 'U', null], ['17', 'I', 1, 'i', 'I', null], ['18', 'O', 1, 'o', 'O', null],
  ['19', 'P', 1, 'p', 'P', null], ['1a', 'OEM_4', 0, '[', '{', '\u001b'], ['1b', 'OEM_6', 0, ']', '}', '\u001d'],
  ['1e', 'A', 1, 'a', 'A', null], ['1f', 'S', 1, 's', 'S', null], ['20', 'D', 1, 'd', 'D', null],
  ['21', 'F', 1, 'f', 'F', null], ['22', 'G', 1, 'g', 'G', null], ['23', 'H', 1, 'h', 'H', null],
  ['24', 'J', 1, 'j', 'J', null], ['25', 'K', 1, 'k', 'K', null], ['26', 'L', 1, 'l', 'L', null],
  ['27', 'OEM_1', 0, ';', ':', null], ['28', 'OEM_7', 0, "'", '"', null], ['29', 'OEM_3', 0, '`', '~', null],
  ['2b', 'OEM_5', 0, '\\', '|', '\u001c'],
  ['2c', 'Z', 1, 'z', 'Z', null], ['2d', 'X', 1, 'x', 'X', null], ['2e', 'C', 1, 'c', 'C', null],
  ['2f', 'V', 1, 'v', 'V', null], ['30', 'B', 1, 'b', 'B', null], ['31', 'N', 1, 'n', 'N', null],
  ['32', 'M', 1, 'm', 'M', null], ['33', 'OEM_COMMA', 0, ',', '<', null], ['34', 'OEM_PERIOD', 0, '.', '>', null],
  ['35', 'OEM_2', 0, '/', '?', null], ['39', 'SPACE', 0, ' ', ' ', ' '],
  ['56', 'OEM_102', 0, '\\', '|', '\u001c'], ['53', 'DECIMAL', 0, '.', '.', null],
]

const SCAN: Record<KeyBase, string> = { o: '18', g: '22', s: '1f', c: '2e', "'": '28' }

/** Shift+Ctrl on Windows U.S.: Ctrl+Shift+2 is NUL, +6 is RS, +- is US. */
const SHIFT_CTRL: Record<string, string> = {
  '03': String.fromCharCode(0x00), '07': String.fromCharCode(0x1e), '0c': String.fromCharCode(0x1f),
}

/** Letters and digits as themselves, everything else as four hex digits. */
const cell = (ch: string | null) =>
  ch === null ? '-1' : /^[A-Za-z0-9]$/.test(ch) ? ch : ch.codePointAt(0)!.toString(16).padStart(4, '0')

const KEYNAME = [
  ['01', 'Esc'], ['0e', 'Backspace'], ['0f', 'Tab'], ['1c', 'Enter'], ['1d', 'Ctrl'], ['2a', 'Shift'],
  ['36', '"Right Shift"'], ['37', '"Num *"'], ['38', 'Alt'], ['39', 'Space'], ['3a', '"Caps Lock"'],
  ['3b', 'F1'], ['3c', 'F2'], ['3d', 'F3'], ['3e', 'F4'], ['3f', 'F5'], ['40', 'F6'], ['41', 'F7'],
  ['42', 'F8'], ['43', 'F9'], ['44', 'F10'], ['45', 'Pause'], ['46', '"Scroll Lock"'], ['47', '"Num 7"'],
  ['48', '"Num 8"'], ['49', '"Num 9"'], ['4a', '"Num -"'], ['4b', '"Num 4"'], ['4c', '"Num 5"'],
  ['4d', '"Num 6"'], ['4e', '"Num +"'], ['4f', '"Num 1"'], ['50', '"Num 2"'], ['51', '"Num 3"'],
  ['52', '"Num 0"'], ['53', '"Num Del"'], ['54', '"Sys Req"'], ['57', 'F11'], ['58', 'F12'],
  ['7c', 'F13'], ['7d', 'F14'], ['7e', 'F15'], ['7f', 'F16'], ['80', 'F17'], ['81', 'F18'], ['82', 'F19'],
  ['83', 'F20'], ['84', 'F21'], ['85', 'F22'], ['86', 'F23'], ['87', 'F24'],
]
const KEYNAME_EXT = [
  ['1c', '"Num Enter"'], ['1d', '"Right Ctrl"'], ['35', '"Num /"'], ['37', '"Prnt Scrn"'], ['38', '"Right Alt"'],
  ['45', '"Num Lock"'], ['46', 'Break'], ['47', 'Home'], ['48', 'Up'], ['49', '"Page Up"'], ['4b', 'Left'],
  ['4d', 'Right'], ['4f', 'End'], ['50', 'Down'], ['51', '"Page Down"'], ['52', 'Insert'], ['53', 'Delete'],
  ['54', '<00>'], ['56', 'Help'], ['5b', '"Left Windows"'], ['5c', '"Right Windows"'], ['5d', 'Application'],
]

export function generateKlc(): string {
  const altGr = new Map(KEY_TABLE.map((k) => [SCAN[k.base], k]))
  const rows = US_ROWS.map(([sc, vk, cap, s0, s1, ctrl]) => {
    const k = altGr.get(sc)
    const vkCol = vk.length >= 8 ? `${vk}\t` : `${vk}\t\t`
    // CAPLOKALTGR (4): Caps Lock also capitalises the AltGr letters (ʼ has no capital).
    const capFlags = k && k.upper !== k.lower ? cap | 4 : cap
    return [sc, `${vkCol}${capFlags}`, cell(s0), cell(s1), cell(ctrl), cell(SHIFT_CTRL[sc] ?? null), cell(k?.lower ?? null), cell(k?.upper ?? null)].join('\t')
  })
  const lines = [
    `KBD\talfavit\t"${LAYOUT_NAME}"`,
    '',
    'COPYRIGHT\t"(c) Alfavit, MIT licence"',
    '',
    'COMPANY\t"Alfavit (alfavit.uz)"',
    '',
    'LOCALENAME\t"uz-Latn-UZ"',
    '',
    'LOCALEID\t"00000443"',
    '',
    'VERSION\t1.0',
    '',
    'SHIFTSTATE',
    '',
    '0\t//Column 4',
    '1\t//Column 5 : Shft',
    '2\t//Column 6 :       Ctrl',
    '3\t//Column 7 : Shft  Ctrl',
    '6\t//Column 8 :       Ctrl Alt',
    '7\t//Column 9 : Shft  Ctrl Alt',
    '',
    'LAYOUT\t\t;an extra \'@\' at the end is a dead key',
    '',
    '//SC\tVK_\t\tCap\t0\t1\t2\t3\t6\t7',
    '//--\t----\t\t----\t----\t----\t----\t----\t----\t----',
    '',
    ...rows,
    '',
    'KEYNAME',
    '',
    ...KEYNAME.map(([sc, name]) => `${sc}\t${name}`),
    '',
    'KEYNAME_EXT',
    '',
    ...KEYNAME_EXT.map(([sc, name]) => `${sc}\t${name}`),
    '',
    'DESCRIPTIONS',
    '',
    `0409\t${LAYOUT_NAME}`,
    '',
    'LANGUAGENAMES',
    '',
    '0409\tUzbek (Latin, Uzbekistan)',
    '',
    'ENDKBD',
    '',
  ]
  return lines.join('\r\n')
}

/** MSKLC reads .klc files as UTF-16LE with a byte-order mark. */
export function encodeKlc(text: string): Buffer {
  return Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(text, 'utf16le')])
}
