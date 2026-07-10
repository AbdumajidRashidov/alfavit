const APOSTROPHE_VARIANTS = /[''‘’'ʼʹ`´]/g

export function normalizeApostrophes(text: string): string {
  return text.replace(APOSTROPHE_VARIANTS, 'ʻ')
}
