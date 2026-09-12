import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { expect, test, beforeEach } from 'vitest'
import { useTrackPageview } from '../analytics/useTrackPageview'

let sent: string[]

beforeEach(() => {
  sent = []
  Object.defineProperty(navigator, 'sendBeacon', {
    configurable: true,
    writable: true,
    value: (_url: string, body: string) => { sent.push(body); return true },
  })
})

function Harness() {
  useTrackPageview()
  return (
    <Routes>
      <Route path="/" element={<Link to="/apps">apps</Link>} />
      <Route path="/apps" element={<p>apps page</p>} />
    </Routes>
  )
}

test('fires one pageview on first render', () => {
  render(<MemoryRouter initialEntries={['/']}><Harness /></MemoryRouter>)
  expect(sent).toHaveLength(1)
  expect(JSON.parse(sent[0]).e).toBe('pageview')
})

test('fires again on a soft navigation', async () => {
  render(<MemoryRouter initialEntries={['/']}><Harness /></MemoryRouter>)
  await userEvent.click(screen.getByText('apps'))
  expect(await screen.findByText('apps page')).toBeInTheDocument()
  expect(sent).toHaveLength(2)
})

test('does not fire again when the path is unchanged', () => {
  const { rerender } = render(<MemoryRouter initialEntries={['/']}><Harness /></MemoryRouter>)
  const before = sent.length
  rerender(<MemoryRouter initialEntries={['/']}><Harness /></MemoryRouter>)
  expect(sent.length).toBe(before)
})
