import { LanguageProvider } from './i18n/LanguageProvider'
import { Hero } from './components/Hero'
import { Converter } from './components/Converter'
import { FileConverter } from './components/FileConverter'
import { Channels } from './components/Channels'
import { Footer } from './components/Footer'

export default function App() {
  return (
    <LanguageProvider>
      <main>
        <Hero />
        <Converter />
        <FileConverter />
        <Channels />
      </main>
      <Footer />
    </LanguageProvider>
  )
}
