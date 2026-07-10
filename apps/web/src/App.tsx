import { LanguageProvider } from './i18n/LanguageProvider'
import { Hero } from './components/Hero'
import { Converter } from './components/Converter'
import { FileConverter } from './components/FileConverter'
import { Channels } from './components/Channels'
import { Developers } from './components/Developers'
import { Footer } from './components/Footer'

export default function App() {
  return (
    <LanguageProvider>
      <main>
        <Hero />
        <Converter />
        <FileConverter />
        <Channels />
        <Developers />
      </main>
      <Footer />
    </LanguageProvider>
  )
}
