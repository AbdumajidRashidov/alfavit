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
