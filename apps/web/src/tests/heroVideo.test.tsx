import { screen } from '@testing-library/react'
import { expect, test, beforeEach, vi } from 'vitest'
import { renderWithLocale } from './renderApp'
import { Hero } from '../components/Hero'

/** jsdom has no matchMedia; install one that answers our two queries. */
function mockMedia({ wide, reduced }: { wide: boolean; reduced: boolean }) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (q: string) => ({
      matches: q.includes('prefers-reduced-motion') ? reduced : wide,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  })
}

beforeEach(() => {
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)
})

const video = () => document.querySelector('video')
const poster = () => document.querySelector('img[src="/hero-poster.jpg"]')

test('the poster renders for everyone', () => {
  mockMedia({ wide: true, reduced: false })
  renderWithLocale(<Hero />)
  expect(poster()).toBeInTheDocument()
})

test('desktop without reduced motion gets the video', () => {
  mockMedia({ wide: true, reduced: false })
  renderWithLocale(<Hero />)
  expect(video()).toBeInTheDocument()
  expect(video()).toHaveAttribute('src', '/hero.mp4')
})

test('mobile gets NO video element, so the bytes are never requested', () => {
  mockMedia({ wide: false, reduced: false })
  renderWithLocale(<Hero />)
  expect(video()).not.toBeInTheDocument()
  expect(poster()).toBeInTheDocument()
})

test('reduced motion gets NO video element, even on a wide screen', () => {
  mockMedia({ wide: true, reduced: true })
  renderWithLocale(<Hero />)
  expect(video()).not.toBeInTheDocument()
  expect(poster()).toBeInTheDocument()
})

test('the video is self-hosted, not on a third-party CDN', () => {
  mockMedia({ wide: true, reduced: false })
  renderWithLocale(<Hero />)
  const src = video()?.getAttribute('src') ?? ''
  expect(src.startsWith('/')).toBe(true)
  expect(src).not.toContain('cloudfront')
  expect(src).not.toContain('//')
})

test('the headline still renders regardless of the media decision', () => {
  mockMedia({ wide: false, reduced: true })
  renderWithLocale(<Hero />)
  expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
})
