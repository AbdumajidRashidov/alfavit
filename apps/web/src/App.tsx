import { LanguageProvider } from './i18n/LanguageProvider'
import { Hero } from './components/Hero'
import { Converter } from './components/Converter'
import { MorphShowcase } from './components/MorphShowcase'
import { Footer } from './components/Footer'

export default function App() {
  return (
    <LanguageProvider>
      <main>
        <Hero />
        <Converter />
        <MorphShowcase />
      </main>
      <Footer />
    </LanguageProvider>
  )
}
