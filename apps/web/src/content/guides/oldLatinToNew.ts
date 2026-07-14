import type { Guide } from '../types'

export const oldLatinToNew: Record<'uz' | 'ru', Guide> = {
  uz: {
    title: 'Eski (1995) lotindan yangi lotinga',
    intro: '1995-yilgi lotin yozuvidagi qoʻsh harflar va apostrofli harflarni 2026-yilgi yangi lotinga oʻgiring.',
    steps: [
      { heading: 'Eski lotin matnini nusxalang', body: 'sh, ch, gʻ, oʻ kabi shakllar ishlatilgan matningizni nusxalang.' },
      { heading: 'Oʻgirgichni oching', body: 'Alfavit bosh sahifasidagi oʻgirgichga oʻting.' },
      { heading: 'Matnni joylang', body: 'Matnni joylang — qoʻsh harflar va apostrofli harflar bitta harfga oʻgiriladi.' },
      { heading: 'Natijani oling', body: 'ş, ç, ğ, ŏ harfli natijani nusxalab oling.' },
    ],
    examples: [['oʻzbek', 'ŏzbek'], ['gʻalaba', 'ğalaba'], ['shahar', 'şahar'], ['choy', 'çoy']],
  },
  ru: {
    title: 'Со старой латиницы (1995) на новую',
    intro: 'Преобразуйте диграфы и буквы с апострофом образца 1995 года в новую латиницу 2026 года.',
    steps: [
      { heading: 'Скопируйте старый текст', body: 'Скопируйте текст с формами sh, ch, gʻ, oʻ.' },
      { heading: 'Откройте конвертер', body: 'Перейдите к конвертеру на главной странице Alfavit.' },
      { heading: 'Вставьте текст', body: 'Вставьте текст — диграфы и буквы с апострофом станут одиночными буквами.' },
      { heading: 'Заберите результат', body: 'Скопируйте результат с буквами ş, ç, ğ, ŏ.' },
    ],
    examples: [['oʻzbek', 'ŏzbek'], ['gʻalaba', 'ğalaba'], ['shahar', 'şahar'], ['choy', 'çoy']],
  },
}
