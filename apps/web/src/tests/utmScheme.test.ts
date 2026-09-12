import { expect, test } from 'vitest'
import { SHARE_URL } from '../components/Converter'

// The scheme is defined in docs/marketing/README.md:20-22. The collect Worker
// stores whatever slug arrives, so an off-scheme value silently pollutes the
// medium dimension in `pnpm metrics` — this test is the guard against that.
const SOURCES = ['gazeta', 'spot', 'kun', 'daryo', 'zamin', 'uzdaily', 'podrobno',
  'telegram', 'reddit', 'linkedin', 'x', 'hn', 'habr', 'npm', 'bot', 'extension', 'share']
const MEDIUMS = ['press', 'post', 'referral', 'button']
const CAMPAIGNS = ['senate-2026-09', 'signing-2026']

test('the in-product share link conforms to the documented UTM scheme', () => {
  const params = new URL(SHARE_URL).searchParams
  expect(SOURCES).toContain(params.get('utm_source'))
  expect(MEDIUMS).toContain(params.get('utm_medium'))
  expect(CAMPAIGNS).toContain(params.get('utm_campaign'))
})

test('an in-product button is medium=button, not the channel name', () => {
  // 'telegram' is a utm_source, never a utm_medium — mixing the two makes
  // "did a journalist send them or did we?" unanswerable.
  expect(new URL(SHARE_URL).searchParams.get('utm_medium')).toBe('button')
})

test('utm values are lowercase slugs the collector will not drop', () => {
  const params = new URL(SHARE_URL).searchParams
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign']) {
    expect(params.get(key)).toMatch(/^[a-z0-9_-]{1,32}$/)
  }
})
