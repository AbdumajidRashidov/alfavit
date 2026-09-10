# Alfavit — press kit

Paste-ready facts for journalists. Everything here is verified as of 10 September 2026; if a fact is not here, do not claim it. Uzbek and Russian copy: owner verifies before sending.

## One paragraph

**uz**
Alfavit — oʻzbek matnini kirill yoki 1995-yilgi lotin yozuvidan 2026-yilgi yangi lotin alifbosiga (ş, ç, ö, ğ) bir zumda oʻgiruvchi bepul vosita. Sayt (alfavit.uz), Telegram bot (istalgan chatda ichki rejimda ishlaydi), Chrome kengaytmasi, Mac ilovasi (yozayotganingizda avtomatik oʻgiradi), fayllar (.docx, .txt, .srt) va ochiq API. Matn qurilmadan chiqmaydi — hech narsa yuklanmaydi. Dvigatel ochiq kodli (MIT). Muallif — toshkentlik dasturchi Abdumajid Rashidov.

**ru**
Alfavit — бесплатный инструмент, который мгновенно переводит узбекский текст с кириллицы или латиницы 1995 года в новый латинский алфавит 2026 года (ş, ç, ö, ğ). Сайт alfavit.uz, Telegram-бот (работает инлайн в любом чате), расширение Chrome, приложение для Mac (конвертирует по мере ввода), файлы (.docx, .txt, .srt) и открытый API. Текст не покидает устройство — ничего не загружается. Движок с открытым кодом (MIT). Автор — ташкентский разработчик Абдумажид Рашидов.

**en**
Alfavit is a free tool that instantly converts Uzbek text from Cyrillic or the 1995 Latin alphabet into the 2026 Latin alphabet (ş, ç, ö, ğ). It comes as a website (alfavit.uz), a Telegram bot that works inline in any chat, a Chrome extension, a Mac app that converts as you type, file conversion (.docx, .txt, .srt) and a public API. Text never leaves the device — nothing is uploaded. The engine is open source (MIT). Built by Tashkent-based developer Abdumajid Rashidov.

## Fact sheet

- **What:** converter for the 2026 Uzbek Latin alphabet. Input: Cyrillic or 1995 Latin (any apostrophe variant). Output: new Latin with ş ç ö ğ.
- **Launched:** July 2026, in the week the Legislative Chamber adopted the law. All channels live since July 2026; Chrome extension submitted to the Web Store September 2026.
- **Channels:** web `https://alfavit.uz` (uz/ru/en) · Telegram `@alfavit_uz_bot` (send text, or type `@alfavit_uz_bot text` in any chat) · files `https://alfavit.uz/files` (.docx keeps formatting; .txt; .srt subtitles) · macOS app `https://alfavit.uz/apps` (menu-bar app; "Live transform" converts as you type in any application) · Chrome/Edge extension (popup + right-click "Convert to new Latin") · API `POST https://api.alfavit.uz/v1/transliterate` (no key, 60 requests/min per IP, 100,000 characters per request) · SDK `@alfavit/sdk` and engine `@alfavit/engine` on npm.
- **What the engine does that others don't:** targets the 2026 alphabet (as of 10 Sep 2026 the other public converters — kirillotin.uz, lotin.uz, transliterator.uz, kiril-lotin.uz, parsing.uz, lotincha.uz, uzlatin.uz — convert to the 1995 Latin); applies the position-dependent е → e/ye rule; recognizes every apostrophe variant for oʻ/gʻ; returns "ambiguity flags" where more than one spelling is possible instead of guessing silently; handles mixed-script text.
- **Privacy:** conversion runs on the device (browser, Telegram server function, or the Mac app). Nothing is stored. The website uses cookieless Cloudflare Web Analytics only.
- **Price:** free. No account, no ads.
- **Code:** `https://github.com/AbdumajidRashidov/alfavit`, MIT license. TypeScript monorepo: engine, SDK, web, bot, API, extension, desktop.
- **Builder:** Abdumajid Rashidov, software engineer, Tashkent. Built and maintained solo.

## The reform in five lines

1. The law changes the Latin-based Uzbek alphabet from 26 letters + 3 letter combinations to **28 letters + 1 apostrophe sign**.
2. **Sh→Ş, Ch→Ç, Oʻ→Ö, Gʻ→Ğ**; **ng** is no longer listed as a separate letter.
3. Adopted by the **Legislative Chamber on 7 July 2026**; approved by the **Senate on 10 September 2026** and sent to the President. It takes effect after the President signs it and a transition period.
4. After entry into force, media, state bodies and official correspondence switch; personal use stays free; documents issued in the current alphabet stay valid.
5. Schools: first-grade textbooks in the new alphabet from **2027/28**; all textbooks by **2031**.

Sources: gazeta.uz (10 Sep 2026, `oz/2026/09/10/uzb-alphabet`), spot.uz (10 Sep 2026, `oz/2026/09/10/uzbek-alphabet`), daryo.uz (`fxq5yS_DR`), zamin.uz (textbooks, 10 Sep 2026), kun.uz (7 Jul 2026).

## Letter table

| Old (1995) | New (2026) | Example |
|-----------|-----------|---------|
| Sh sh | Ş ş | shahar → şahar |
| Ch ch | Ç ç | choy → çoy |
| Oʻ oʻ | Ö ö | oʻzbek → özbek |
| Gʻ gʻ | Ğ ğ | gʻalaba → ğalaba |

Cyrillic examples: Ўзбекча → Özbekça · Тошкент шаҳри → Toşkent şahri · ғалаба → ğalaba.

## Quote bank (attribute to Abdumajid Rashidov, creator of Alfavit)

1. **Why the old letters hurt.**
   uz: «Eski alifbodagi oʻ va gʻ kompyuter uchun bir harf emas, ikkita belgi edi. Shu sababli qidiruv, URL manzillar va lugʻatlar buzilardi. Yangi harflar bu muammoni tub-tubidan yoʻq qiladi.»
   ru: «Для компьютера старые oʻ и gʻ были не буквой, а двумя символами. Из-за этого ломались поиск, адреса сайтов и словари. Новые буквы убирают проблему в корне.»
   en: "To a computer, the old oʻ and gʻ were not one letter but two characters. That is why search, URLs and dictionaries broke. The new letters remove the problem at the root."

2. **Paper vs. keyboard.**
   uz: «Alifbo qogʻozda bugun oʻzgardi. Klaviaturangizda esa bir marta joylash bilan oʻzgaradi.»
   ru: «На бумаге алфавит изменился сегодня. На вашей клавиатуре он меняется одной вставкой текста.»
   en: "On paper the alphabet changed today. On your keyboard it changes with one paste."

3. **Six keystrokes.**
   uz: «Bugun ö harfini yozish uchun oltitagacha tugma bosish kerak. Alfavit Mac ilovasi bilan odatdagidek yozasiz — harflar oʻzi almashadi.»
   ru: «Сегодня, чтобы набрать ö, нужно до шести нажатий. С приложением Alfavit для Mac вы печатаете как раньше — буквы меняются сами.»
   en: "Today typing ö takes up to six keystrokes. With the Alfavit Mac app you type the way you always did and the letters change themselves."

4. **Open source.**
   uz: «Dvigatelni ochiq kodli qildik: tahririyat ham, vazirlik ham qoidalarni tekshirib, oʻz tizimida bepul ishlatishi mumkin.»
   ru: «Мы открыли код движка: и редакция, и министерство могут проверить правила и бесплатно использовать его в своих системах.»
   en: "We open-sourced the engine so a newsroom or a ministry can audit the rules and run it in their own systems for free."

5. **The goal.**
   uz: «Maqsad — oʻtish davrini zerikarli qilish. Odam alifbo haqida oʻylamasin, shunchaki yozsin.»
   ru: «Цель — сделать переход скучным. Чтобы человек не думал об алфавите, а просто писал.»
   en: "The goal is to make the transition boring. Nobody should think about the alphabet; they should just write."

6. **Privacy.**
   uz: «Matn qurilmadan chiqmaydi. Bu shunchaki vaʼda emas — kod ochiq, istagan odam tekshirishi mumkin.»
   ru: «Текст не покидает устройство. Это не просто обещание — код открыт, любой может проверить.»
   en: "Your text never leaves your device. That is not a promise, it is checkable: the code is open."

## Assets

| Asset | File | Size |
|-------|------|------|
| Logo | `apps/web/public/logo.png` (also live at `https://alfavit.uz/logo.png`) | square PNG |
| Logo, vector | `alfavit-bot-logo.svg` (repo root) | SVG |
| Bot / app icon | `alfavit-bot-logo-512.png` (repo root) | 512×512 |
| Social card | `apps/web/public/og.png` (live at `https://alfavit.uz/og.png`) | 1200×630 |
| Extension screenshots | `docs/chrome-web-store/screenshots/01-popup.png`, `02-context-menu.png` | 1280×800 |
| Promo tile | `docs/chrome-web-store/screenshots/promo-440x280.png` | 440×280 |
| Demo, web clip (ready) | `docs/marketing/assets/alfavit-demo-web.gif` (960 px, 15 fps), `still-web.png`; MP4 `alfavit-demo-web.mp4` is on disk only — post it to Telegram and paste the link here: `<link>` | 5.6 s |
| Demo, full three clips | `docs/marketing/assets/alfavit-demo.gif` + `still-telegram.png`, produced by `record-demo.sh` once clips 2 and 3 are recorded | ≤ 8 MB |

## Contact

Abdumajid Rashidov — creator of Alfavit
Email: `<your email>` · Telegram: `<your handle>` · GitHub: `https://github.com/AbdumajidRashidov`
Available for a short comment or demo within an hour on launch days.
