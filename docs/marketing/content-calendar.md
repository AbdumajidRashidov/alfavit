# Content calendar — weeks 2 to 8

One guide page per week, each aimed at a question people type into a search box, each promoted with one post. Week 1's guide is `/guide/keyboard` (live). Budget: ~4 hours per guide including the post.

| Week | Page path | Target query (uz; ru where relevant) | Angle | Promotion post |
|------|-----------|--------------------------------------|-------|----------------|
| 2 | `/guide/names-and-documents` | `ismni yangi alifboda yozish`, `pasportdagi ism yangi alifbo`, ru `имя на новом узбекском алфавите` | Names, surnames, addresses: how they look in the new alphabet; documents in the current alphabet stay valid, no need to reissue; a table of common name patterns (Oʻtkir → Ötkir, Shahnoza → Şahnoza, Gʻulom → Ğulom). | Telegram + Reddit: "Ismingiz yangi alifboda qanday yoziladi?" with the converter link |
| 3 | `/guide/word-documents` | `Word hujjatni yangi alifboga oʻtkazish`, `docx kirill lotin konvertor`, ru `перевести документ Word в новый алфавит` | Step-by-step for `.docx` via `/files`: formatting kept, nothing uploaded, batch tips, what to check afterwards (e/ye flags). | Telegram post for office workers and students; DM to media-worker chats |
| 4 | `/guide/subtitles` | `srt subtitrni oʻgirish`, `video subtitr yangi alifbo` | For YouTubers and Telegram video channels: convert `.srt`, re-upload, keep timing; note on fonts that render ş ğ. | Post in creator/SMM chats; short screen recording |
| 5 | `/guide/telegram-channels` | `Telegram kanal postlarini yangi alifboga oʻtkazish`, `telegram bot yangi alifbo` | For channel admins: inline mode in any chat, converting scheduled posts, pinned "how to read the new letters" template they can copy. | Post in admin/SMM chats; ask two mid-size channels to try it and quote them |
| 6 | `/guide/websites` | `saytni yangi alifboga oʻtkazish`, `yangi alifbo API`, ru `перевести сайт на новый узбекский алфавит` | For developers: API, SDK, npm engine, Unicode of the new letters, URL slugs, database migration checklist, search normalization. | Habr article link, dev chats, Show HN follow-up comment |
| 7 | `/guide/teachers` | `yangi alifbo darslik oʻqituvchi`, `yangi alifbo jadvali chop etish` | For teachers: printable 28-letter chart (`/alphabet`), worksheet conversion via `/files`, the 2027/28 → 2031 textbook timeline, classroom tips for ö/ğ. | Teacher groups (message B in `community-seeding.md`); Zamin.uz pitch |
| 8 | `/guide/spelling` | `yangi alifboda e va ye`, `tutuq belgisi yangi alifbo`, `ng harfi yangi alifbo` | The rules people argue about: position-dependent e/ye, the apostrophe sign, ng no longer a letter, what Alfavit flags and why. Cite official sources only. | Telegram post; reply link for every "is this right?" comment from weeks 1–7 |

## How to add a guide (each week, same recipe)

1. Content file `apps/web/src/content/guides/<name>.ts` exporting `Record<Locale, Guide>` — `title`, `intro`, `steps` (4–6), `examples`; optional `letters` (copy buttons) and `note`. Follow `keyboard.ts`.
2. Page `apps/web/src/pages/Guide<Name>Page.tsx` — three lines, like `GuideKeyboardPage.tsx`, with `pagePath="guide/<name>"`.
3. Route in `apps/web/src/router.tsx` (`PAGES`) and a row in `apps/web/src/seo/config.ts` (`PAGE_PATHS`, priority 0.6).
4. Three keys per locale in `translations.ts`: `meta.guide.<name>.title`, `meta.guide.<name>.desc`, `guides.<name>`; link it from the Reform page guides list.
5. Tests: add the page to `guides-build.test.ts`, bump the count in `sitemap-build.test.ts` by 3, add a render test.
6. One line in `apps/web/public/llms.txt` → Pages.
7. `pnpm --dir apps/web test && pnpm --dir apps/web test:dist`, commit `feat(web): <name> guide`, merge → CI deploys.
8. Post the promotion the same day; note the query in `metrics.md` and check it in Web Analytics → Paths a week later.

## Rules for every guide

- Answer the query in the first paragraph; the Alfavit pitch comes last.
- Facts only from the law and official sources; when unsure, omit.
- uz first, then ru and en; owner verifies uz before merge.
- One internal link to the converter, one to a related guide, nothing else.
