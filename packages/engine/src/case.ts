/** Casing for a converted letter. A multi-letter output (ё → yo) is title-cased
 * after a capital, unless the capital sits in an all-caps word (ЁШЛАР → YOŞLAR). */
export function applyCase(template: string, sourceFirstChar: string, allCaps = false): string {
  const isUpper = sourceFirstChar !== sourceFirstChar.toLowerCase()
  if (!isUpper) return template
  return template.length > 1 && !allCaps
    ? template[0].toUpperCase() + template.slice(1)
    : template.toUpperCase()
}

const isLetter = (c: string) => c.toLowerCase() !== c.toUpperCase()
const isCapital = (c: string) => isLetter(c) && c === c.toUpperCase()

/** Whether the letter at `i` is part of an all-caps word: judged by the next
 * letter, or by the previous one at the end of a word. A lone capital is not. */
export function inCapsWord(text: string, i: number): boolean {
  const next = text[i + 1] ?? ''
  if (isLetter(next)) return isCapital(next)
  return isCapital(text[i - 1] ?? '')
}

/** A word of two or more letters, all of them capitals. */
export function isAllCaps(word: string): boolean {
  const letters = [...word].filter(isLetter)
  return letters.length > 1 && letters.every(isCapital)
}
