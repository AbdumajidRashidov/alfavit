import { useEffect, useState } from 'react'
import { transliterate, detectScript, type SourceScript } from '@alfavit/engine'

export function useTransliterate(
  input: string,
  delayMs = 120,
): { text: string; detectedScript: SourceScript } {
  const [text, setText] = useState(() => transliterate(input).text)
  const detectedScript = detectScript(input)

  useEffect(() => {
    const id = setTimeout(() => setText(transliterate(input).text), delayMs)
    return () => clearTimeout(id)
  }, [input, delayMs])

  return { text, detectedScript }
}
