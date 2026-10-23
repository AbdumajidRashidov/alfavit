import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi, beforeEach } from 'vitest'
import { renderWithLocale, renderApp } from './renderApp'
import { GuideKeyboardPage } from '../pages/GuideKeyboardPage'
import { keyboard } from '../content/guides/keyboard'
import { translations, LOCALES } from '../i18n/translations'

beforeEach(() => {
  localStorage.clear()
  Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true })
})

test('renders the title, five steps and the four letter buttons', () => {
  renderWithLocale(<GuideKeyboardPage />, '/en')
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('How to type Ö, Ğ, Ş, Ç on a keyboard and phone')
  expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(5)
  for (const pair of ['Ö ö', 'Ğ ğ', 'Ş ş', 'Ç ç']) expect(screen.getByText(pair)).toBeInTheDocument()
  expect(screen.getByText(/Alfavit will ship the official placement as soon as it is published/)).toBeInTheDocument()
})

test('letters run in the official order, and phones come before computers', () => {
  renderWithLocale(<GuideKeyboardPage />, '/en')
  const letters = screen.getAllByRole('button', { name: /^Copy / }).map((b) => b.getAttribute('aria-label'))
  expect(letters).toEqual(['Copy ö', 'Copy ğ', 'Copy ş', 'Copy ç'])
  const steps = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
  expect(steps.slice(0, 5)).toEqual(['Install the Alfavit keyboard layout (Mac and Linux)', 'Copy the letters from this page', 'iPhone and Android', 'Windows', 'Mac'])
})

test('says the Windows app converts as you type, not just the Mac app', () => {
  renderWithLocale(<GuideKeyboardPage />, '/en')
  expect(screen.getByText(/the Windows and Mac apps convert as you type/)).toBeInTheDocument()
})

test('warns that the Turkish keyboard brings Turkish autocorrect', () => {
  renderWithLocale(<GuideKeyboardPage />, '/en')
  expect(screen.getByText(/Turkish autocorrect and predictions, which will fight Uzbek words/)).toBeInTheDocument()
})

test('clicking a letter copies its lowercase form', async () => {
  const user = userEvent.setup()
  renderWithLocale(<GuideKeyboardPage />, '/en')
  const writeText = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
  await user.click(screen.getByRole('button', { name: 'Copy ş' }))
  expect(writeText).toHaveBeenCalledWith('ş')
  expect(screen.getByText('Copied')).toBeInTheDocument()
})

test('is routed under every locale', () => {
  renderApp('/ru/guide/keyboard')
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Как набрать Ö, Ğ, Ş, Ç на клавиатуре и телефоне')
})

// Final review of week 3: on the Turkish Q layout the key where i usually sits
// types a dotless ı, so every place that recommends it says where the dotted i is.
test.each(LOCALES)('in %s, every Turkish-keyboard step and the /alphabet answer warn about the dotless ı', (locale) => {
  const [, , phone, windows, mac] = keyboard[locale].steps
  for (const step of [phone, windows, mac]) expect(step.body).toContain('ı')
  expect(translations[locale]['alphabet.qa.typeO.a']).toContain('ı')
})

test('the first step links to the layout page', () => {
  renderWithLocale(<GuideKeyboardPage />, '/en')
  expect(screen.getByRole('link', { name: /Get the layout/ })).toHaveAttribute('href', '/en/keyboard-layout')
})

test.each(LOCALES)('in %s, the new first step links to keyboard-layout', (locale) => {
  expect(keyboard[locale].steps[0].link?.pagePath).toBe('keyboard-layout')
})
