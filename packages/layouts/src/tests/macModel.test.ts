import { expect, test } from 'vitest'
import { macModel, type MacState } from '../macos/model.js'
import { US_BASE } from '../macos/usBase.js'
import { macDisplaced } from '../index.js'

const STATES: MacState[] = ['plain', 'shift', 'caps', 'option', 'shiftOption', 'capsOption', 'command', 'commandOption', 'control']

test('the five overrides, in every state the spec names', () => {
  const k = macModel().keys
  expect([k[31].option, k[31].shiftOption, k[31].capsOption]).toEqual(['ö', 'Ö', 'Ö'])
  expect([k[5].option, k[5].shiftOption, k[5].capsOption]).toEqual(['ğ', 'Ğ', 'Ğ'])
  // Review Focus 3: Caps Lock on, then ⌥s, gives Ş.
  expect([k[1].option, k[1].shiftOption, k[1].capsOption]).toEqual(['ş', 'Ş', 'Ş'])
  expect([k[8].option, k[8].shiftOption, k[8].capsOption]).toEqual(['ç', 'Ç', 'Ç'])
  // Review Focus 4: Shift held on the tutuq still gives ʼ, never Æ.
  expect([k[39].option, k[39].shiftOption, k[39].capsOption]).toEqual(['ʼ', 'ʼ', 'ʼ'])
})

test('nothing else differs from the US base', () => {
  const { keys, overrides } = macModel()
  const overridden = new Set(overrides.map((o) => `${o.keyCode}:${o.state}`))
  for (const [code, states] of Object.entries(US_BASE))
    for (const [state, out] of Object.entries(states))
      if (!overridden.has(`${code}:${state}`)) expect(keys[+code][state as MacState]).toEqual(out)
  expect(overrides).toHaveLength(20)
})

// Review Focus 2: ⌘C/⌘V/⌘S keep working, and Ctrl+C in Terminal still sends ^C.
test('⌘ gives plain letters and Ctrl gives control codes', () => {
  const k = macModel().keys
  expect([k[8].command, k[9].command, k[1].command]).toEqual(['c', 'v', 's'])
  expect(k[8].control).toBe('\u0003')
})

test('dead keys survive: ⌥u then o is ö, ⌥e then e is é', () => {
  const { keys, deadKeys } = macModel()
  expect(keys[32].option).toEqual({ dead: 'diaeresis' })
  expect(deadKeys.diaeresis.compose.o).toBe('ö')
  expect(deadKeys.acute.compose.e).toBe('é')
})

test('ISO keyboards: key code 10 is mapped in every state', () => {
  const states = macModel().keys[10]
  for (const s of STATES) expect(states[s]).toBeDefined()
})

test('macDisplaced lists what each override replaced', () => {
  expect(macDisplaced()).toContainEqual({ combo: '⌥o', was: 'ø', now: 'ö' })
  expect(macDisplaced()).toContainEqual({ combo: "⇧⌥'", was: 'Æ', now: 'ʼ' })
  expect(macDisplaced().find((d) => d.combo === '⌥c')).toBeUndefined() // ⌥c is already ç
})

// The web page calls macDisplaced() while rendering, and the site still
// targets Safari 14, which has no structuredClone.
test('works in browsers without structuredClone', () => {
  const saved = globalThis.structuredClone
  // @ts-expect-error simulating Safari 14
  delete globalThis.structuredClone
  try {
    expect(macDisplaced()).toContainEqual({ combo: '⌥s', was: 'ß', now: 'ş' })
    expect(macModel().keys[1].option).toBe('ş')
    expect(US_BASE[1].option).toBe('ß') // the model must not write through to the base
  } finally {
    globalThis.structuredClone = saved
  }
})

// Apple's U.S. layout: with ⌘ held, the accent keys type their spacing
// character instead of starting an accent, so a shortcut never leaves a
// half-typed accent behind. ⌘⌥ is otherwise the Option layer — ours included.
test('⌘⌥ is the Option layer with the accent keys made plain', () => {
  const k = macModel().keys
  expect([k[14].commandOption, k[32].commandOption, k[34].commandOption, k[45].commandOption, k[50].commandOption])
    .toEqual(['\u00B4', '\u00A8', '^', '~', '`'])
  expect([k[0].commandOption, k[31].commandOption, k[1].commandOption]).toEqual(['å', 'ö', 'ş'])
})
