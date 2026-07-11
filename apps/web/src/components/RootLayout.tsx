import { Outlet } from 'react-router-dom'
import { Nav } from './Nav'
import { Footer } from './Footer'

export function RootLayout() {
  return (
    <>
      <Nav />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
