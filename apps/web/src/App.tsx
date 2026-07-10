import { LanguageProvider } from './i18n/LanguageProvider'
import { Hero } from './components/Hero'
import { Converter } from './components/Converter'
import { Channels } from './components/Channels'
import { Footer } from './components/Footer'

export default function App() {
  return (
    <LanguageProvider>
      <main>
        <Hero />
        <Converter />
        <Channels />
      </main>
      <Footer />
    </LanguageProvider>
  )
}
