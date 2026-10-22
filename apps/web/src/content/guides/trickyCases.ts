import type { Locale } from '../../seo/config'

// /guide/tricky-cases — what a letter-by-letter swap gets wrong, and what
// Alfavit outputs instead (spec B3). Only cases the released engine gets right
// appear here; each is framed as what Alfavit does, never as an official rule,
// because the Cabinet's spelling rules are not published yet. The page renders
// the engine's own output; TRICKY_EXPECTED pins it so a change fails a test
// before it reaches the page. Shakespeare-type names stay off (E3 deferred).

export const TRICKY_GROUPS: { id: string; inputs: string[] }[] = [
  { id: 's-h', inputs: ['Ishoq', "Is'hoq", 'Mushafni'] },
  { id: 'apostrophes', inputs: ["o'zbek", 'o’zbek', 'o‘zbek', 'o`zbek', "g'oya"] },
  { id: 'tutuq', inputs: ['маъно', 'санъат', "ma'no"] },
  { id: 'ng', inputs: ['ming', 'tong', 'dengiz'] },
  { id: 'capitals', inputs: ['SHAHAR', 'Shahar', 'O‘ZBEKISTON', 'CHOY'] },
  { id: 'mixed', inputs: ['Тошкент va Samarqand'] },
  { id: 'cyrillic-e', inputs: ['ер', 'телефон', 'поезд', 'Европа'] },
  { id: 'cyrillic-ts', inputs: ['цирк', 'милиция'] },
  { id: 'addresses', inputs: ['www.shahar.uz', 'info@choy.uz', '@shahar_news'] },
  { id: 'foreign', inputs: ['Washington', 'Facebook’da'] },
]

/** Engine 0.2.0 output for every input above, verified 22 Oct 2026. */
export const TRICKY_EXPECTED: Record<string, string> = {
  Ishoq: 'Ishoq',
  "Is'hoq": 'Ishoq',
  Mushafni: 'Mushafni',
  "o'zbek": 'özbek',
  'o’zbek': 'özbek',
  'o‘zbek': 'özbek',
  'o`zbek': 'özbek',
  "g'oya": 'ğoya',
  маъно: 'maʼno',
  санъат: 'sanʼat',
  "ma'no": 'maʼno',
  ming: 'ming',
  tong: 'tong',
  dengiz: 'dengiz',
  SHAHAR: 'ŞAHAR',
  Shahar: 'Şahar',
  'O‘ZBEKISTON': 'ÖZBEKISTON',
  CHOY: 'ÇOY',
  'Тошкент va Samarqand': 'Toşkent va Samarqand',
  ер: 'yer',
  телефон: 'telefon',
  поезд: 'poyezd',
  Европа: 'Yevropa',
  цирк: 'sirk',
  милиция: 'milisiya',
  'www.shahar.uz': 'www.shahar.uz',
  'info@choy.uz': 'info@choy.uz',
  '@shahar_news': '@shahar_news',
  Washington: 'Washington',
  'Facebook’da': 'Facebookʼda',
}

export interface TrickyCopy {
  title: string
  intro: string
  inputLabel: string
  outputLabel: string
  groups: Record<string, { heading: string; note: string }>
}

export const trickyCases: Record<Locale, TrickyCopy> = {
  en: {
    title: 'Tricky cases when converting to the new Uzbek alphabet',
    intro: 'Swapping sh for ş letter by letter goes wrong in more places than you would think. These are the cases Alfavit handles, each shown with what the converter outputs today.',
    inputLabel: 'You type',
    outputLabel: 'Alfavit gives',
    groups: {
      's-h': { heading: 'When sh is s + h', note: 'In Ishoq, mushaf and a few other listed words, s and h are two sounds. Alfavit keeps them apart, with or without the apostrophe, and with any ending.' },
      apostrophes: { heading: 'Every kind of apostrophe', note: 'People type oʻ and gʻ with a straight quote, a curly quote, a backtick or the proper sign. Alfavit reads them all.' },
      tutuq: { heading: 'The tutuq belgisi', note: 'The glottal-stop sign — Cyrillic ъ, or an apostrophe in the old Latin — becomes the new alphabet’s single sign ʼ.' },
      ng: { heading: 'ng stays ng', note: 'ng no longer counts as a separate letter, but it is still written n + g.' },
      capitals: { heading: 'Capitals', note: 'A capital stays a capital: both SH and Sh become Ş.' },
      mixed: { heading: 'Cyrillic and Latin in one text', note: 'Alfavit converts each part from its own script, so pasted text that mixes both comes out right.' },
      'cyrillic-e': { heading: 'Cyrillic е: ye or e', note: 'Alfavit writes е as ye at the start of a word and after a vowel, and as e after a consonant.' },
      'cyrillic-ts': { heading: 'Cyrillic ц', note: 'ц becomes s, as in sirk and milisiya; the API marks c as the alternative for loanwords.' },
      addresses: { heading: 'Web addresses, emails and @handles', note: 'They are left exactly as typed, so links keep working.' },
      foreign: { heading: 'Foreign words', note: 'Words Uzbek Latin cannot spell, such as Washington, are left as written; an Uzbek ending after them still converts.' },
    },
  },
  // UNVERIFIED (drafted 2026-10-22): needs the owner's native-speaker check.
  uz: {
    title: 'Yangi alifboga oʻgirish: qiyin holatlar',
    intro: 'sh ni harfma-harf ş ga almashtirish koʻp joyda xato beradi. Quyida Alfavit hal qiladigan holatlar va oʻgirgich bugun beradigan natija koʻrsatilgan.',
    inputLabel: 'Siz yozasiz',
    outputLabel: 'Alfavit beradi',
    groups: {
      's-h': { heading: 'sh — s va h boʻlganda', note: 'Ishoq, mushaf kabi roʻyxatdagi soʻzlarda s va h alohida tovush. Alfavit ularni apostrof bilan ham, apostrofsiz ham va har qanday qoʻshimcha bilan alohida saqlaydi.' },
      apostrophes: { heading: 'Har xil apostroflar', note: 'oʻ va gʻ ni oddiy tirnoq, egri tirnoq, orqa tirnoq yoki toʻgʻri belgi bilan yozishadi. Alfavit hammasini taniydi.' },
      tutuq: { heading: 'Tutuq belgisi', note: 'Kirilldagi ъ yoki eski lotindagi apostrof yangi alifbodagi yagona ʼ belgisiga aylanadi.' },
      ng: { heading: 'ng oʻzgarmaydi', note: 'ng endi alohida harf hisoblanmaydi, lekin n + g boʻlib yozilaveradi.' },
      capitals: { heading: 'Bosh harflar', note: 'Bosh harf bosh harfligicha qoladi: SH ham, Sh ham Ş boʻladi.' },
      mixed: { heading: 'Bir matnda kirill va lotin', note: 'Alfavit har bir qismni oʻz yozuvidan oʻgiradi, shuning uchun aralash matn ham toʻgʻri chiqadi.' },
      'cyrillic-e': { heading: 'Kirilldagi е: ye yoki e', note: 'Alfavit е ni soʻz boshida va unlidan keyin ye, undoshdan keyin e deb yozadi.' },
      'cyrillic-ts': { heading: 'Kirilldagi ц', note: 'ц s boʻladi (sirk, milisiya); API oʻzlashma soʻzlar uchun c ni muqobil sifatida belgilaydi.' },
      addresses: { heading: 'Veb-manzillar, e-pochta va @nomlar', note: 'Ular yozilganidek qoladi, havolalar ishlayveradi.' },
      foreign: { heading: 'Xorijiy soʻzlar', note: 'Washington kabi oʻzbek lotinida yozib boʻlmaydigan soʻzlar oʻz holicha qoladi; ulardan keyingi oʻzbekcha qoʻshimcha esa oʻgiriladi.' },
    },
  },
  // UNVERIFIED (drafted 2026-10-22): needs the owner's check.
  ru: {
    title: 'Сложные случаи перевода на новый узбекский алфавит',
    intro: 'Побуквенная замена sh на ş ошибается чаще, чем кажется. Ниже — случаи, с которыми справляется Alfavit, и что конвертер выдаёт сегодня.',
    inputLabel: 'Вы пишете',
    outputLabel: 'Alfavit выдаёт',
    groups: {
      's-h': { heading: 'Когда sh — это s + h', note: 'В словах из списка вроде Ishoq и mushaf s и h — два звука. Alfavit сохраняет их раздельно — с апострофом и без, с любым окончанием.' },
      apostrophes: { heading: 'Любые апострофы', note: 'oʻ и gʻ пишут прямой кавычкой, «кудрявой», обратной или правильным знаком. Alfavit понимает все.' },
      tutuq: { heading: 'Знак тутук', note: 'Кириллический ъ или апостроф в старой латинице становится единым знаком нового алфавита ʼ.' },
      ng: { heading: 'ng остаётся ng', note: 'ng больше не считается отдельной буквой, но по-прежнему пишется n + g.' },
      capitals: { heading: 'Заглавные буквы', note: 'Заглавная остаётся заглавной: и SH, и Sh становятся Ş.' },
      mixed: { heading: 'Кириллица и латиница в одном тексте', note: 'Alfavit переводит каждую часть с её собственного письма, поэтому смешанный текст тоже выходит правильно.' },
      'cyrillic-e': { heading: 'Кириллическая е: ye или e', note: 'Alfavit пишет е как ye в начале слова и после гласной и как e после согласной.' },
      'cyrillic-ts': { heading: 'Кириллическая ц', note: 'ц становится s (sirk, milisiya); API отмечает c как вариант для заимствований.' },
      addresses: { heading: 'Веб-адреса, e-mail и @имена', note: 'Остаются как написаны, ссылки продолжают работать.' },
      foreign: { heading: 'Иностранные слова', note: 'Слова, которые узбекская латиница не пишет, вроде Washington, остаются как есть; узбекское окончание после них конвертируется.' },
    },
  },
}
