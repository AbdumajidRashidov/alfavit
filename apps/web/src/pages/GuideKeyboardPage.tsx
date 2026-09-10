import { useT } from '../i18n/useT'
import { GuidePage } from '../components/GuidePage'
import { keyboard } from '../content/guides/keyboard'

export function GuideKeyboardPage() {
  const { locale } = useT()
  return <GuidePage guide={keyboard[locale]} pagePath="guide/keyboard" titleKey="meta.guide.keyboard.title" descKey="meta.guide.keyboard.desc" />
}
