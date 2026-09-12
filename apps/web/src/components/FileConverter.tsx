import { useState } from 'react'
import { convertFile, UnsupportedFormatError } from '../files'
import { track } from '../analytics/track'
import { useT } from '../i18n/useT'

type Status = 'idle' | 'busy' | 'done' | 'error'

export function FileConverter() {
  const { t } = useT()
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  const onConvert = async () => {
    if (!file) return
    setStatus('busy')
    setError('')
    try {
      const { blob, filename } = await convertFile(file)
      // Extension only — never the filename, which is the user's content.
      track('file_convert', file.name.toLowerCase().endsWith('.docx') ? 'docx' : 'txt')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      // Defer revoke: revoking synchronously right after a synthetic click is
      // fragile in some browsers (large files / older Safari).
      setTimeout(() => URL.revokeObjectURL(url), 0)
      setStatus('done')
    } catch (e) {
      setStatus('error')
      setError(e instanceof UnsupportedFormatError ? t('file.unsupported') : t('file.error'))
    }
  }

  return (
    <section id="files" className="mx-auto max-w-3xl px-6 py-24">
      <h2 className="font-serif text-3xl sm:text-5xl text-foreground">{t('file.title')}</h2>
      <p className="mt-3 text-sm text-muted">{t('file.instruction')}</p>

      <label className="mt-8 block cursor-pointer rounded-2xl border border-dashed border-black/20 p-8 text-center text-muted hover:border-black/40">
        <input
          data-testid="file-input"
          type="file"
          accept=".txt,.srt,.docx"
          className="sr-only"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null)
            setStatus('idle')
            setError('')
          }}
        />
        {file ? file.name : t('file.choose')}
      </label>

      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={onConvert}
          disabled={!file || status === 'busy'}
          className="rounded-full bg-foreground px-6 py-2.5 text-sm text-background transition-transform hover:scale-[1.03] disabled:opacity-40"
        >
          {status === 'busy' ? t('file.converting') : t('file.convert')}
        </button>
        {status === 'done' && <span className="text-sm text-muted">{t('file.done')}</span>}
        {status === 'error' && <span className="text-sm text-foreground">{error}</span>}
      </div>
    </section>
  )
}
