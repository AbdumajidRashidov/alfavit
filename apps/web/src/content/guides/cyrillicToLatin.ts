import type { Guide } from '../types'

export const cyrillicToLatin: Record<'uz' | 'ru', Guide> = {
  uz: {
    title: 'Kirill alifbosidan yangi lotinga oʻgirish',
    intro: 'Kirilldagi oʻzbek matnini 2026-yilgi yangi lotin yozuviga bir necha soniyada oʻgiring — bepul va qurilmangizda.',
    steps: [
      { heading: 'Matnni nusxalang', body: 'Kirilldagi matningizni belgilab, nusxalab oling.' },
      { heading: 'Oʻgirgichni oching', body: 'Alfavit bosh sahifasidagi oʻgirgichga oʻting.' },
      { heading: 'Matnni joylang', body: 'Matnni kiritish maydoniga joylang — Alfavit yozuvni avtomatik aniqlab, yangi lotinga oʻgiradi.' },
      { heading: 'Natijani oling', body: 'Yangi lotindagi natijani nusxalab, kerakli joyga qoʻying.' },
    ],
    examples: [['Салом дунё', 'Salom dunyo'], ['Ўзбекча матн', 'Ŏzbekça matn'], ['шаҳар, чой', 'şahar, çoy']],
  },
  ru: {
    title: 'Конвертация с кириллицы в новую латиницу',
    intro: 'Преобразуйте узбекский текст с кириллицы в новую латиницу 2026 года за несколько секунд — бесплатно и на вашем устройстве.',
    steps: [
      { heading: 'Скопируйте текст', body: 'Выделите и скопируйте текст на кириллице.' },
      { heading: 'Откройте конвертер', body: 'Перейдите к конвертеру на главной странице Alfavit.' },
      { heading: 'Вставьте текст', body: 'Вставьте текст в поле ввода — Alfavit определит письмо и преобразует его в новую латиницу.' },
      { heading: 'Заберите результат', body: 'Скопируйте результат в новой латинице и вставьте, куда нужно.' },
    ],
    examples: [['Салом дунё', 'Salom dunyo'], ['Ўзбекча матн', 'Ŏzbekça matn'], ['шаҳар, чой', 'şahar, çoy']],
  },
}
