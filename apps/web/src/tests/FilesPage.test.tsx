import { screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { renderWithLocale } from './renderApp'
import { FilesPage } from '../pages/FilesPage'

test('/files has one H1, and it names Word documents', () => {
  renderWithLocale(<FilesPage />, '/en')
  const h1s = screen.getAllByRole('heading', { level: 1 })
  expect(h1s).toHaveLength(1)
  expect(h1s[0]).toHaveTextContent('Word document')
})
