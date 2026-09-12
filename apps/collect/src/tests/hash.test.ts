import { expect, test } from 'vitest'
import { sessionHash, utcDay } from '../hash'

const IP = '213.230.90.1'
const UA = 'Mozilla/5.0 (Linux; Android 13)'
const SECRET = 'test-secret'

test('utcDay formats as YYYY-MM-DD', () => {
  expect(utcDay(new Date('2026-09-12T22:32:43Z'))).toBe('2026-09-12')
})

test('hash is 16 lowercase hex characters', async () => {
  const h = await sessionHash(IP, UA, '2026-09-12', SECRET)
  expect(h).toMatch(/^[0-9a-f]{16}$/)
})

test('same visitor on the same day hashes identically', async () => {
  const a = await sessionHash(IP, UA, '2026-09-12', SECRET)
  const b = await sessionHash(IP, UA, '2026-09-12', SECRET)
  expect(a).toBe(b)
})

test('same visitor on a different day hashes differently', async () => {
  const a = await sessionHash(IP, UA, '2026-09-12', SECRET)
  const b = await sessionHash(IP, UA, '2026-09-13', SECRET)
  expect(a).not.toBe(b)
})

test('different visitors on the same day hash differently', async () => {
  const a = await sessionHash(IP, UA, '2026-09-12', SECRET)
  const b = await sessionHash('84.54.79.2', UA, '2026-09-12', SECRET)
  expect(a).not.toBe(b)
})

test('the raw IP never appears in the output', async () => {
  const h = await sessionHash(IP, UA, '2026-09-12', SECRET)
  expect(h).not.toContain(IP)
  expect(h).not.toContain('213')
})

test('the secret changes the output', async () => {
  const a = await sessionHash(IP, UA, '2026-09-12', SECRET)
  const b = await sessionHash(IP, UA, '2026-09-12', 'other-secret')
  expect(a).not.toBe(b)
})
