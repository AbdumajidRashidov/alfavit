import { FileConverter } from '../components/FileConverter'
import { Seo } from '../components/Seo'
import { useT } from '../i18n/useT'

export function FilesPage() {
  const { t } = useT()
  return (
    <>
      <Seo titleKey="meta.files.title" descKey="meta.files.desc" pagePath="files" breadcrumb breadcrumbName={t('nav.files')} />
      <FileConverter />
    </>
  )
}
