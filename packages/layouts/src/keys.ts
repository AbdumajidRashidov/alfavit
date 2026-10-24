// The whole reform, from a typing point of view: five characters, each on
// Option (macOS) / AltGr (Linux, Windows) plus the base letter you would
// otherwise reach for. Every generator in this package reads this table, so
// the layouts cannot drift from each other — and a test holds it to the
// engine, so they cannot drift from the converter either.

export type KeyBase = 'o' | 'g' | 's' | 'c' | "'"

export interface KeyAssignment {
  base: KeyBase
  lower: string
  /** The tutuq has no capital: for `'` this is ʼ again. */
  upper: string
}

// Reform order, as everywhere the change is reported: Ö, Ğ, Ş, Ç — then ʼ.
// The tutuq is U+02BC. U+02BB is an input form the engine normalises away and
// must never be typed by a key.
// Spelled by code point: ʼ (U+02BC) and ʻ (U+02BB) look alike in source.
const TUTUQ = String.fromCodePoint(0x02bc)

export const KEY_TABLE: readonly KeyAssignment[] = [
  { base: 'o', lower: 'ö', upper: 'Ö' },
  { base: 'g', lower: 'ğ', upper: 'Ğ' },
  { base: 's', lower: 'ş', upper: 'Ş' },
  { base: 'c', lower: 'ç', upper: 'Ç' },
  { base: "'", lower: TUTUQ, upper: TUTUQ },
]

export const LAYOUT_NAME = 'Özbek (yangi alifbo)'
export const LINUX_LAYOUT = 'uz'
export const LINUX_VARIANT = 'alfavit'
export const LINUX_DESCRIPTION = 'Uzbek (Alfavit, AltGr)'

/** The macOS download is a zip of this bundle: the bundle is what carries the
 * icon. The bare .keylayout is still served, for links to it made before. */
export const MAC_BUNDLE = 'Ozbek-yangi-alifbo.bundle'

export const DOWNLOADS = { mac: 'Ozbek-yangi-alifbo.zip', macKeylayout: 'Ozbek-yangi-alifbo.keylayout', linux: 'alfavit-xkb.tar.gz' } as const
