import { transliterate } from '@alfavit/engine'

export function toNewLatin(text: string): string {
  return transliterate(text).text
}
