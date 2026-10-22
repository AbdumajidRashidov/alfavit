import { expect, test } from 'vitest'
import { renderApp } from './renderApp'

// The chart ranks ~27 in image search with 2k impressions a month; it was only
// on /alphabet. These pages draw the same image-intent searches.
test.each([
  ['/en/reform', '/chart/uzbek-latin-alphabet-2026.png'],
  ['/reform', '/chart/lotin-alifbosi-jadvali-2026.png'],
  ['/ru/guide/keyboard', '/chart/uzbekskiy-alfavit-2026.png'],
  ['/alphabet', '/chart/lotin-alifbosi-jadvali-2026.png'],
])('%s shows the chart for its language', (path, png) => {
  const { container } = renderApp(path)
  const img = container.querySelector(`img[src="${png}"]`)
  expect(img).not.toBeNull()
  expect(img!.getAttribute('alt')!.length).toBeGreaterThan(20)
})
