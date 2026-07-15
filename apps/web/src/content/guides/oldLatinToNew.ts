import type { Guide } from '../types'
import type { Locale } from '../../seo/config'

export const oldLatinToNew: Record<Locale, Guide> = {
  en: {
    title: 'Old Latin (1995) to the new Latin',
    intro: 'Convert 1995 old-Latin digraphs and apostrophe-letters to the reformed 2026 new Latin.',
    steps: [
      { heading: 'Copy the old-Latin text', body: 'Copy text that uses forms like sh, ch, gʻ, oʻ.' },
      { heading: 'Open the converter', body: 'Go to the converter on the Alfavit home page.' },
      { heading: 'Paste the text', body: 'Paste it — digraphs and apostrophe-letters become single letters.' },
      { heading: 'Take the result', body: 'Copy the result with ş, ç, ğ, ö.' },
    ],
    examples: [['oʻzbek', 'özbek'], ['gʻalaba', 'ğalaba'], ['shahar', 'şahar'], ['choy', 'çoy']],
  },
  uz: {
    title: 'Eski (1995) lotindan yangi lotinga',
    intro: '1995-yilgi lotin yozuvidagi qoʻsh harflar va apostrofli harflarni 2026-yilgi yangi lotinga oʻgiring.',
    steps: [
      { heading: 'Eski lotin matnini nusxalang', body: 'sh, ch, gʻ, oʻ kabi shakllar ishlatilgan matningizni nusxalang.' },
      { heading: 'Oʻgirgichni oching', body: 'Alfavit bosh sahifasidagi oʻgirgichga oʻting.' },
      { heading: 'Matnni joylang', body: 'Matnni joylang — qoʻsh harflar va apostrofli harflar bitta harfga oʻgiriladi.' },
      { heading: 'Natijani oling', body: 'ş, ç, ğ, ö harfli natijani nusxalab oling.' },
    ],
    examples: [['oʻzbek', 'özbek'], ['gʻalaba', 'ğalaba'], ['shahar', 'şahar'], ['choy', 'çoy']],
  },
  ru: {
    title: 'Со старой латиницы (1995) на новую',
    intro: 'Преобразуйте диграфы и буквы с апострофом образца 1995 года в новую латиницу 2026 года.',
    steps: [
      { heading: 'Скопируйте старый текст', body: 'Скопируйте текст с формами sh, ch, gʻ, oʻ.' },
      { heading: 'Откройте конвертер', body: 'Перейдите к конвертеру на главной странице Alfavit.' },
      { heading: 'Вставьте текст', body: 'Вставьте текст — диграфы и буквы с апострофом станут одиночными буквами.' },
      { heading: 'Заберите результат', body: 'Скопируйте результат с буквами ş, ç, ğ, ö.' },
    ],
    examples: [['oʻzbek', 'özbek'], ['gʻalaba', 'ğalaba'], ['shahar', 'şahar'], ['choy', 'çoy']],
  },
}
