import { FileConverter } from '../components/FileConverter'
import { usePageMeta } from '../i18n/usePageMeta'

export function FilesPage() {
  usePageMeta('meta.files.title', 'meta.files.desc')
  return <FileConverter />
}
