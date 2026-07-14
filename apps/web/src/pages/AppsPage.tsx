import { Channels } from '../components/Channels'
import { Seo } from '../components/Seo'

export function AppsPage() {
  return (
    <>
      <Seo titleKey="meta.apps.title" descKey="meta.apps.desc" pagePath="apps" breadcrumb />
      <Channels />
    </>
  )
}
