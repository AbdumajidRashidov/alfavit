import { describe, expect, test } from 'vitest'
import { PAGE_PATHS, pageDates } from '../seo/config'

// These dates are maintained by hand — CI checks out at depth 1, so they cannot
// be read from git at build time. That makes them easy to get wrong, and a
// wrong lastmod is worse than no lastmod: Google stops trusting the file.
describe('page dates', () => {
  test('every page declares both dates in ISO form', () => {
    for (const { path, published, updated } of PAGE_PATHS) {
      expect(published, `${path || '/'} published`).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(updated, `${path || '/'} updated`).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  test('nothing was updated before it was published, or in the future', () => {
    const tomorrow = Date.now() + 24 * 60 * 60 * 1000
    for (const { path, published, updated } of PAGE_PATHS) {
      expect(Date.parse(updated), `${path || '/'} updated < published`).toBeGreaterThanOrEqual(
        Date.parse(published),
      )
      expect(Date.parse(updated), `${path || '/'} is dated in the future`).toBeLessThan(tomorrow)
    }
  })

  test('pageDates throws on an unknown path rather than returning a silent default', () => {
    expect(() => pageDates('alphabet')).not.toThrow()
    expect(() => pageDates('does-not-exist')).toThrow(/unknown page path/)
  })
})
