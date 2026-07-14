import { useT } from '../i18n/useT'
import { GuidePage } from '../components/GuidePage'
import { oldLatinToNew } from '../content/guides/oldLatinToNew'

export function GuideOldLatinPage() {
  const { locale } = useT()
  const guide = oldLatinToNew[locale === 'ru' ? 'ru' : 'uz']
  return <GuidePage guide={guide} pagePath="guide/old-latin-to-new" titleKey="meta.guide.oldlatin.title" descKey="meta.guide.oldlatin.desc" />
}
