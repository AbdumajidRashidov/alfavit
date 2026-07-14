import { Outlet } from 'react-router-dom'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { Nav } from './Nav'
import { Footer } from './Footer'

export function RootLayout() {
  return (
    <LanguageProvider>
      <Nav />
      <main>
        <Outlet />
      </main>
      <Footer />
    </LanguageProvider>
  )
}
