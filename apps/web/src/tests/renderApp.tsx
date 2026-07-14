import type { ReactNode } from 'react'
import { render } from '@testing-library/react'
import { RouterProvider, MemoryRouter, createMemoryRouter } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { routes } from '../router'

// Full app at a given path (routes include RootLayout → LanguageProvider).
export function renderApp(path: string) {
  const router = createMemoryRouter(routes as unknown as RouteObject[], { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

// A single component under the language provider at a chosen locale path.
export function renderWithLocale(ui: ReactNode, path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <LanguageProvider>{ui}</LanguageProvider>
    </MemoryRouter>,
  )
}
