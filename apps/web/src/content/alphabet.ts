import type { Locale } from '../seo/config'

export interface AlphabetLetter {
  id: string
  latin: string
  old: string
  cyrillic: string
  example: string
  exampleOld?: string
  changed?: boolean
}

// Order confirmed by the user (native speaker). Letter/old/cyrillic values are
// grounded against @alfavit/engine's CYRILLIC_MAP (see alphabet.test.ts).
export const LETTERS: AlphabetLetter[] = [
  { id: 'A', latin: 'A a', old: 'A a', cyrillic: 'А а', example: 'ata' },
  { id: 'B', latin: 'B b', old: 'B b', cyrillic: 'Б б', example: 'bola' },
  { id: 'D', latin: 'D d', old: 'D d', cyrillic: 'Д д', example: 'daraxt' },
  { id: 'E', latin: 'E e', old: 'E e', cyrillic: 'Э э', example: 'ertak' },
  { id: 'F', latin: 'F f', old: 'F f', cyrillic: 'Ф ф', example: 'fikr' },
  { id: 'G', latin: 'G g', old: 'G g', cyrillic: 'Г г', example: 'gul' },
  { id: 'H', latin: 'H h', old: 'H h', cyrillic: 'Ҳ ҳ', example: 'hosil' },
  { id: 'I', latin: 'I i', old: 'I i', cyrillic: 'И и', example: 'ikki' },
  { id: 'J', latin: 'J j', old: 'J j', cyrillic: 'Ж ж', example: 'jahon' },
  { id: 'K', latin: 'K k', old: 'K k', cyrillic: 'К к', example: 'kitob' },
  { id: 'L', latin: 'L l', old: 'L l', cyrillic: 'Л л', example: 'laylak' },
  { id: 'M', latin: 'M m', old: 'M m', cyrillic: 'М м', example: 'maktab' },
  { id: 'N', latin: 'N n', old: 'N n', cyrillic: 'Н н', example: 'non' },
  { id: 'O', latin: 'O o', old: 'O o', cyrillic: 'О о', example: 'olma' },
  { id: 'P', latin: 'P p', old: 'P p', cyrillic: 'П п', example: 'palov' },
  { id: 'Q', latin: 'Q q', old: 'Q q', cyrillic: 'Қ қ', example: 'qalam' },
  { id: 'R', latin: 'R r', old: 'R r', cyrillic: 'Р р', example: 'rang' },
  { id: 'S', latin: 'S s', old: 'S s', cyrillic: 'С с', example: 'salom' },
  { id: 'T', latin: 'T t', old: 'T t', cyrillic: 'Т т', example: 'tuz' },
  { id: 'U', latin: 'U u', old: 'U u', cyrillic: 'У у', example: 'uy' },
  { id: 'V', latin: 'V v', old: 'V v', cyrillic: 'В в', example: 'vaqt' },
  { id: 'X', latin: 'X x', old: 'X x', cyrillic: 'Х х', example: 'xona' },
  { id: 'Y', latin: 'Y y', old: 'Y y', cyrillic: 'Й й', example: 'yil' },
  { id: 'Z', latin: 'Z z', old: 'Z z', cyrillic: 'З з', example: 'zar' },
  { id: 'Ö', latin: 'Ö ö', old: 'Oʻ oʻ', cyrillic: 'Ў ў', example: 'köl', exampleOld: 'koʻl', changed: true },
  { id: 'Ğ', latin: 'Ğ ğ', old: 'Gʻ gʻ', cyrillic: 'Ғ ғ', example: 'ğalaba', exampleOld: 'gʻalaba', changed: true },
  { id: 'Ş', latin: 'Ş ş', old: 'Sh sh', cyrillic: 'Ш ш', example: 'şahar', exampleOld: 'shahar', changed: true },
  { id: 'Ç', latin: 'Ç ç', old: 'Ch ch', cyrillic: 'Ч ч', example: 'çoy', exampleOld: 'choy', changed: true },
]

// Per-letter pronunciation hint, keyed by id. Drafts — user-verified before merge.
export const SOUNDS: Record<Locale, Record<string, string>> = {
  en: {
    A: 'like a in "car"', B: 'like b in "bat"', D: 'like d in "dog"', E: 'like e in "bed"',
    F: 'like f in "fan"', G: 'like g in "go"', H: 'like h in "hat"', I: 'like i in "sit"',
    J: 'like s in "measure"', K: 'like k in "kite"', L: 'like l in "lamp"', M: 'like m in "man"',
    N: 'like n in "net"', O: 'like o in "more"', P: 'like p in "pen"', Q: 'a deep, uvular k',
    R: 'a rolled r', S: 'like s in "sun"', T: 'like t in "top"', U: 'like u in "put"',
    V: 'like v in "van"', X: 'like ch in "Bach" (kh)', Y: 'like y in "yes"', Z: 'like z in "zoo"',
    Ö: 'like ö in Turkish "göl"', Ğ: 'a soft, throaty g (Turkish ğ)', Ş: 'like sh in "ship"', Ç: 'like ch in "chair"',
  },
  uz: {
    A: 'ochiq «a»', B: '«b» tovushi', D: '«d» tovushi', E: 'ochiq «e»',
    F: '«f» tovushi', G: '«g» tovushi', H: 'yumshoq «h»', I: '«i» tovushi',
    J: 'jarangli «j» (ж)', K: '«k» tovushi', L: '«l» tovushi', M: '«m» tovushi',
    N: '«n» tovushi', O: 'lablangan «o»', P: '«p» tovushi', Q: 'chuqur «k» (til orqa)',
    R: 'titroq «r»', S: '«s» tovushi', T: '«t» tovushi', U: '«u» tovushi',
    V: '«v» tovushi', X: 'boʻgʻiz «x»', Y: '«y» tovushi', Z: '«z» tovushi',
    Ö: 'lablangan «oʻ»', Ğ: 'jarangli «gʻ»', Ş: 'jarangsiz «sh»', Ç: '«ch» tovushi',
  },
  ru: {
    A: 'как «а»', B: 'как «б»', D: 'как «д»', E: 'как «э/е»',
    F: 'как «ф»', G: 'как «г»', H: 'мягкое «h»', I: 'как «и»',
    J: 'как «ж»', K: 'как «к»', L: 'как «л»', M: 'как «м»',
    N: 'как «н»', O: 'как «о»', P: 'как «п»', Q: 'глубокое «к»',
    R: 'раскатистое «р»', S: 'как «с»', T: 'как «т»', U: 'как «у»',
    V: 'как «в»', X: 'как «х»', Y: 'как «й»', Z: 'как «з»',
    Ö: 'как турецкое «ö»', Ğ: 'мягкое горловое «г»', Ş: 'как «ш»', Ç: 'как «ч»',
  },
}
