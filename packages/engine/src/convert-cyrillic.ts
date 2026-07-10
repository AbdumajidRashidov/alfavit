import { applyCase } from './case'
import { CYRILLIC_MAP } from './mappings/cyrillic'
import type { AmbiguityFlag } from './types'

export function convertCyrillicRun(
  text: string,
  offset: number,
): { output: string; flags: AmbiguityFlag[] } {
  const flags: AmbiguityFlag[] = []
  let output = ''
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const lower = ch.toLowerCase()
    const mapped = CYRILLIC_MAP[lower]
    if (mapped !== undefined) {
      output += applyCase(mapped, ch)
    } else {
      output += ch // unknown char passes through
    }
  }
  return { output, flags }
}
