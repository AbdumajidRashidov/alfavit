// What the Özbek (yangi alifbo) layout types on macOS: the U.S. layout with
// the five letters written onto Option, Shift+Option, Caps Lock+Option and ⌘⌥.
// Nothing else changes — a test holds every other key/state to US_BASE.
import { KEY_TABLE, type KeyBase } from '../keys.js'
import { US_BASE, DEAD_KEYS, type MacState, type MacOutput } from './usBase.js'

export { type MacState, type MacOutput, type DeadKeyId, MAC_STATES } from './usBase.js'

export const MAC_KEY_CODES: Record<KeyBase, number> = { o: 31, g: 5, s: 1, c: 8, "'": 39 }

export interface MacModel {
  keys: Record<number, Record<MacState, MacOutput>>
  deadKeys: typeof DEAD_KEYS
  overrides: { keyCode: number; state: MacState }[]
}

export function macModel(): MacModel {
  // One level of copying is enough: overrides replace whole state values and
  // never mutate the dead-key objects. (No structuredClone: the web page runs
  // this on Safari 14, which lacks it.)
  const keys: Record<number, Record<MacState, MacOutput>> = Object.fromEntries(
    Object.entries(US_BASE).map(([code, states]) => [code, { ...states }]),
  )
  const overrides: MacModel['overrides'] = []
  for (const { base, lower, upper } of KEY_TABLE) {
    const keyCode = MAC_KEY_CODES[base]
    for (const [state, out] of [['option', lower], ['shiftOption', upper], ['capsOption', upper], ['commandOption', lower]] as const) {
      keys[keyCode][state] = out
      overrides.push({ keyCode, state })
    }
  }
  return { keys, deadKeys: DEAD_KEYS, overrides }
}

/** What each Option combination typed before, for the download page. Caps Lock
 * states are left out: nobody looks for them in a list. ⌥c is already ç on the
 * U.S. layout, so it does not appear. */
export function macDisplaced(): { combo: string; was: string; now: string }[] {
  const { keys, overrides } = macModel()
  const baseOf = Object.fromEntries(Object.entries(MAC_KEY_CODES).map(([b, c]) => [c, b]))
  return overrides
    .filter((o) => o.state === 'option' || o.state === 'shiftOption')
    .map((o) => ({
      combo: `${o.state === 'shiftOption' ? '⇧' : ''}⌥${baseOf[o.keyCode]}`,
      was: US_BASE[o.keyCode][o.state] as string,
      now: keys[o.keyCode][o.state] as string,
    }))
    .filter((d) => d.was !== d.now)
}
