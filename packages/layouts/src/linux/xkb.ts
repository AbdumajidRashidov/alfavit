// The Linux drop-in: uz(alfavit) — us(basic) with ö ğ ş ç ʼ on AltGr — plus
// the registry entry that lets desktop settings list it. Installed by
// `tar -xzf alfavit-xkb.tar.gz -C ~/.config`; libxkbcommon reads ~/.config/xkb.
import { KEY_TABLE, LINUX_LAYOUT, LINUX_VARIANT, LINUX_DESCRIPTION, type KeyBase } from '../keys.js'

/** XKB key names for the five base keys. */
const XKB_KEY: Record<KeyBase, string> = { o: 'AD09', g: 'AC05', s: 'AC02', c: 'AB03', "'": 'AC11' }
/** Levels 1 and 2 of each key, unchanged from us(basic). */
const BASE_SYMS: Record<KeyBase, [string, string]> = {
  o: ['o', 'O'], g: ['g', 'G'], s: ['s', 'S'], c: ['c', 'C'], "'": ['apostrophe', 'quotedbl'],
}
const NAMED: Record<string, string> = {
  ö: 'odiaeresis', Ö: 'Odiaeresis', ğ: 'gbreve', Ğ: 'Gbreve',
  ş: 'scedilla', Ş: 'Scedilla', ç: 'ccedilla', Ç: 'Ccedilla',
}
/** Named keysym where XKB has one; otherwise the Unicode form (ʼ → U02BC). */
const keysym = (ch: string) => NAMED[ch] ?? `U${ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}`

export function generateAlfavitVariant(): string {
  const keys = KEY_TABLE.map(({ base, lower, upper }) => {
    const [l1, l2] = BASE_SYMS[base]
    return `    key <${XKB_KEY[base]}> { [ ${l1}, ${l2}, ${keysym(lower)}, ${keysym(upper)} ] };`
  })
  return `// The 2026 Uzbek Latin alphabet on AltGr: AltGr+o g s c ' gives ö ğ ş ç ʼ.
// Every other key is us(basic). From alfavit.uz; not an official layout.
partial alphanumeric_keys
xkb_symbols "${LINUX_VARIANT}" {
    include "us(basic)"
    name[Group1]= "${LINUX_DESCRIPTION}";
${keys.join('\n')}
    include "level3(ralt_switch)"
};
`
}

export function generateUzSymbols(upstream: string): string {
  return `${upstream}\n${generateAlfavitVariant()}`
}

export function generateEvdevXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<xkbConfigRegistry version="1.1">
  <layoutList>
    <layout>
      <configItem>
        <name>${LINUX_LAYOUT}</name>
      </configItem>
      <variantList>
        <variant>
          <configItem>
            <name>${LINUX_VARIANT}</name>
            <description>${LINUX_DESCRIPTION}</description>
          </configItem>
        </variant>
      </variantList>
    </layout>
  </layoutList>
</xkbConfigRegistry>
`
}
