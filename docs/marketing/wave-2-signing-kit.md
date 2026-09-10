# Wave 2 — the day the President signs

Everything here is pre-written. On the day, fill in the date, change six strings, deploy, send. Target: live and posted within two hours of the news.

## Trigger and sources

The law is signed and/or published. Watch: Gazeta.uz and Kun.uz Telegram channels, Spot.uz, `lex.uz` (official publication), the President's press service (`president.uz`). Confirm the date from two sources before changing anything.

## Two-hour runbook

**0:00 — confirm.** Signing date `<DATE>` (e.g. `24 October 2026`), entry-into-force date `<EFFECT>` if the published text states one. If `<EFFECT>` is unknown, use "after the transition period set by the law".

**0:05 — site strings** in `apps/web/src/i18n/translations.ts` (one line per locale each):

`news.senate`
- en: `The President signed the alphabet law on <DATE>. What changes and when →`
- uz: `Prezident alifbo toʻgʻrisidagi qonunni <DATE-uz> imzoladi. Nima va qachon oʻzgaradi →`
- ru: `Президент подписал закон об алфавите <DATE-ru>. Что и когда меняется →`

`reform.law` — replace the "awaits the President's signature" clause:
- en: `Adopted by the Legislative Chamber on 7 July 2026, approved by the Senate on 10 September 2026 and signed by the President on <DATE>. The alphabet has 28 letters and one apostrophe sign (was 26 letters and 3 letter combinations).`
- uz: `Qonunchilik palatasi 2026-yil 7-iyulda qabul qildi, Senat 2026-yil 10-sentabrda maʼqulladi, Prezident <DATE-uz> imzoladi. Alifboda 28 ta harf va bitta tutuq belgisi bor (avval 26 ta harf va 3 ta harf birikmasi edi).`
- ru: `Принят Законодательной палатой 7 июля 2026 года, одобрен Сенатом 10 сентября 2026 года и подписан Президентом <DATE-ru>. В алфавите 28 букв и один знак апострофа (было 26 букв и 3 буквосочетания).`

`reform.updated`
- en: `Updated <DATE>` · uz: `<DATE-uz>da yangilandi` · ru: `Обновлено <DATE-ru>`

`meta.reform.desc` — swap "what the Senate approved on 10 September 2026" for "signed into law on <DATE>" (en), "<DATE-uz> imzolangan qonun" (uz), "подписан <DATE-ru>" (ru).

**0:20 — timeline** in `apps/web/src/content/timeline.ts`: replace the `Next` / `Keyingi qadam` / `Далее` row in each locale with:
- en `{ date: '<DATE>', body: 'The President signs the law; it is officially published.' }`
- uz `{ date: '<DATE-uz>', body: 'Prezident qonunni imzoladi; qonun rasman eʼlon qilindi.' }`
- ru `{ date: '<DATE-ru>', body: 'Президент подписывает закон; закон официально опубликован.' }`

If `<EFFECT>` is known, change the `After entry into force` row's `date` to `<EFFECT>` in all three locales.

**0:30 — FAQ** in `apps/web/src/content/faq.ts`: the "When was the reform adopted?" answers get a final sentence: en `The President signed it on <DATE>.` · uz `Prezident <DATE-uz> imzoladi.` · ru `Президент подписал его <DATE-ru>.` Remove the "takes effect once the President signs it" clause.

**0:40 — test, commit, deploy.**
```bash
pnpm --dir apps/web test && pnpm --dir apps/web test:dist
git add apps/web/src && git commit -m "feat(web): presidential signature update (<DATE>)"
git push   # CI deploys web, bot and API from main
```
Tests that mention the Senate wording (`ReformPage.test.tsx`, `reform-build.test.ts`) still pass: the Senate date stays in the copy.

**1:00 — posts** (below), then the press follow-up.

**1:30 — bot**: nothing to change; the bot texts do not mention the legal status.

## Posts (utm_campaign=signing-2026)

**Telegram — uz**
```
Prezident yangi alifbo toʻgʻrisidagi qonunni imzoladi. Endi bu rasmiy: sh → ş, ch → ç, oʻ → ö, gʻ → ğ; 28 harf va bitta tutuq belgisi.

Nima va qachon oʻzgaradi (OAV, hujjatlar, darsliklar): alfavit.uz/reform

Bugundan yangi alifboda yozish: alfavit.uz — matn, fayl (.docx/.txt/.srt), Telegram (@alfavit_uz_bot istalgan chatda), Mac ilovasi. Bepul, kod ochiq.
https://alfavit.uz/?utm_source=telegram&utm_medium=post&utm_campaign=signing-2026
```

**Telegram — ru**
```
Президент подписал закон о новом алфавите. Теперь официально: sh → ş, ch → ç, oʻ → ö, gʻ → ğ; 28 букв и один знак апострофа.

Что и когда меняется (СМИ, документы, учебники): alfavit.uz/reform

Писать на новом алфавите уже сегодня: alfavit.uz — текст, файлы (.docx/.txt/.srt), Telegram (@alfavit_uz_bot в любом чате), приложение для Mac. Бесплатно, код открыт.
https://alfavit.uz/?utm_source=telegram&utm_medium=post&utm_campaign=signing-2026
```

**LinkedIn / X — en**
```
It is law: Uzbekistan's President signed the new 28-letter alphabet today. sh → ş, ch → ç, oʻ → ö, gʻ → ğ.

Since the Senate vote, Alfavit has converted text for [N] people a day across web, Telegram, Chrome and Mac. The timeline of what switches when — media, documents, textbooks through 2031 — is here: https://alfavit.uz/reform?utm_source=linkedin&utm_medium=post&utm_campaign=signing-2026

Free, on-device, open source. If your organisation has an archive to convert, the files tool and API are ready.
```
(For X, split at the blank lines; swap `linkedin` for `x` in the UTM.)

## Press follow-up (to everyone pitched in Wave 1, replied or not)

**uz**
```
Assalomu alaykum, [ism]. Prezident qonunni imzoladi — Senat qaroridan keyin yozgan Alfavit haqidagi xabarimga qisqa qoʻshimcha: shu davrda vosita kuniga [N] kishiga xizmat qildi, Telegram botdan [M] kishi foydalandi. Oʻtish bosqichlari (OAV, hujjatlar, darsliklar) bir sahifada: alfavit.uz/reform. Izoh yoki raqamlar kerak boʻlsa, bir soat ichida javob beraman. Hurmat bilan, Abdumajid Rashidov
```

**ru**
```
Здравствуйте, [имя]. Президент подписал закон — короткое дополнение к моему письму про Alfavit после решения Сената: за это время инструментом пользовались [N] человек в день, Telegram-ботом — [M]. Этапы перехода (СМИ, документы, учебники) на одной странице: alfavit.uz/reform. Если нужен комментарий или цифры — отвечу в течение часа. С уважением, Абдумажид Рашидов
```

Fill `[N]` and `[M]` from `metrics.md` on the day. Send only once.

## After the day

- Add the signing date to `press-kit.md` → The reform in five lines.
- Update `docs/marketing/README.md` → Ground rules with the signing date.
- Move this file's runbook into the weekly review as "done".
