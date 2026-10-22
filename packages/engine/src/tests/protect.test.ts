import { expect, test } from 'vitest'
import { transliterate } from '../transliterate'
import { findProtectedSpans } from '../protect'

const t = (s: string) => transliterate(s).text

test.each([
  ['www.shahar.uz', 'www.shahar.uz'],
  ['Sayt: https://shahar.uz/choy/oʻzbek?q=sh.', 'Sayt: https://shahar.uz/choy/oʻzbek?q=sh.'],
  ['Yozing: info@shahar.uz', 'Yozing: info@shahar.uz'],
  ['[Shahar](https://shahar.uz/sh)', '[Şahar](https://shahar.uz/sh)'],
  ['(manba: https://choy.uz/sh) choy', '(manba: https://choy.uz/sh) çoy'],
  ['shahar.uz sayti', 'shahar.uz sayti'],
  ['Kanal: @shahar_news', 'Kanal: @shahar_news'],
])('%s stays a working address', (input, expected) => {
  expect(t(input)).toBe(expected)
})

test('a dot between words without a known domain ending is still text', () => {
  expect(t('shahar.choy')).toBe('şahar.çoy')
})

test('trailing punctuation and an unmatched bracket are not part of the URL', () => {
  const input = '(https://choy.uz/sh).'
  const [span] = findProtectedSpans(input)
  expect(input.slice(span.start, span.end)).toBe('https://choy.uz/sh')
})

test('segments still tile the input, and Cyrillic flags keep their offsets after a protected span', () => {
  const input = 'сайт www.shahar.uz ва концерт'
  const r = transliterate(input)
  expect(r.segments.map((s) => s.source).join('')).toBe(input)
  expect(r.segments.map((s) => s.output).join('')).toBe(r.text)
  expect(r.text).toBe('sayt www.shahar.uz va konsert')
  const ts = r.flags.find((f) => f.reason === 'cyrillic-ts')!
  expect(input.slice(ts.start, ts.end)).toBe('ц')
})

// The public API accepts 100,000 characters. Address detection has to stay
// linear on hostile input, or one request can burn a Worker's CPU budget.
test.each([
  ['dotted words', 'a.'.repeat(50_000)],
  ['no @ in a long local-part run', 'a'.repeat(100_000)],
  ['a URL followed by closing brackets', 'https://x.uz/' + ')'.repeat(100_000)],
  ['@ after a long local-part run', 'a'.repeat(99_990) + '@b'],
])('stays fast on 100,000 characters of %s', (_name, input) => {
  const started = performance.now()
  findProtectedSpans(input)
  expect(performance.now() - started).toBeLessThan(250)
})

// Review of c7391b4: per-word domain matching missed addresses glued to
// punctuation, emoji or a following suffix, and cut paths at ? and ,.
test.each([
  ['Manba:shahar.uz', 'Manba:shahar.uz'],
  ['👉shahar.uz', '👉shahar.uz'],
  ['*shahar.uz*', '*shahar.uz*'],
  ['—shahar.uz', '—shahar.uz'],
  ['Sayt:kun.uz/news/shahar', 'Sayt:kun.uz/news/shahar'],
  ['youtube.com/watch?v=aShch12', 'youtube.com/watch?v=aShch12'],
  ['t.me/shahar_news?start=ch', 't.me/shahar_news?start=ch'],
  ['shahar.uz/a,sh', 'shahar.uz/a,sh'],
  ['Shahar.uz’ning', 'Shahar.uzʼning'],
  ['Сайт:shahar.uzда', 'Sayt:shahar.uzda'],
  ["kun.uz/o'zbek", "kun.uz/o'zbek"],
  ['bit.ly/3shCHq', 'bit.ly/3shCHq'],
  ['youtu.be/aShch12', 'youtu.be/aShch12'],
  ['championat.asia/uz/shahar', 'championat.asia/uz/shahar'],
])('%s keeps its address intact', (input, expected) => {
  expect(t(input)).toBe(expected)
})

test('an initial before a surname is still text', () => {
  expect(t('Sh.Mirziyoyev')).toBe('Ş.Mirziyoyev')
})

test('stays fast on 100,000 characters of repeated domain endings', () => {
  const started = performance.now()
  findProtectedSpans('a.uz'.repeat(25_000))
  expect(performance.now() - started).toBeLessThan(250)
})
