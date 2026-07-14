import { Channels } from '../components/Channels'
import { usePageMeta } from '../i18n/usePageMeta'

export function AppsPage() {
  usePageMeta('meta.apps.title', 'meta.apps.desc')
  return <Channels />
}
