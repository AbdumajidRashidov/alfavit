# Demo shot list

One 15-second GIF (three 5-second clips) plus the MP4 for press. Uzbek UI, cursor visible, no audio, 1280×800.

## Clips

**1. Web converter (5 s)** — `https://alfavit.uz`, language uz, scrolled to the converter.
Paste: `Ўзбекистон Республикаси Президентининг қарори`
Wait for the result `Özbekiston Respublikasi Prezidentining qarori`, move the cursor to **Nusxa olish**, pause one beat.

**2. Telegram inline (5 s)** — any chat (a "Saved Messages" chat is fine).
Type: `@alfavit_uz_bot Тошкент шаҳар ҳокимлиги`
Tap the result. The sent message reads `Toşkent şahar hokimligi` with the "via @alfavit_uz_bot" stamp — let it sit for a beat so the stamp is readable.

**3. Mac live transform (5 s)** — Notes app, Alfavit menu-bar app with **Live transform** on.
Type slowly: `O'zbekiston sharqida choy ichildi`
It becomes `Özbekiston şarqida çoy içildi` as you type. Keep the menu-bar icon in frame if possible.

## Recording and export (all free)

1. macOS Screenshot toolbar (⇧⌘5) → *Record Selected Portion* → a 1280×800 region. Record each clip separately; retake until the typing looks natural.
2. Trim in QuickTime (⌘T) to ~5 s each. Keep the three `.mov` files.
3. Join and export: QuickTime → *Edit → Add Clip to End*, then *File → Export As → 1080p* → `alfavit-demo.mp4` (this is the press version).
4. GIF: open the MP4 in **Gifski** (free, App Store) → 15 fps, quality 80, width 960 → `alfavit-demo.gif`. Target ≤ 8 MB; if larger, drop to 12 fps or width 800.
5. Two still frames for posts: pause the MP4 on the converter result and on the Telegram "via" stamp, ⇧⌘4 each → `still-web.png`, `still-telegram.png`.

## Where files go

`docs/marketing/assets/` — create it; commit the two stills and the GIF only if ≤ 8 MB. Host the MP4 as a post in your Telegram channel (or Cloudflare Pages) and paste that link into `press-kit.md` → Assets.

## Checklist

- [ ] System language uz, site language uz
- [ ] No notifications during recording (Focus mode on)
- [ ] Cursor visible, no double-clicks
- [ ] Result text readable at 960 px wide — bump browser zoom to 125 % if not
- [ ] MP4 link pasted into `press-kit.md`
