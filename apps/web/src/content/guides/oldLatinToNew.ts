import type { Guide } from '../types'
import type { Locale } from '../../seo/config'

export const oldLatinToNew: Record<Locale, Guide> = {
  en: {
    title: 'Convert old Latin to the new Uzbek alphabet',
    intro: 'Convert 1995 old-Latin digraphs and apostrophe-letters to the reformed 2026 new Latin.',
    steps: [
      { heading: 'Copy the old-Latin text', body: 'Copy text that uses forms like sh, ch, gʻ, oʻ.' },
      { heading: 'Use the converter above', body: 'It is at the top of this page; there is nowhere else to go.' },
      { heading: 'Paste the text', body: 'Paste it — digraphs and apostrophe-letters become single letters.' },
      { heading: 'Take the result', body: 'Copy the result with ş, ç, ğ, ö.' },
    ],
    examples: [['oʻzbek', 'özbek'], ['gʻalaba', 'ğalaba'], ['shahar', 'şahar'], ['choy', 'çoy']],
  },
  uz: {
    // UNVERIFIED (drafted 2026-10-22): needs the owner's native-speaker check.
    title: 'Eski lotindan yangi alifboga oʻgirish',
    intro: '1995-yilgi lotin yozuvidagi qoʻsh harflar va apostrofli harflarni 2026-yilgi yangi lotinga oʻgiring.',
    steps: [
      { heading: 'Eski lotin matnini nusxalang', body: 'sh, ch, gʻ, oʻ kabi shakllar ishlatilgan matningizni nusxalang.' },
      // UNVERIFIED (drafted 2026-10-22): needs the owner's native-speaker check.
      { heading: 'Yuqoridagi oʻgirgichdan foydalaning', body: 'Oʻgirgich shu sahifaning yuqorisida — boshqa joyga oʻtish shart emas.' },
      { heading: 'Matnni joylang', body: 'Matnni joylang — qoʻsh harflar va apostrofli harflar bitta harfga oʻgiriladi.' },
      { heading: 'Natijani oling', body: 'ş, ç, ğ, ö harfli natijani nusxalab oling.' },
    ],
    examples: [['oʻzbek', 'özbek'], ['gʻalaba', 'ğalaba'], ['shahar', 'şahar'], ['choy', 'çoy']],
  },
  ru: {
    // UNVERIFIED (drafted 2026-10-22): needs the owner's native-speaker check.
    title: 'Со старой латиницы на новый узбекский алфавит',
    intro: 'Преобразуйте диграфы и буквы с апострофом образца 1995 года в новую латиницу 2026 года.',
    steps: [
      { heading: 'Скопируйте старый текст', body: 'Скопируйте текст с формами sh, ch, gʻ, oʻ.' },
      // UNVERIFIED (drafted 2026-10-22): needs the owner's native-speaker check.
      { heading: 'Используйте конвертер выше', body: 'Он в начале этой страницы — никуда переходить не нужно.' },
      { heading: 'Вставьте текст', body: 'Вставьте текст — диграфы и буквы с апострофом станут одиночными буквами.' },
      { heading: 'Заберите результат', body: 'Скопируйте результат с буквами ş, ç, ğ, ö.' },
    ],
    examples: [['oʻzbek', 'özbek'], ['gʻalaba', 'ğalaba'], ['shahar', 'şahar'], ['choy', 'çoy']],
  },
}
