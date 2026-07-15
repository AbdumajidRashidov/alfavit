import type { Guide } from '../types'
import type { Locale } from '../../seo/config'

export const cyrillicToLatin: Record<Locale, Guide> = {
  en: {
    title: 'Convert Cyrillic to the new Latin',
    intro: 'Convert Uzbek text from Cyrillic to the reformed 2026 new Latin in seconds — free and on your device.',
    steps: [
      { heading: 'Copy your text', body: 'Select and copy your Cyrillic text.' },
      { heading: 'Open the converter', body: 'Go to the converter on the Alfavit home page.' },
      { heading: 'Paste the text', body: 'Paste it into the input field — Alfavit detects the script and converts it to the new Latin.' },
      { heading: 'Take the result', body: 'Copy the new-Latin result and paste it wherever you need.' },
    ],
    examples: [['Салом дунё', 'Salom dunyo'], ['Ўзбекча матн', 'Özbekça matn'], ['шаҳар, чой', 'şahar, çoy']],
  },
  uz: {
    title: 'Kirill alifbosidan yangi lotinga oʻgirish',
    intro: 'Kirilldagi oʻzbek matnini 2026-yilgi yangi lotin yozuviga bir necha soniyada oʻgiring — bepul va qurilmangizda.',
    steps: [
      { heading: 'Matnni nusxalang', body: 'Kirilldagi matningizni belgilab, nusxalab oling.' },
      { heading: 'Oʻgirgichni oching', body: 'Alfavit bosh sahifasidagi oʻgirgichga oʻting.' },
      { heading: 'Matnni joylang', body: 'Matnni kiritish maydoniga joylang — Alfavit yozuvni avtomatik aniqlab, yangi lotinga oʻgiradi.' },
      { heading: 'Natijani oling', body: 'Yangi lotindagi natijani nusxalab, kerakli joyga qoʻying.' },
    ],
    examples: [['Салом дунё', 'Salom dunyo'], ['Ўзбекча матн', 'Özbekça matn'], ['шаҳар, чой', 'şahar, çoy']],
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
    examples: [['Салом дунё', 'Salom dunyo'], ['Ўзбекча матн', 'Özbekça matn'], ['шаҳар, чой', 'şahar, çoy']],
  },
}
