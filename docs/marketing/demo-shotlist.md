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

## Recording and export

Run the recorder. It counts you in, records each clip from a window you select with the crosshair, and builds everything with ffmpeg:

```bash
bash docs/marketing/record-demo.sh
```

Re-record one clip with `--clip 2`; rebuild from the existing clips with `--build`. It preloads the text for clips 1 and 2 on your clipboard (⌘V), offers to update the installed Mac app to the version the site ships before clip 3, and writes `alfavit-demo.mp4`, `alfavit-demo.gif` (kept ≤ 8 MB) and the two stills into `assets/`. Raw clips stay in `assets/raw/`, which is gitignored. The first run asks for Screen Recording permission for your terminal app; grant it, restart the terminal, run again.

Manual fallback: ⇧⌘5 → Record Selected Portion for each clip, trim in QuickTime, join with Add Clip to End, export at 1080p; GIF via Gifski at 15 fps and 960 px wide.

## Where files go

`docs/marketing/assets/` — create it; commit the two stills and the GIF only if ≤ 8 MB. Host the MP4 as a post in your Telegram channel (or Cloudflare Pages) and paste that link into `press-kit.md` → Assets.

## Checklist

- [ ] System language uz, site language uz
- [ ] No notifications during recording (Focus mode on)
- [ ] Cursor visible, no double-clicks
- [ ] Result text readable at 960 px wide — bump browser zoom to 125 % if not
- [ ] MP4 link pasted into `press-kit.md`
