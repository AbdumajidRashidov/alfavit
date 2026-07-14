import { Developers } from '../components/Developers'
import { Seo } from '../components/Seo'

export function DevelopersPage() {
  return (
    <>
      <Seo titleKey="meta.dev.title" descKey="meta.dev.desc" pagePath="developers" breadcrumb />
      <Developers />
    </>
  )
}
