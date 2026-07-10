// Reform letters GROUNDED against the 2026-07-07 law (ş ç ğ ŏ, loanword c).
// Cyrillic transliteration of е/ц (and ъ/ь) follows Cabinet orthography rules;
// ambiguous letters е and ц are intentionally omitted here — see Task 7.
export const CYRILLIC_MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'j', з: 'z', и: 'i',
  й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ш: 'ş', ч: 'ç',
  ё: 'yo', ю: 'yu', я: 'ya', э: 'e',
  ў: 'ŏ', ғ: 'ğ', қ: 'q', ҳ: 'h',
  ъ: 'ʼ', ь: '',
}
