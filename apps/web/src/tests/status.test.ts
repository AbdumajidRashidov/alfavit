import { describe, expect, test } from 'vitest'
import { LOCALES } from '../i18n/translations'
import {
  CHECKED_ON,
  MAX_AGE_DAYS,
  STAGE,
  STATUS_COPY,
  legalForce,
  statusCopy,
} from '../content/status'
import { daysSince, stalenessError } from '../seo/statusFreshnessPlugin'

describe('reform status', () => {
  test('every stage has copy in every locale', () => {
    for (const stage of Object.keys(STATUS_COPY) as (keyof typeof STATUS_COPY)[]) {
      for (const locale of LOCALES) {
        const copy = STATUS_COPY[stage][locale]
        expect(copy.headline, `${stage}/${locale}`).toBeTruthy()
        expect(copy.body, `${stage}/${locale}`).toBeTruthy()
      }
    }
  })

  test('the headline answers the question in one sentence', () => {
    // It is what a snippet and a language model will lift verbatim, so it has
    // to stand alone without the paragraph under it.
    for (const locale of LOCALES) {
      const { headline } = statusCopy(locale)
      expect(headline.length).toBeLessThan(120)
      expect(headline).toMatch(/[.!]$/)
    }
  })

  test('legal force follows the stage, and only in-force means in force', () => {
    expect(legalForce('awaiting-signature')).toBe('https://schema.org/NotInForce')
    expect(legalForce('signed')).toBe('https://schema.org/NotInForce')
    expect(legalForce('in-force')).toBe('https://schema.org/InForce')
  })

  test('CHECKED_ON is a real date, current, and not set ahead', () => {
    expect(CHECKED_ON).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    const age = daysSince(CHECKED_ON)
    // -1 is legitimate: the date is written in Tashkent (UTC+5) and may be read
    // on a machine still on the previous UTC day. Anything beyond that is a
    // typo'd future date.
    expect(age).toBeGreaterThanOrEqual(-1)
    expect(age).toBeLessThanOrEqual(MAX_AGE_DAYS)
  })
})

describe('staleness guard', () => {
  test('daysSince counts whole days from an ISO date', () => {
    const now = new Date('2026-09-13T12:00:00Z')
    expect(daysSince('2026-09-13', now)).toBe(0)
    expect(daysSince('2026-09-12', now)).toBe(1)
    expect(daysSince('2026-07-13', now)).toBe(62)
  })

  test('daysSince rejects a malformed date rather than silently passing', () => {
    expect(() => daysSince('13-09-2026')).toThrow(/not an ISO date/)
  })

  test('the window fires just past the limit, not at it', () => {
    // The plugin errors on `age > MAX_AGE_DAYS`, so the limit itself is still fine.
    const checked = new Date('2026-09-13T00:00:00Z')
    const atLimit = new Date(checked.getTime() + MAX_AGE_DAYS * 86_400_000)
    const overLimit = new Date(checked.getTime() + (MAX_AGE_DAYS + 1) * 86_400_000)
    expect(daysSince('2026-09-13', atLimit)).toBe(MAX_AGE_DAYS)
    expect(daysSince('2026-09-13', overLimit)).toBeGreaterThan(MAX_AGE_DAYS)
  })

  test('the failure message names the file, the stage and what to do', () => {
    const msg = stalenessError(60)
    expect(msg).toContain('60 days')
    expect(msg).toContain(STAGE)
    expect(msg).toContain('src/content/status.ts')
    expect(msg).toContain('CHECKED_ON')
  })
})
