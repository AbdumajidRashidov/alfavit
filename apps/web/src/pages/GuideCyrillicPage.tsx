import { useT } from '../i18n/useT'
import { GuidePage } from '../components/GuidePage'
import { cyrillicToLatin } from '../content/guides/cyrillicToLatin'

export function GuideCyrillicPage() {
  const { locale } = useT()
  const guide = cyrillicToLatin[locale]
  return <GuidePage guide={guide} pagePath="guide/cyrillic-to-latin" titleKey="meta.guide.cyrillic.title" descKey="meta.guide.cyrillic.desc" />
}
