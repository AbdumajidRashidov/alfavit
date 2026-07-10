import { expect, test } from 'vitest'
import { pickLocale, strings, type Locale } from '../i18n'

test('pickLocale maps language codes, defaults to uz', () => {
  expect(pickLocale('ru-RU')).toBe('ru')
  expect(pickLocale('en-GB')).toBe('en')
  expect(pickLocale('uz')).toBe('uz')
  expect(pickLocale('de')).toBe('uz')
  expect(pickLocale(undefined)).toBe('uz')
})

test('all locales expose the same string keys', () => {
  const locales: Locale[] = ['uz', 'ru', 'en']
  const keysOf = (l: Locale) => Object.keys(strings[l]).sort().join(',')
  expect(keysOf('ru')).toBe(keysOf('uz'))
  expect(keysOf('en')).toBe(keysOf('uz'))
})
