// The macOS U.S. layout, written out by hand — not copied from Apple's files,
// which ship only as binary resources. tools/compare-us.swift checks every
// value here against the U.S. layout installed on the machine, so a
// transcription slip shows up as a named mismatch rather than a wrong key.

export type MacState = 'plain' | 'shift' | 'caps' | 'option' | 'shiftOption' | 'capsOption' | 'command' | 'control'
export type DeadKeyId = 'acute' | 'diaeresis' | 'circumflex' | 'tilde' | 'grave'
export type MacOutput = string | { dead: DeadKeyId }

export const MAC_STATES: readonly MacState[] = ['plain', 'shift', 'caps', 'option', 'shiftOption', 'capsOption', 'command', 'control']

const D = (dead: DeadKeyId): MacOutput => ({ dead })
// Spelled by code point: these are invisible or look like other characters.
const NBSP = String.fromCodePoint(0x00a0)
const COMBINING_ACUTE = String.fromCodePoint(0x0301)

/** Printable keys: [plain, shift, option, shift+option]. */
const PRINTABLE: Record<number, [string, string, MacOutput, MacOutput]> = {
  0: ['a', 'A', 'å', 'Å'],
  1: ['s', 'S', 'ß', 'Í'],
  2: ['d', 'D', '∂', 'Î'],
  3: ['f', 'F', 'ƒ', 'Ï'],
  4: ['h', 'H', '˙', 'Ó'],
  5: ['g', 'G', '©', '˝'],
  6: ['z', 'Z', 'Ω', '¸'],
  7: ['x', 'X', '≈', '˛'],
  8: ['c', 'C', 'ç', 'Ç'],
  9: ['v', 'V', '√', '◊'],
  10: ['§', '±', '§', '±'], // the extra key on ISO keyboards
  11: ['b', 'B', '∫', 'ı'],
  12: ['q', 'Q', 'œ', 'Œ'],
  13: ['w', 'W', '∑', '„'],
  14: ['e', 'E', D('acute'), '´'],
  15: ['r', 'R', '®', '‰'],
  16: ['y', 'Y', '¥', 'Á'],
  17: ['t', 'T', '†', 'ˇ'],
  18: ['1', '!', '¡', '⁄'],
  19: ['2', '@', '™', '€'],
  20: ['3', '#', '£', '‹'],
  21: ['4', '$', '¢', '›'],
  22: ['6', '^', '§', 'ﬂ'],
  23: ['5', '%', '∞', 'ﬁ'],
  24: ['=', '+', '≠', '±'],
  25: ['9', '(', 'ª', '·'],
  26: ['7', '&', '¶', '‡'],
  27: ['-', '_', '–', '—'],
  28: ['8', '*', '•', '°'],
  29: ['0', ')', 'º', '‚'],
  30: [']', '}', '‘', '’'],
  31: ['o', 'O', 'ø', 'Ø'],
  32: ['u', 'U', D('diaeresis'), '¨'],
  33: ['[', '{', '“', '”'],
  34: ['i', 'I', D('circumflex'), 'ˆ'],
  35: ['p', 'P', 'π', '∏'],
  37: ['l', 'L', '¬', 'Ò'],
  38: ['j', 'J', '∆', 'Ô'],
  39: ["'", '"', 'æ', 'Æ'],
  40: ['k', 'K', '˚', ''],
  41: [';', ':', '…', 'Ú'],
  42: ['\\', '|', '«', '»'],
  43: [',', '<', '≤', '¯'],
  44: ['/', '?', '÷', '¿'],
  45: ['n', 'N', D('tilde'), '˜'],
  46: ['m', 'M', 'µ', 'Â'],
  47: ['.', '>', '≥', '˘'],
  49: [' ', ' ', NBSP, NBSP],
  50: ['`', '~', D('grave'), '`'],
}

/** Keys that send the same character whatever the modifiers. */
const FIXED: Record<number, string> = {
  36: '\r', 48: '\t', 51: '\b', 52: '\u0003', 53: '\u001B',
  // keypad
  65: '.', 67: '*', 69: '+', 71: '\u001B', 75: '/', 76: '\u0003', 78: '-', 81: '=',
  82: '0', 83: '1', 84: '2', 85: '3', 86: '4', 87: '5', 88: '6', 89: '7', 91: '8', 92: '9',
  // navigation
  114: '\u0005', 115: '\u0001', 116: '\u000B', 117: '\u007F', 119: '\u0004', 121: '\u000C',
  123: '\u001C', 124: '\u001D', 125: '\u001F', 126: '\u001E',
  // the legacy keypad arrow keys: arrows unshifted, keypad symbols with Shift
  // (see STATE_EXCEPTIONS)
  66: '\u001D', 70: '\u001C', 72: '\u001F', 77: '\u001E',
  // function keys all send U+0010 (F17–F20, codes 64/79/80/90, send nothing
  // on the U.S. layout and are left out)
  96: '\u0010', 97: '\u0010', 98: '\u0010', 99: '\u0010', 100: '\u0010', 101: '\u0010',
  102: '\u0010', 103: '\u0010', 104: '\u0010', 105: '\u0010', 106: '\u0010', 107: '\u0010',
  108: '\u0010', 109: '\u0010', 110: '\u0010', 111: '\u0010', 112: '\u0010', 113: '\u0010',
  118: '\u0010', 120: '\u0010', 122: '\u0010',
}

/** Where Apple's U.S. layout departs from the derivation rules below. Filled
 * from compare-us.swift mismatches; each entry is a checked fact. */
const STATE_EXCEPTIONS: Partial<Record<number, Partial<Record<MacState, MacOutput>>>> = {
  10: { control: '0' },
  27: { control: '\u001F' },
  66: { shift: '*', shiftOption: '*' },
  70: { shift: '+', shiftOption: '+' },
  72: { shift: '=', shiftOption: '=' },
  77: { shift: '/', shiftOption: '/' },
}

/** Keys where Caps Lock + Option types the Shift + Option character; on every
 * other key it types the plain Option one. Read off the U.S. layout. */
const CAPS_OPTION_FROM_SHIFT = new Set([0, 2, 3, 4, 11, 12, 14, 16, 32, 34, 35, 37, 38, 45, 46, 50])

const CONTROL_PUNCT: Record<string, string> = { '[': '\u001B', '\\': '\u001C', ']': '\u001D' }

function expand(code: number, [plain, shift, option, shiftOption]: [string, string, MacOutput, MacOutput]): Record<MacState, MacOutput> {
  const letter = /^[a-z]$/.test(plain)
  return {
    plain,
    shift,
    caps: letter ? shift : plain,
    option,
    shiftOption,
    capsOption: CAPS_OPTION_FROM_SHIFT.has(code) ? shiftOption : option,
    command: plain,
    control: letter ? String.fromCharCode(plain.charCodeAt(0) - 96) : (CONTROL_PUNCT[plain] ?? plain),
  }
}

function build(): Record<number, Record<MacState, MacOutput>> {
  const out: Record<number, Record<MacState, MacOutput>> = {}
  for (const [code, row] of Object.entries(PRINTABLE)) out[+code] = expand(+code, row)
  for (const [code, ch] of Object.entries(FIXED))
    out[+code] = Object.fromEntries(MAC_STATES.map((s) => [s, ch])) as Record<MacState, MacOutput>
  for (const [code, states] of Object.entries(STATE_EXCEPTIONS)) Object.assign(out[+code], states)
  return out
}

export const US_BASE: Readonly<Record<number, Readonly<Record<MacState, MacOutput>>>> = build()

const upper = (pairs: Record<string, string>) =>
  Object.fromEntries(Object.entries(pairs).flatMap(([k, v]) => [[k, v], [k.toUpperCase(), v.toUpperCase()]]))

export const DEAD_KEYS: Record<DeadKeyId, { terminator: string; compose: Record<string, string> }> = {
  // j has no precomposed acute: the U.S. layout types j + U+0301.
  acute: { terminator: '´', compose: upper({ a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú', j: 'j' + COMBINING_ACUTE }) },
  diaeresis: { terminator: '¨', compose: upper({ a: 'ä', e: 'ë', i: 'ï', o: 'ö', u: 'ü', y: 'ÿ' }) },
  circumflex: { terminator: 'ˆ', compose: upper({ a: 'â', e: 'ê', i: 'î', o: 'ô', u: 'û' }) },
  tilde: { terminator: '˜', compose: upper({ a: 'ã', n: 'ñ', o: 'õ' }) },
  grave: { terminator: '`', compose: upper({ a: 'à', e: 'è', i: 'ì', o: 'ò', u: 'ù' }) },
}
