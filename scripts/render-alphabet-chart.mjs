#!/usr/bin/env node
/**
 * Renders the printable alphabet chart — one PNG and one A4 PDF per locale —
 * into apps/web/public/chart.
 *
 * Why: /alphabet ranks around position 4 for "lotin alifbosi jadvali",
 * "uzbek alifbosi rasmi" and friends and earns almost no clicks from them,
 * because the page has no image at all and those searchers are looking at
 * an image pack. A chart is also the thing teachers ask for ("husnixat
 * daftari pdf", "bolalar uchun"), hence the print output.
 *
 * The letters come from apps/web/src/content/alphabet.ts, so the chart cannot
 * drift from the table on the page. Labels come from the same translation
 * catalogue the page uses.
 *
 * Run by hand after changing letters, sounds or labels; the outputs are
 * committed. CI never runs this — it needs a Chrome binary, and the deploy
 * build must stay dependency-free.
 *
 *   node scripts/render-alphabet-chart.mjs
 */
import { execFile } from 'node:child_process'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { promisify } from 'node:util'

import { LETTERS, SOUNDS } from '../apps/web/src/content/alphabet.ts'
import { CHART_BASENAME, CHART_WIDTH, CHART_HEIGHT } from '../apps/web/src/content/chart.ts'
import { translations } from '../apps/web/src/i18n/translations.ts'

const run = promisify(execFile)
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'apps/web/public/chart')
const FONT_DIR = join(ROOT, 'apps/web/public/fonts')

const CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
]

const chrome = CHROME_CANDIDATES.find((p) => existsSync(p))
if (!chrome) {
  console.error(`No Chrome binary found. Looked in:\n  ${CHROME_CANDIDATES.join('\n  ')}`)
  process.exit(1)
}

// A4 at 96dpi, which is the px grid Chrome maps `size: A4` onto. Authoring in
// these units means one layout serves both the screenshot and the print page.
const PAGE_W = 794
const PAGE_H = 1123
// Google Images favours large originals. The scale is derived from the size the
// app advertises in <img width/height>, so the two can never disagree.
const SCALE = CHART_WIDTH / PAGE_W

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function template(locale) {
  const t = (key) => translations[locale][key]
  const sounds = SOUNDS[locale]
  const fontUrl = (f) => pathToFileURL(join(FONT_DIR, f)).href

  const rows = LETTERS.map(
    (L) => `
      <tr class="${L.changed ? 'changed' : ''}">
        <td class="new">${esc(L.latin)}${L.changed ? `<span class="badge">${esc(t('alphabet.changedLabel'))}</span>` : ''}</td>
        <td>${esc(L.old)}</td>
        <td>${esc(L.cyrillic)}</td>
        <td class="sound">${esc(sounds[L.id])}</td>
        <td class="example">${esc(L.example)}${L.exampleOld ? `<span class="was">${esc(L.exampleOld)}</span>` : ''}</td>
      </tr>`,
  ).join('')

  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<style>
  @font-face { font-family: Inter; font-weight: 400; src: url("${fontUrl('inter-400-latin.woff2')}") format("woff2"); }
  @font-face { font-family: Inter; font-weight: 400; src: url("${fontUrl('inter-400-latin-ext.woff2')}") format("woff2"); unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1E00-1E9F, U+2C60-2C7F, U+A720-A7FF; }
  @font-face { font-family: Inter; font-weight: 400; src: url("${fontUrl('inter-400-cyrillic.woff2')}") format("woff2"); unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116; }
  @font-face { font-family: Inter; font-weight: 500; src: url("${fontUrl('inter-500-latin.woff2')}") format("woff2"); }
  @font-face { font-family: Inter; font-weight: 500; src: url("${fontUrl('inter-500-latin-ext.woff2')}") format("woff2"); unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1E00-1E9F, U+2C60-2C7F, U+A720-A7FF; }
  @font-face { font-family: Inter; font-weight: 500; src: url("${fontUrl('inter-500-cyrillic.woff2')}") format("woff2"); unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116; }
  @font-face { font-family: "Instrument Serif"; font-weight: 400; src: url("${fontUrl('instrument-serif-400-latin.woff2')}") format("woff2"); }
  @font-face { font-family: "Instrument Serif"; font-weight: 400; src: url("${fontUrl('instrument-serif-400-latin-ext.woff2')}") format("woff2"); unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1E00-1E9F, U+2C60-2C7F, U+A720-A7FF; }

  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: ${PAGE_W}px; height: ${PAGE_H}px;
    background: #f2f1ec; color: #000;
    font-family: Inter, sans-serif;
    padding: 38px 44px 28px;
    display: flex; flex-direction: column;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  h1 { font-family: "Instrument Serif", serif; font-weight: 400; font-size: 40px; line-height: 1.05; letter-spacing: -0.6px; }
  .sub { margin-top: 6px; font-size: 12px; color: #5b5850; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; flex: 1; }
  th {
    text-align: left; font-size: 8.5px; font-weight: 500; text-transform: uppercase;
    letter-spacing: 0.09em; color: #5b5850; padding-bottom: 7px;
    border-bottom: 1px solid rgba(0,0,0,.22);
  }
  td { padding: 0; border-bottom: 1px solid rgba(0,0,0,.08); font-size: 12px; height: 30px; vertical-align: middle; }
  td.new { font-size: 15px; font-weight: 500; white-space: nowrap; }
  td.sound { color: #5b5850; font-size: 10.5px; }
  td.example { font-size: 12px; }
  /* On the four changed rows, the old spelling is the whole point of the
     comparison — show it struck through next to the new one. */
  .was { margin-left: 7px; font-size: 10.5px; color: #5b5850; text-decoration: line-through; }
  th:nth-child(1), td:nth-child(1) { width: 21%; padding-left: 8px; }
  th:nth-child(2), td:nth-child(2) { width: 16%; }
  th:nth-child(3), td:nth-child(3) { width: 13%; }
  th:nth-child(4), td:nth-child(4) { width: 30%; }
  th:nth-child(5), td:nth-child(5) { width: 20%; }
  tr.changed td { background: rgba(0,0,0,.045); }
  tr.changed td:first-child { box-shadow: inset 3px 0 0 #000; }
  .badge {
    display: inline-block; margin-left: 7px; padding: 1.5px 6px; border-radius: 999px;
    background: rgba(0,0,0,.1); font-size: 7.5px; font-weight: 500; text-transform: uppercase;
    letter-spacing: 0.05em; vertical-align: 2px;
  }
  footer {
    margin-top: 14px; padding-top: 10px; border-top: 1px solid rgba(0,0,0,.22);
    display: flex; justify-content: space-between; align-items: flex-end; gap: 16px;
  }
  .note { font-size: 9px; color: #5b5850; max-width: 72%; line-height: 1.45; }
  .mark { font-family: "Instrument Serif", serif; font-size: 17px; white-space: nowrap; }
  .mark span { display: block; font-family: Inter, sans-serif; font-size: 8px; color: #5b5850; letter-spacing: 0.04em; }
</style>
</head>
<body>
  <header>
    <h1>${esc(t('alphabet.title'))}</h1>
    <p class="sub">${esc(t('alphabet.intro'))}</p>
  </header>
  <table>
    <thead>
      <tr>
        <th>${esc(t('alphabet.col.new'))}</th>
        <th>${esc(t('alphabet.col.old'))}</th>
        <th>${esc(t('alphabet.col.cyrillic'))}</th>
        <th>${esc(t('alphabet.col.sound'))}</th>
        <th>${esc(t('alphabet.col.example'))}</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <footer>
    <p class="note"><strong>${esc(t('alphabet.tutuq.label'))}</strong> — ${esc(t('alphabet.tutuq.note'))}</p>
    <p class="mark">alfavit.uz<span>2026</span></p>
  </footer>
</body>
</html>
`
}

async function chromeRun(args) {
  await run(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    '--allow-file-access-from-files',
    // Fonts are file:// URLs; without a pause Chrome can shoot before they land.
    '--virtual-time-budget=4000',
    ...args,
  ])
}

await mkdir(OUT_DIR, { recursive: true })

for (const [locale, base] of Object.entries(CHART_BASENAME)) {
  const htmlPath = join(OUT_DIR, `.${base}.html`)
  await writeFile(htmlPath, template(locale))
  const url = pathToFileURL(htmlPath).href

  await chromeRun([
    `--screenshot=${join(OUT_DIR, `${base}.png`)}`,
    `--window-size=${PAGE_W},${PAGE_H}`,
    `--force-device-scale-factor=${SCALE}`,
    url,
  ])
  await chromeRun([`--print-to-pdf=${join(OUT_DIR, `${base}.pdf`)}`, '--no-pdf-header-footer', url])

  await rm(htmlPath)
  console.log(`  ${locale}  ${base}.png + .pdf`)
}

console.log(
  `\n${Object.keys(CHART_BASENAME).length} locales -> apps/web/public/chart (${CHART_WIDTH}x${CHART_HEIGHT} PNG + A4 PDF)`,
)
