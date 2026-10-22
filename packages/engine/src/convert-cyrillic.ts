import { applyCase, inCapsWord } from './case.js'
import { CYRILLIC_MAP } from './mappings/cyrillic.js'
import type { AmbiguityFlag } from './types.js'

const CYRILLIC_VOWELS = new Set([...'аеёиоуўэюяАЕЁИОУЎЭЮЯ'])
// ў, қ, ғ and ҳ sit outside а-я; without them е after ҳ read as word-initial (ҳеч → hyeç).
const CYRILLIC_LETTER = /[а-яёўқғҳА-ЯЁЎҚҒҲ]/
const SIGNS = new Set([...'ъьЪЬ'])

export function convertCyrillicRun(
  text: string,
  offset: number,
): { output: string; flags: AmbiguityFlag[] } {
  const flags: AmbiguityFlag[] = []
  let output = ''
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const lower = ch.toLowerCase()
    const prev = i > 0 ? text[i - 1] : ''
    const wordInitial = i === 0 || (!CYRILLIC_VOWELS.has(prev) && !CYRILLIC_LETTER.test(prev))

    if (lower === 'е') {
      const afterVowelOrSign = CYRILLIC_VOWELS.has(prev) || SIGNS.has(prev)
      const useYe = wordInitial || afterVowelOrSign
      const chosen = useYe ? 'ye' : 'e'
      output += applyCase(chosen, ch, inCapsWord(text, i))
      flags.push({
        start: offset + i, end: offset + i + 1,
        chosen, alternatives: [useYe ? 'e' : 'ye'], reason: 'cyrillic-e-position',
      })
      continue
    }

    if (lower === 'ц') {
      const chosen = 's'
      output += applyCase(chosen, ch)
      flags.push({
        start: offset + i, end: offset + i + 1,
        chosen, alternatives: ['c'], reason: 'cyrillic-ts',
      })
      continue
    }

    const mapped = CYRILLIC_MAP[lower]
    output += mapped !== undefined ? applyCase(mapped, ch, inCapsWord(text, i)) : ch
  }
  return { output, flags }
}
