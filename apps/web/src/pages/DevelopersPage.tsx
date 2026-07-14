import { Developers } from '../components/Developers'
import { usePageMeta } from '../i18n/usePageMeta'

export function DevelopersPage() {
  usePageMeta('meta.dev.title', 'meta.dev.desc')
  return <Developers />
}
