import { FileConverter } from '../components/FileConverter'
import { Seo } from '../components/Seo'

export function FilesPage() {
  return (
    <>
      <Seo titleKey="meta.files.title" descKey="meta.files.desc" pagePath="files" breadcrumb />
      <FileConverter />
    </>
  )
}
