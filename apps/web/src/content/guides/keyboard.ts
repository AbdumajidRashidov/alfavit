import type { Guide, GuideLetter } from '../types'
import type { Locale } from '../../seo/config'

// Same order as everywhere the reform is reported: Ö, Ğ, Ş, Ç.
const LETTERS: GuideLetter[] = [
  { upper: 'Ö', lower: 'ö', codePoint: 'U+00D6 / U+00F6' },
  { upper: 'Ğ', lower: 'ğ', codePoint: 'U+011E / U+011F' },
  { upper: 'Ş', lower: 'ş', codePoint: 'U+015E / U+015F' },
  { upper: 'Ç', lower: 'ç', codePoint: 'U+00C7 / U+00E7' },
]

const EXAMPLES: [string, string][] = [['oʻzbek', 'özbek'], ['gʻalaba', 'ğalaba'], ['shahar', 'şahar'], ['choy', 'çoy']]

// Keyboard facts: the Turkish Q layout puts ğ on [, ş on ;, ö on , and ç on . (macOS and Windows).
// macOS U.S. layout: Option+U then O → ö, Option+C → ç. Word: hex code then Alt+X.
export const keyboard: Record<Locale, Guide> = {
  en: {
    title: 'How to type Ö, Ğ, Ş, Ç on a keyboard and phone',
    intro: 'Four ways to type the four new Uzbek letters on Android, iPhone, Windows and Mac — or let Alfavit type them for you.',
    letters: LETTERS,
    steps: [
      {
        heading: 'Install the Alfavit keyboard layout (Mac and Linux)',
        body: 'Hold Option on a Mac, or AltGr on Linux, and press o, g, s or c for ö, ğ, ş or ç; with the apostrophe key it types ʼ. Every other key stays where it is, nothing runs in the background, and nothing you type leaves your computer.',
        link: { pagePath: 'keyboard-layout', label: 'Get the layout' },
      },
      { heading: 'Copy the letters from this page', body: 'Tap a letter above to copy it, then paste it where you write. Handy for a name, a heading or a form field.' },
      { heading: 'iPhone and Android', body: 'Add the Turkish keyboard (iOS: Settings → General → Keyboard → Keyboards; Android: Gboard → Languages). Ş, ç, ö and ğ are on it directly, and long-pressing s, c, o and g shows them too. Watch the i: the key where it usually sits types a dotless ı, the dotted i is right of ş, and a capital I is Shift plus the usual key. One more catch: it also brings Turkish autocorrect and predictions, which will fight Uzbek words. Turn auto-correction off while you write Uzbek (iOS: Settings → General → Keyboard; Gboard: Settings → Text correction), or keep typing the old way and convert afterwards.' },
      { heading: 'Windows', body: 'Add the Turkish Q keyboard (Settings → Time & Language → Language & region → Add a keyboard) and use the same keys: ğ on [, ş on ;, ö on , and ç on the . key. Watch the i: the I key types a dotless ı here, the dotted i is on the \' key right of ş, and Shift+I still gives a capital I. In Word, type 015f then Alt+X for ş and 011f then Alt+X for ğ. With a numeric keypad, Alt+0246 gives ö and Alt+0231 gives ç.' },
      { heading: 'Mac', body: 'On the U.S. layout, Option+U then O gives ö and Option+C gives ç. For ş and ğ add the Turkish Q input source (System Settings → Keyboard → Input Sources): ğ sits on the [ key, ş on ;, ö on , and ç on the . key. As on Windows, the I key types a dotless ı and the dotted i is on the \' key. The Character Viewer (Control+Command+Space) also has all four.' },
      { heading: 'Or let Alfavit type them', body: 'Keep typing the old way and convert: the Windows and Mac apps convert as you type, anywhere on your computer; the web converter, Telegram bot and Chrome extension convert pasted or selected text.' },
    ],
    note: 'A layout proposal reported in September 2026 places Ö, Ğ, Ş and Ç on punctuation keys that are unused in Uzbek; it has not been published. Until it is, Alfavit’s layout adds the letters without moving a key, and Turkish Q works if you would rather not install anything. Alfavit will ship the official placement as soon as it is published.',
    examples: EXAMPLES,
  },
  uz: {
    // UNVERIFIED (drafted 2026-10-22): needs the owner's native-speaker check.
    title: 'Ö, Ğ, Ş, Ç harflarini klaviatura va telefonda qanday yozish',
    intro: 'Yangi alifbodagi toʻrt harfni Android, iPhone, Windows va Mac klaviaturasida yozish yoʻllari — yoki Alfavit ularni siz uchun yozib bersin.',
    letters: LETTERS,
    steps: [
      // UNVERIFIED (drafted 2026-10-23): needs the owner's native-speaker check.
      {
        heading: 'Alfavit klaviatura joylashuvini oʻrnating (Mac va Linux)',
        body: 'Mac’da Option, Linux’da AltGr tugmasini bosib turib o, g, s yoki c ni bossangiz, ö, ğ, ş yoki ç chiqadi; apostrof tugmasi bilan ʼ chiqadi. Qolgan tugmalar joyida qoladi, fonda hech narsa ishlamaydi va yozganingiz kompyuteringizdan chiqmaydi.',
        link: { pagePath: 'keyboard-layout', label: 'Joylashuvni olish' },
      },
      { heading: 'Harflarni shu sahifadan nusxalang', body: 'Yuqoridagi harfga bosing — u nusxalanadi; keyin kerakli joyga qoʻying. Ism, sarlavha yoki forma maydoni uchun qulay.' },
      { heading: 'iPhone va Android', body: 'Turk (Türkçe) klaviaturasini qoʻshing (iOS: Settings → General → Keyboard → Keyboards; Android: Gboard → Languages). Ş, ç, ö, ğ unda bevosita bor; s, c, o, g tugmalarini bosib turganda ham chiqadi. i ga eʼtibor bering: odatda i turadigan tugma nuqtasiz ı ni yozadi, nuqtali i — ş ning oʻng tomonida, bosh I esa Shift va odatdagi tugma bilan yoziladi. Yana bir jihati bor: u bilan turkcha avtomatik tuzatish va taxminlar ham yoqiladi — ular oʻzbek soʻzlarini buzadi. Oʻzbekcha yozayotganda avtomatik tuzatishni oʻchirib qoʻying (iOS: Settings → General → Keyboard; Gboard: Settings → Text correction) yoki odatdagidek yozib, keyin oʻgiring.' },
      { heading: 'Windows', body: 'Turkish Q klaviaturasini qoʻshing (Settings → Time & Language → Language & region → Add a keyboard) va shu tugmalardan foydalaning: ğ — [, ş — ;, ö — , va ç — . tugmasida. i ga eʼtibor bering: bu joylashuvda I tugmasi nuqtasiz ı ni yozadi, nuqtali i — \' tugmasida (ş ning oʻngida), Shift+I esa baribir bosh I beradi. Word dasturida 015f yozib Alt+X bossangiz ş, 011f yozib Alt+X bossangiz ğ chiqadi. Raqamli klaviaturada Alt+0246 — ö, Alt+0231 — ç.' },
      { heading: 'Mac', body: 'AQSh (U.S.) joylashuvida Option+U, keyin O — ö; Option+C — ç. ş va ğ uchun Turkish Q kiritish manbasini qoʻshing (System Settings → Keyboard → Input Sources): ğ — [ tugmasida, ş — ; tugmasida, ö — , tugmasida, ç — . tugmasida. Windowsdagidek, I tugmasi nuqtasiz ı ni yozadi, nuqtali i esa \' tugmasida. Character Viewer (Control+Command+Space) da ham toʻrttala harf bor.' },
      { heading: 'Yoki Alfavit yozib bersin', body: 'Odatdagidek yozing va oʻgiring: Windows va Mac ilovalari yozayotganingizda kompyuterning istalgan joyida avtomatik oʻgiradi; veb oʻgirgich, Telegram bot va Chrome kengaytmasi joylangan yoki belgilangan matnni oʻgiradi.' },
    ],
    // UNVERIFIED (drafted 2026-10-23): needs the owner's native-speaker check.
    note: '2026-yil sentabrida xabar qilingan taklifga koʻra Ö, Ğ, Ş, Ç harflari oʻzbek tilida ishlatilmaydigan tinish belgisi tugmalariga joylashtiriladi; u hali eʼlon qilinmagan. Ungacha Alfavit joylashuvi birorta tugmani siljitmasdan harflarni qoʻshadi, hech narsa oʻrnatishni istamasangiz, Turkish Q ham ishlaydi. Rasmiy joylashuv eʼlon qilinishi bilan Alfavit uni ham chiqaradi.',
    examples: EXAMPLES,
  },
  ru: {
    // UNVERIFIED (drafted 2026-10-22): needs the owner's native-speaker check.
    title: 'Как набрать Ö, Ğ, Ş, Ç на клавиатуре и телефоне',
    intro: 'Способы набрать четыре новые узбекские буквы на Android, iPhone, Windows и Mac — или пусть Alfavit сделает это за вас.',
    letters: LETTERS,
    steps: [
      // UNVERIFIED (drafted 2026-10-23): needs the owner's check.
      {
        heading: 'Установите раскладку Alfavit (Mac и Linux)',
        body: 'Удерживайте Option на Mac или AltGr в Linux и нажмите o, g, s или c — получится ö, ğ, ş или ç; с клавишей апострофа — ʼ. Остальные клавиши остаются на местах, ничего не работает в фоне, и набранный текст не покидает ваш компьютер.',
        link: { pagePath: 'keyboard-layout', label: 'Получить раскладку' },
      },
      { heading: 'Скопируйте буквы с этой страницы', body: 'Нажмите на букву выше — она скопируется; вставьте её там, где пишете. Удобно для имени, заголовка или поля формы.' },
      { heading: 'iPhone и Android', body: 'Добавьте турецкую клавиатуру (iOS: Settings → General → Keyboard → Keyboards; Android: Gboard → Languages). Ş, ç, ö и ğ есть на ней напрямую, а долгое нажатие на s, c, o и g тоже показывает их. Следите за i: клавиша, где она обычно стоит, печатает ı без точки, i с точкой — справа от ş, а заглавная I — это Shift и обычная клавиша. Ещё одна оговорка: вместе с ней включаются турецкие автозамена и подсказки — они будут портить узбекские слова. Отключите автозамену, пока пишете по-узбекски (iOS: Settings → General → Keyboard; Gboard: Settings → Text correction), или пишите как раньше и конвертируйте потом.' },
      { heading: 'Windows', body: 'Добавьте клавиатуру Turkish Q (Settings → Time & Language → Language & region → Add a keyboard) и используйте те же клавиши: ğ на [, ş на ;, ö на , и ç на клавише «.». Следите за i: клавиша I здесь печатает ı без точки, i с точкой — на клавише \' справа от ş, а Shift+I по-прежнему даёт заглавную I. В Word наберите 015f и нажмите Alt+X для ş, 011f и Alt+X для ğ. На цифровой клавиатуре Alt+0246 даёт ö, Alt+0231 — ç.' },
      { heading: 'Mac', body: 'В раскладке U.S. Option+U, затем O даёт ö, Option+C — ç. Для ş и ğ добавьте источник ввода Turkish Q (System Settings → Keyboard → Input Sources): ğ на клавише [, ş на ;, ö на , и ç на клавише «.». Как и в Windows, клавиша I печатает ı без точки, а i с точкой — на клавише \'. В Character Viewer (Control+Command+Space) тоже есть все четыре.' },
      { heading: 'Или пусть их наберёт Alfavit', body: 'Пишите как раньше и конвертируйте: приложения для Windows и Mac преобразуют текст по мере ввода в любой программе; веб-конвертер, Telegram-бот и расширение Chrome конвертируют вставленный или выделенный текст.' },
    ],
    // UNVERIFIED (drafted 2026-10-23): needs the owner's check.
    note: 'Предложение, о котором сообщалось в сентябре 2026 года, размещает Ö, Ğ, Ş и Ç на клавишах знаков препинания, не используемых в узбекском; оно пока не опубликовано. До тех пор раскладка Alfavit добавляет буквы, не сдвигая ни одной клавиши, а Turkish Q подойдёт, если вы не хотите ничего устанавливать. Alfavit выпустит официальную раскладку, как только она будет опубликована.',
    examples: EXAMPLES,
  },
}
