import type { Guide, GuideLetter } from '../types'
import type { Locale } from '../../seo/config'

const LETTERS: GuideLetter[] = [
  { upper: 'Ş', lower: 'ş', codePoint: 'U+015E / U+015F' },
  { upper: 'Ç', lower: 'ç', codePoint: 'U+00C7 / U+00E7' },
  { upper: 'Ö', lower: 'ö', codePoint: 'U+00D6 / U+00F6' },
  { upper: 'Ğ', lower: 'ğ', codePoint: 'U+011E / U+011F' },
]

const EXAMPLES: [string, string][] = [['shahar', 'şahar'], ['choy', 'çoy'], ['oʻzbek', 'özbek'], ['gʻalaba', 'ğalaba']]

// Keyboard facts: the Turkish Q layout puts ğ on [, ş on ;, ö on , and ç on . (macOS and Windows).
// macOS U.S. layout: Option+U then O → ö, Option+C → ç. Word: hex code then Alt+X.
export const keyboard: Record<Locale, Guide> = {
  en: {
    title: 'How to type Ş, Ç, Ö, Ğ',
    intro: 'Four ways to type the four new Uzbek letters on Mac, Windows, iPhone and Android — or let Alfavit type them for you.',
    letters: LETTERS,
    steps: [
      { heading: 'Copy the letters from this page', body: 'Tap a letter above to copy it, then paste it where you write. Handy for a name, a heading or a form field.' },
      { heading: 'Mac', body: 'On the U.S. layout, Option+U then O gives ö and Option+C gives ç. For ş and ğ add the Turkish Q input source (System Settings → Keyboard → Input Sources): ğ sits on the [ key, ş on ;, ö on , and ç on the . key. The Character Viewer (Control+Command+Space) also has all four.' },
      { heading: 'Windows', body: 'Add the Turkish Q keyboard (Settings → Time & Language → Language & region → Add a keyboard) and use the same keys: ğ on [, ş on ;, ö on , and ç on the . key. In Word, type 015f then Alt+X for ş and 011f then Alt+X for ğ. With a numeric keypad, Alt+0246 gives ö and Alt+0231 gives ç.' },
      { heading: 'iPhone and Android', body: 'Add the Turkish keyboard (iOS: Settings → General → Keyboard → Keyboards; Android: Gboard → Languages). Ş, ç, ö and ğ are on it directly, and long-pressing s, c, o and g shows them too. One catch: it also brings Turkish autocorrect and predictions, which will fight Uzbek words. Turn auto-correction off while you write Uzbek (iOS: Settings → General → Keyboard; Gboard: Settings → Text correction), or keep typing the old way and convert afterwards.' },
      { heading: 'Or let Alfavit type them', body: 'Keep typing the old way and convert: the Mac app converts as you type anywhere on your Mac; the web converter, Telegram bot and Chrome extension convert pasted or selected text.' },
    ],
    note: 'The official layout proposal places Ö, Ğ, Ş and Ç on punctuation keys that are unused in Uzbek. Until keyboards and operating systems ship it, the Turkish Q layout is the practical choice: it already has all four letters.',
    examples: EXAMPLES,
  },
  uz: {
    title: 'Ş, Ç, Ö, Ğ harflarini qanday yozish',
    intro: 'Yangi alifbodagi toʻrt harfni Mac, Windows, iPhone va Android klaviaturasida yozish yoʻllari — yoki Alfavit ularni siz uchun yozib bersin.',
    letters: LETTERS,
    steps: [
      { heading: 'Harflarni shu sahifadan nusxalang', body: 'Yuqoridagi harfga bosing — u nusxalanadi; keyin kerakli joyga qoʻying. Ism, sarlavha yoki forma maydoni uchun qulay.' },
      { heading: 'Mac', body: 'AQSh (U.S.) joylashuvida Option+U, keyin O — ö; Option+C — ç. ş va ğ uchun Turkish Q kiritish manbasini qoʻshing (System Settings → Keyboard → Input Sources): ğ — [ tugmasida, ş — ; tugmasida, ö — , tugmasida, ç — . tugmasida. Character Viewer (Control+Command+Space) da ham toʻrttala harf bor.' },
      { heading: 'Windows', body: 'Turkish Q klaviaturasini qoʻshing (Settings → Time & Language → Language & region → Add a keyboard) va shu tugmalardan foydalaning: ğ — [, ş — ;, ö — , va ç — . tugmasida. Word dasturida 015f yozib Alt+X bossangiz ş, 011f yozib Alt+X bossangiz ğ chiqadi. Raqamli klaviaturada Alt+0246 — ö, Alt+0231 — ç.' },
      { heading: 'iPhone va Android', body: 'Turk (Türkçe) klaviaturasini qoʻshing (iOS: Settings → General → Keyboard → Keyboards; Android: Gboard → Languages). Ş, ç, ö, ğ unda bevosita bor; s, c, o, g tugmalarini bosib turganda ham chiqadi. Bir jihati bor: u bilan turkcha avtomatik tuzatish va taxminlar ham yoqiladi — ular oʻzbek soʻzlarini buzadi. Oʻzbekcha yozayotganda avtomatik tuzatishni oʻchirib qoʻying (iOS: Settings → General → Keyboard; Gboard: Settings → Text correction) yoki odatdagidek yozib, keyin oʻgiring.' },
      { heading: 'Yoki Alfavit yozib bersin', body: 'Odatdagidek yozing va oʻgiring: Mac ilovasi yozayotganingizda kompyuterning istalgan joyida avtomatik oʻgiradi; veb oʻgirgich, Telegram bot va Chrome kengaytmasi joylangan yoki belgilangan matnni oʻgiradi.' },
    ],
    note: 'Rasmiy taklifga koʻra Ö, Ğ, Ş, Ç harflari oʻzbek tilida ishlatilmaydigan tinish belgisi tugmalariga joylashtiriladi. Klaviaturalar va operatsion tizimlar buni joriy qilgunga qadar amaliy yechim — Turkish Q joylashuvi: unda toʻrttala harf allaqachon bor.',
    examples: EXAMPLES,
  },
  ru: {
    title: 'Как набирать буквы Ş, Ç, Ö, Ğ',
    intro: 'Способы набрать четыре новые узбекские буквы на Mac, Windows, iPhone и Android — или пусть Alfavit сделает это за вас.',
    letters: LETTERS,
    steps: [
      { heading: 'Скопируйте буквы с этой страницы', body: 'Нажмите на букву выше — она скопируется; вставьте её там, где пишете. Удобно для имени, заголовка или поля формы.' },
      { heading: 'Mac', body: 'В раскладке U.S. Option+U, затем O даёт ö, Option+C — ç. Для ş и ğ добавьте источник ввода Turkish Q (System Settings → Keyboard → Input Sources): ğ на клавише [, ş на ;, ö на , и ç на клавише «.». В Character Viewer (Control+Command+Space) тоже есть все четыре.' },
      { heading: 'Windows', body: 'Добавьте клавиатуру Turkish Q (Settings → Time & Language → Language & region → Add a keyboard) и используйте те же клавиши: ğ на [, ş на ;, ö на , и ç на клавише «.». В Word наберите 015f и нажмите Alt+X для ş, 011f и Alt+X для ğ. На цифровой клавиатуре Alt+0246 даёт ö, Alt+0231 — ç.' },
      { heading: 'iPhone и Android', body: 'Добавьте турецкую клавиатуру (iOS: Settings → General → Keyboard → Keyboards; Android: Gboard → Languages). Ş, ç, ö и ğ есть на ней напрямую, а долгое нажатие на s, c, o и g тоже показывает их. Одна оговорка: вместе с ней включаются турецкие автозамена и подсказки — они будут портить узбекские слова. Отключите автозамену, пока пишете по-узбекски (iOS: Settings → General → Keyboard; Gboard: Settings → Text correction), или пишите как раньше и конвертируйте потом.' },
      { heading: 'Или пусть их наберёт Alfavit', body: 'Пишите как раньше и конвертируйте: приложение для Mac преобразует текст по мере ввода в любой программе; веб-конвертер, Telegram-бот и расширение Chrome конвертируют вставленный или выделенный текст.' },
    ],
    note: 'Официальное предложение размещает Ö, Ğ, Ş и Ç на клавишах знаков препинания, не используемых в узбекском. Пока клавиатуры и операционные системы его не поддерживают, практичный выбор — раскладка Turkish Q: в ней уже есть все четыре буквы.',
    examples: EXAMPLES,
  },
}
