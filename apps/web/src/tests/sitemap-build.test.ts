import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from 'vitest'
import { CHECKED_ON, STAGE, type ReformStage } from '../content/status'
import { PAGE_PATHS } from '../seo/config'

// One <url> per page per language version it has.
const URL_COUNT = PAGE_PATHS.reduce((n, p) => n + p.locales.length, 0)

test('dist/sitemap.xml has every locale URL', () => {
  const xml = readFileSync(resolve(__dirname, '../../dist/sitemap.xml'), 'utf-8')
  expect(URL_COUNT).toBe(40) // 13 pages x 3 languages, plus /kirill in Uzbek only
  expect((xml.match(/<loc>/g) ?? []).length).toBe(URL_COUNT)
  expect(xml).toContain('<loc>https://alfavit.uz/ru/files</loc>')
  expect(xml).toContain('<loc>https://alfavit.uz/en/alphabet</loc>')
  expect(xml).toContain('<loc>https://alfavit.uz/ru/status</loc>')
  expect(xml).toContain('hreflang="x-default"')
})

test('dist/llms.txt and robots.txt are present', () => {
  const llms = readFileSync(resolve(__dirname, '../../dist/llms.txt'), 'utf-8')
  expect(llms).toContain('# Alfavit')
  const robots = readFileSync(resolve(__dirname, '../../dist/robots.txt'), 'utf-8')
  expect(robots).toContain('GPTBot')
  expect(robots).toContain('Sitemap: https://alfavit.uz/sitemap.xml')
})

test('dist/sitemap.xml declares the chart image on every alphabet URL', () => {
  const xml = readFileSync(resolve(__dirname, '../../dist/sitemap.xml'), 'utf-8')
  expect(xml).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"')
  // One per locale, and only on the alphabet pages.
  expect((xml.match(/<image:loc>/g) ?? []).length).toBe(3)
  expect(xml).toContain('<image:loc>https://alfavit.uz/chart/lotin-alifbosi-jadvali-2026.png</image:loc>')
  expect(xml).toContain('<image:loc>https://alfavit.uz/chart/uzbekskiy-alfavit-2026.png</image:loc>')
})

test('every sitemap URL carries a lastmod, and none points at the 404', () => {
  const xml = readFileSync(resolve(__dirname, '../../dist/sitemap.xml'), 'utf-8')
  expect((xml.match(/<lastmod>/g) ?? []).length).toBe(URL_COUNT)
  // An inaccurate or missing lastmod makes Google stop trusting the file.
  for (const d of xml.match(/<lastmod>([^<]+)<\/lastmod>/g) ?? []) {
    const date = d.replace(/<\/?lastmod>/g, '')
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(new Date(date).getTime()).not.toBeNaN()
  }
  expect(xml).not.toContain('/404')
})

test('priority follows search value: /alphabet outranks /files', () => {
  const xml = readFileSync(resolve(__dirname, '../../dist/sitemap.xml'), 'utf-8')
  const priorityOf = (loc: string) =>
    Number(
      new RegExp(`<loc>${loc}</loc>[\\s\\S]*?<priority>([\\d.]+)</priority>`).exec(xml)?.[1] ?? '0',
    )
  expect(priorityOf('https://alfavit.uz/alphabet')).toBeGreaterThan(
    priorityOf('https://alfavit.uz/files'),
  )
  expect(priorityOf('https://alfavit.uz/reform')).toBeGreaterThan(
    priorityOf('https://alfavit.uz/developers'),
  )
})

// llms.txt is generated from STAGE, so this follows it too. Pinning one stage's
// wording here failed the signature-day build for a correct llms.txt.
const LLMS_STATUS: Record<ReformStage, string> = {
  'awaiting-signature': 'passed but not yet in force',
  signed: 'signed, and takes effect on 2027-04-22',
  'in-force': 'the reform is **in force**',
}

test('dist/llms.txt states when it was last checked and the current legal status', () => {
  const llms = readFileSync(resolve(__dirname, '../../dist/llms.txt'), 'utf-8')
  expect(llms).toContain(`Last updated: ${CHECKED_ON}`)
  expect(llms).toContain(LLMS_STATUS[STAGE])
  // The official text, so a model can check the claim at the source.
  if (STAGE !== 'awaiting-signature') expect(llms).toContain('https://lex.uz/uz/docs/8548754')
})

test('dist/llms-full.txt is emitted', () => {
  const full = readFileSync(resolve(__dirname, '../../dist/llms-full.txt'), 'utf-8')
  expect(full.startsWith('# Alfavit')).toBe(true)
})

// Browsers must save the layout files, not show the .keylayout's XML in a tab:
// Cloudflare Pages reads dist/_headers. The zip says it is a zip, so Safari
// unpacks it the way it unpacks any downloaded archive.
test('dist/_headers makes every keyboard layout file download', () => {
  const headers = readFileSync(resolve(__dirname, '../../dist/_headers'), 'utf-8')
  for (const [file, type] of [
    ['Ozbek-yangi-alifbo.zip', 'application/zip'],
    ['Ozbek-yangi-alifbo.keylayout', 'application/octet-stream'],
    ['alfavit-xkb.tar.gz', 'application/octet-stream'],
  ]) {
    const block = headers.split(/\n(?=\/)/).find((b) => b.startsWith(`/download/${file}\n`))
    expect(block, file).toBeDefined()
    expect(block).toContain(`Content-Disposition: attachment; filename="${file}"`)
    expect(block).toContain(`Content-Type: ${type}`)
  }
})
