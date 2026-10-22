import { screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Footer } from '../components/Footer'
import { renderWithLocale } from './renderApp'

// jsdom has no layout, so this guards the class that lets the footer links
// wrap. Without it the nav can't get narrower than its one-line width, and
// every page scrolls sideways on phones (476px wide on a 375px screen).
test('footer links wrap onto new rows instead of widening the page', () => {
  renderWithLocale(<Footer />, '/')
  expect(screen.getByRole('navigation')).toHaveClass('flex-wrap')
})
