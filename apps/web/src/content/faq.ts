import type { Locale } from '../seo/config'
import type { FaqItem } from './types'

export const faq: Record<Locale, FaqItem[]> = {
  en: [
    { q: 'What changed in the 2026 Uzbek alphabet reform?', a: 'Uzbekistan replaced the 1995 digraphs and apostrophe-letters with single letters: sh→ş, ch→ç, gʻ→ğ, oʻ→ö; ng is no longer a separate letter. The alphabet now has 28 letters and one apostrophe sign.' },
    { q: 'How many letters are in the new alphabet?', a: '28 letters and one apostrophe sign (tutuq belgisi). Previously there were 26 letters and 3 letter combinations.' },
    { q: 'When was the reform adopted?', a: 'The Legislative Chamber adopted the law on 7 July 2026 and the Senate approved it on 10 September 2026. It takes effect once the President signs it.' },
    { q: 'Which letters changed?', a: 'Four: sh→ş, ch→ç, gʻ→ğ, oʻ→ö. The combination ng is no longer counted as a separate letter.' },
    { q: 'Why did the alphabet change?', a: 'The 1995 digraphs and apostrophes broke software, URLs, and search, and made Uzbek inconsistent with other Turkic Latin alphabets. Single letters remove that friction.' },
    { q: 'How do I convert Cyrillic or old Latin to the new Latin?', a: 'Use the Alfavit converter — paste your text and it converts instantly, on your device.' },
    { q: 'Does Alfavit store or upload my text?', a: 'No. Conversion happens entirely in your browser; nothing is uploaded, stored, or tracked.' },
    { q: 'Is Alfavit free?', a: 'Yes — the web converter, the Telegram bot, and the public API are all free.' },
  ],
  uz: [
    { q: '2026-yilgi oʻzbek alifbosi islohotida nima oʻzgardi?', a: 'Oʻzbekiston 1995-yildagi qoʻsh harflar va apostrofli harflarni bitta harfga almashtirdi: sh→ş, ch→ç, gʻ→ğ, oʻ→ö; ng endi alohida harf hisoblanmaydi. Endi alifboda 28 ta harf va bitta tutuq belgisi bor.' },
    { q: 'Yangi alifboda nechta harf bor?', a: '28 ta harf va bitta tutuq belgisi. Avval 26 ta harf va 3 ta harf birikmasi bor edi.' },
    { q: 'Islohot qachon qabul qilindi?', a: 'Qonunchilik palatasi qonunni 2026-yil 7-iyulda qabul qildi, Senat 2026-yil 10-sentabrda maʼqulladi. Qonun Prezident imzolagach kuchga kiradi.' },
    { q: 'Qaysi harflar oʻzgardi?', a: 'Toʻrtta: sh→ş, ch→ç, gʻ→ğ, oʻ→ö. ng birikmasi endi alohida harf sifatida sanalmaydi.' },
    { q: 'Nega alifbo oʻzgardi?', a: '1995-yilgi qoʻsh harflar va apostroflar dastur, URL va qidiruvni buzardi hamda oʻzbekchani boshqa turkiy lotin alifbolaridan farqli qilardi. Bitta harflar bu muammolarni bartaraf etadi.' },
    { q: 'Kirill yoki eski lotin matnini yangi lotinga qanday oʻgiraman?', a: 'Alfavit oʻgirgichidan foydalaning — matnni joylang, u qurilmangizda bir zumda oʻgiriladi.' },
    { q: 'Alfavit matnimni saqlaydimi yoki yuklaydimi?', a: 'Yoʻq. Oʻgirish toʻliq brauzeringizda amalga oshadi; hech narsa yuklanmaydi, saqlanmaydi yoki kuzatilmaydi.' },
    { q: 'Alfavit bepulmi?', a: 'Ha — veb oʻgirgich, Telegram bot va ochiq API bepul.' },
  ],
  ru: [
    { q: 'Что изменилось в реформе узбекского алфавита 2026 года?', a: 'Узбекистан заменил диграфы и буквы с апострофом образца 1995 года одиночными буквами: sh→ş, ch→ç, gʻ→ğ, oʻ→ö; ng больше не считается отдельной буквой. Теперь в алфавите 28 букв и один знак апострофа.' },
    { q: 'Сколько букв в новом алфавите?', a: '28 букв и один знак апострофа (tutuq belgisi). Раньше было 26 букв и 3 буквосочетания.' },
    { q: 'Когда принята реформа?', a: 'Законодательная палата приняла закон 7 июля 2026 года, Сенат одобрил его 10 сентября 2026 года. Закон вступит в силу после подписи Президента.' },
    { q: 'Какие буквы изменились?', a: 'Четыре: sh→ş, ch→ç, gʻ→ğ, oʻ→ö. Сочетание ng больше не считается отдельной буквой.' },
    { q: 'Почему алфавит изменили?', a: 'Диграфы и апострофы образца 1995 года ломали ПО, URL и поиск и делали узбекскую латиницу непохожей на другие тюркские. Одиночные буквы устраняют это.' },
    { q: 'Как конвертировать кириллицу или старую латиницу в новую?', a: 'Используйте конвертер Alfavit — вставьте текст, и он преобразуется мгновенно на вашем устройстве.' },
    { q: 'Alfavit хранит или загружает мой текст?', a: 'Нет. Конвертация выполняется полностью в браузере; ничего не загружается, не хранится и не отслеживается.' },
    { q: 'Alfavit бесплатный?', a: 'Да — веб-конвертер, Telegram-бот и публичный API бесплатны.' },
  ],
}
