import { Outlet } from 'react-router-dom'
import { Head } from 'vite-react-ssg'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { Nav } from './Nav'
import { Footer } from './Footer'
import { organizationLd, websiteLd } from '../seo/jsonld'
import { useTrackPageview } from '../analytics/useTrackPageview'

export function RootLayout() {
  useTrackPageview()
  return (
    <LanguageProvider>
      <Head>
        <script type="application/ld+json">{JSON.stringify(organizationLd)}</script>
        <script type="application/ld+json">{JSON.stringify(websiteLd)}</script>
      </Head>
      <Nav />
      <main>
        <Outlet />
      </main>
      <Footer />
    </LanguageProvider>
  )
}
