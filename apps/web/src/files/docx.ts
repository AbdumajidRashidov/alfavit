import { transliterateDocxXml } from './convert'

const XML_PART = /^word\/(document|header\d*|footer\d*)\.xml$/

export async function convertDocx(bytes: Uint8Array): Promise<ArrayBuffer> {
  const { default: JSZip } = await import('jszip')
  const zip = await JSZip.loadAsync(bytes)
  const parts = Object.keys(zip.files).filter((p) => XML_PART.test(p))
  for (const path of parts) {
    const xml = await zip.file(path)!.async('string')
    zip.file(path, transliterateDocxXml(xml))
  }
  return zip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' })
}
