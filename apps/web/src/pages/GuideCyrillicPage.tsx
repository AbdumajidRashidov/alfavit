import { useT } from '../i18n/useT'
import { GuidePage } from '../components/GuidePage'
import { cyrillicToLatin } from '../content/guides/cyrillicToLatin'

export function GuideCyrillicPage() {
  const { locale } = useT()
  // Guides ship uz/ru only; the router never mounts this at /en.
  const guide = cyrillicToLatin[locale === 'ru' ? 'ru' : 'uz']
  return <GuidePage guide={guide} pagePath="guide/cyrillic-to-latin" titleKey="meta.guide.cyrillic.title" descKey="meta.guide.cyrillic.desc" />
}
