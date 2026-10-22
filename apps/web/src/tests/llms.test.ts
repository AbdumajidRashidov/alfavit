import { expect, test } from 'vitest'
import { generateLlmsTxt } from '../seo/llms'
import { SITE_URL } from '../seo/config'

test('llms.txt names every tool with a way to reach it', () => {
  const txt = generateLlmsTxt()
  expect(txt).toContain('## Tools')
  expect(txt).toContain('POST https://api.alfavit.uz/v1/transliterate')
  expect(txt).toContain('https://t.me/alfavit_uz_bot')
  expect(txt).toContain('@alfavit/engine')
  expect(txt).toContain(`${SITE_URL}/apps`)
  expect(txt).toContain(`${SITE_URL}/llms-full.txt`)
  expect(txt).toContain('How to type Ö, Ğ, Ş, Ç')
})

test('llms.txt never links the counted download routes', () => {
  expect(generateLlmsTxt()).not.toContain('/dl/')
})

// Review of d1a5e03: the web converter returns text only; flags reach users
// through the API. A model repeating this file must not promise highlights.
test('only the API line promises flags', () => {
  const lines = generateLlmsTxt().split('\n')
  const web = lines.find((l) => l.startsWith('- Web converter'))!
  const api = lines.find((l) => l.startsWith('- Public API'))!
  expect(web).not.toMatch(/flag/i)
  expect(api).toMatch(/flags/)
})

// Review of 192c486: /kirill exists once, in Uzbek Cyrillic; and the guides are
// now converter pages, one per direction.
test('llms.txt does not claim every page has three language versions', () => {
  const txt = generateLlmsTxt()
  expect(txt).not.toContain('Every page exists in')
  expect(txt).toMatch(/\/kirill[^\n]*(only|once)/)
})

test('llms.txt names a converter URL for each direction', () => {
  const web = generateLlmsTxt().split('\n').find((l) => l.startsWith('- Web converter'))!
  for (const path of ['/guide/cyrillic-to-latin', '/guide/old-latin-to-new', '/kirill']) expect(web).toContain(`${SITE_URL}${path}`)
})
