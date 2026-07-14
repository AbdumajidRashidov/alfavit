import type { ReactNode } from 'react'
import { render } from '@testing-library/react'
import { HelmetProvider } from 'react-helmet-async'
import { RouterProvider, MemoryRouter, createMemoryRouter } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { routes } from '../router'

// Full app at a given path (routes include RootLayout → LanguageProvider).
// Wrapped in HelmetProvider because page components render <Seo>, which uses
// vite-react-ssg's <Head> (react-helmet-async under the hood) and needs a
// HelmetProvider ancestor — normally supplied by vite-react-ssg's own entrypoint.
export function renderApp(path: string) {
  const router = createMemoryRouter(routes as unknown as RouteObject[], { initialEntries: [path] })
  return render(
    <HelmetProvider>
      <RouterProvider router={router} />
    </HelmetProvider>,
  )
}

// A single component under the language provider at a chosen locale path.
export function renderWithLocale(ui: ReactNode, path = '/') {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <LanguageProvider>{ui}</LanguageProvider>
      </MemoryRouter>
    </HelmetProvider>,
  )
}
