import { expect, test } from 'vitest'
import { transliterate } from '@alfavit/engine'
import { LETTERS, SOUNDS } from './alphabet'

test('there are 28 letters in the confirmed order', () => {
  expect(LETTERS).toHaveLength(28)
  expect(LETTERS.map((l) => l.id).join('')).toBe('ABDEFGHIJKLMNOPQRSTUVXYZÖĞŞÇ')
})

test("each letter's Cyrillic transliterates to its Latin via the engine (no drift)", () => {
  for (const L of LETTERS) {
    const cyrLower = L.cyrillic.split(' ')[1] // 'ў' from 'Ў ў'
    const latLower = L.latin.split(' ')[1] // 'ö' from 'Ö ö'
    expect(transliterate(cyrLower).text, `${L.id}: Cyrillic ${cyrLower}`).toBe(latLower)
  }
})

test('the four changed letters are marked and carry an old form', () => {
  const changed = LETTERS.filter((l) => l.changed).map((l) => l.id)
  expect(changed).toEqual(['Ö', 'Ğ', 'Ş', 'Ç'])
  for (const L of LETTERS.filter((l) => l.changed)) {
    expect(L.exampleOld, `${L.id} exampleOld`).toBeTruthy()
    expect(L.old).not.toBe(L.latin)
  }
})

test('every letter has a sound hint in all three locales', () => {
  for (const loc of ['en', 'uz', 'ru'] as const) {
    for (const L of LETTERS) expect(SOUNDS[loc][L.id], `${loc}/${L.id}`).toBeTruthy()
  }
})
