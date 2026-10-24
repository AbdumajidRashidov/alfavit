import { screen } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'
import { DOWNLOADS, KEY_TABLE, MAC_BUNDLE, macDisplaced } from '@alfavit/layouts'
import { renderWithLocale, renderApp } from './renderApp'
import { KeyboardLayoutPage } from '../pages/KeyboardLayoutPage'
import { keyboardLayout } from '../content/keyboardLayout'
import { LOCALES } from '../i18n/translations'
import { generateSitemapXml } from '../seo/config'

beforeEach(() => {
  localStorage.clear()
  Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true })
})

test('renders the combos from the key table', () => {
  renderWithLocale(<KeyboardLayoutPage />, '/en')
  for (const k of KEY_TABLE) expect(screen.getAllByText(k.lower).length).toBeGreaterThan(0)
  expect(screen.getByText('Özbek (yangi alifbo)')).toBeInTheDocument()
})

test('lists every displaced character', () => {
  renderWithLocale(<KeyboardLayoutPage />, '/en')
  for (const d of macDisplaced()) expect(screen.getAllByText(d.was).length).toBeGreaterThan(0)
})

test('downloads go through the counted routes', () => {
  renderWithLocale(<KeyboardLayoutPage />, '/en')
  const hrefs = screen.getAllByRole('link', { name: /download/i }).map((a) => a.getAttribute('href'))
  expect(hrefs).toEqual(['/dl/mac-layout', '/dl/linux-layout'])
})

// Review Focus 1: if the layout is missing from Input Sources, the page says how to fix it.
test('tells Mac users what to do if the layout is not listed', () => {
  renderWithLocale(<KeyboardLayoutPage />, '/en')
  expect(screen.getByText(/xattr -r -d com\.apple\.quarantine "\$HOME\/Library\/Keyboard Layouts\/Ozbek-yangi-alifbo\.bundle"/)).toBeInTheDocument()
})

// The download is a zip of the bundle; the bundle is what goes into the folder.
test.each(LOCALES)('in %s, the Mac steps unzip the archive and move the bundle', (locale) => {
  const { steps, notListed, uninstall } = keyboardLayout[locale].mac
  expect(steps.join(' ')).toContain(DOWNLOADS.mac)
  expect(steps.join(' ')).toContain(MAC_BUNDLE)
  expect(notListed).toContain(MAC_BUNDLE)
  expect(uninstall).toContain(MAC_BUNDLE)
})

// Two copies of one layout would both show up in Input Sources.
test.each(LOCALES)('in %s, the Mac steps say to delete the earlier single file first', (locale) => {
  expect(keyboardLayout[locale].mac.steps.join(' ')).toContain(DOWNLOADS.macKeylayout)
})

test('makes no install-time or "official" claim in any locale', () => {
  for (const l of LOCALES) expect(JSON.stringify(keyboardLayout[l])).not.toMatch(/minute|daqiqa|минут|official|rasmiy|официальн/i)
})

test('is routed and in the sitemap under every locale', () => {
  renderApp('/ru/keyboard-layout')
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(keyboardLayout.ru.title)
  const xml = generateSitemapXml()
  for (const path of ['/keyboard-layout', '/ru/keyboard-layout', '/en/keyboard-layout'])
    expect(xml).toContain(`<loc>https://alfavit.uz${path}</loc>`)
})

// Spec, success criterion 2: a one-line uninstall — on Linux as on the Mac.
test.each(LOCALES)('in %s, Linux users are told how to remove the layout', (locale) => {
  const { uninstall } = keyboardLayout[locale].linux
  expect(uninstall).toContain('rm ~/.config/xkb/symbols/uz ~/.config/xkb/rules/evdev.xml')
})

// A fresh terminal opens in ~, not in the download folder.
test.each(LOCALES)('in %s, the tar command works from a fresh terminal', (locale) => {
  expect(keyboardLayout[locale].linux.steps.join(' ')).toContain('tar -xzf ~/Downloads/alfavit-xkb.tar.gz -C ~/.config')
})

// Only libxkbcommon (what GNOME uses) was tested; no other desktop is promised.
test.each(LOCALES)('in %s, the Linux copy names no desktop it was not tested on', (locale) => {
  expect(JSON.stringify(keyboardLayout[locale].linux)).not.toMatch(/KDE|Plasma|Sway/)
})

// Unpacking replaces ~/.config/xkb/rules/evdev.xml and symbols/uz.
test.each(LOCALES)('in %s, the page warns that unpacking replaces existing files', (locale) => {
  expect(keyboardLayout[locale].linux.caution).toMatch(/evdev\.xml/)
})

test('the page shows the Linux uninstall and caution', () => {
  renderWithLocale(<KeyboardLayoutPage />, '/en')
  expect(screen.getByText(/rm ~\/\.config\/xkb\/symbols\/uz/)).toBeInTheDocument()
  expect(screen.getByText(keyboardLayout.en.linux.caution)).toBeInTheDocument()
})
