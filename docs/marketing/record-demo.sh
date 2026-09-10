#!/usr/bin/env bash
#
# record-demo.sh — records the three Alfavit demo clips from docs/marketing/demo-shotlist.md
# and assembles docs/marketing/assets/alfavit-demo.mp4, alfavit-demo.gif (≤ 8 MB) and two stills.
#
#   bash docs/marketing/record-demo.sh            # record all three clips, then build
#   bash docs/marketing/record-demo.sh --build    # rebuild from the clips already in assets/raw/
#   bash docs/marketing/record-demo.sh --clip 2   # re-record one clip, then rebuild
#
# macOS only (screencapture). Needs ffmpeg (brew install ffmpeg). The first run asks for
# Screen Recording permission for your terminal app; grant it, restart the terminal, run again.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$ROOT/docs/marketing/assets"
RAW="$OUT/raw"
SECS=7           # seconds recorded per clip; the build keeps 5.5 s of each
W=1280; H=800    # output frame

BOLD=$(tput bold 2>/dev/null || true); DIM=$(tput dim 2>/dev/null || true); RESET=$(tput sgr0 2>/dev/null || true)
title() { printf '\n%s%s%s\n' "$BOLD" "$1" "$RESET"; }
say()   { printf '  %s\n' "$1"; }
note()  { printf '  %s%s%s\n' "$DIM" "$1" "$RESET"; }
pause() { printf '  %s ' "${1:-Press Enter to continue}"; read -r _ || true; }
need()  { command -v "$1" >/dev/null 2>&1 || { echo "missing: $1 (brew install $1)"; exit 1; }; }

need ffmpeg; need screencapture; need pbcopy
mkdir -p "$RAW"

maybe_update_app() {
  local dmg="$ROOT/apps/web/public/download/Alfavit.dmg" want have mnt
  want=$(grep -oE '"version": *"[^"]+"' "$ROOT/apps/desktop/package.json" | head -1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
  have=$(defaults read /Applications/Alfavit.app/Contents/Info CFBundleShortVersionString 2>/dev/null || echo none)
  [ "$have" = "$want" ] && return 0
  title "Installed Alfavit.app is $have; the site ships $want"
  printf '  Replace /Applications/Alfavit.app with the repo .dmg build before recording clip 3? [y/N] '
  local r; read -r r || true
  case "$r" in y|Y) ;; *) note "keeping $have"; return 0;; esac
  osascript -e 'tell application "Alfavit" to quit' >/dev/null 2>&1 || true; sleep 1
  mnt=$(hdiutil attach -nobrowse -readonly -noverify "$dmg" | grep -oE '/Volumes/.*$' | head -1)
  rm -rf /Applications/Alfavit.app && cp -R "$mnt/Alfavit.app" /Applications/ && hdiutil detach "$mnt" -quiet
  open -a Alfavit
  say "✓ Alfavit $want installed and started — turn Live transform ON in its panel before clip 3."
}

# record N "title" "what to do while it records" "text to preload on the clipboard (or empty)"
record() {
  local n="$1" name="$2" instr="$3" clip="$4" file="$RAW/clip$1.mov"
  title "Clip $n of 3 · $name"
  say "$instr"
  if [ -n "$clip" ]; then printf '%s' "$clip" | pbcopy; note "→ the text is already on your clipboard: ⌘V pastes it."; fi
  note "Recording is $SECS s. When the crosshair appears: drag a rectangle around the window,"
  note "or press Space and click the window. Recording starts at once and stops by itself"
  note "(or click the ■ stop icon in the menu bar)."
  pause "Set the window up, then press Enter for a 3-second countdown."
  local i; for i in 3 2 1; do printf '  %s…\n' "$i"; sleep 1; done
  rm -f "$file"
  # -v video, -i pick the region/window, -k show clicks, -x no sound, -V<secs> auto-stop
  screencapture -v -i -k -x -V"$SECS" "$file" || true
  if [ ! -s "$file" ]; then
    say "No recording was written. If macOS asked for Screen Recording permission, allow it in"
    say "System Settings → Privacy & Security → Screen Recording, restart this terminal app, and run again."
    exit 1
  fi
  say "✓ saved $(basename "$file")"
}

build() {
  title "Building MP4, GIF and stills"
  local list="$RAW/concat.txt" n src dst
  : > "$list"
  for n in 1 2 3; do
    src="$RAW/clip$n.mov"; dst="$RAW/clip$n.mp4"
    [ -s "$src" ] || { echo "missing $src — record clip $n first (bash $0 --clip $n)"; exit 1; }
    # skip the first half second (selection wobble), keep 5.5 s, fit into WxH on white, 30 fps
    ffmpeg -y -loglevel error -ss 0.5 -t 5.5 -i "$src" \
      -vf "scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=white,fps=30,format=yuv420p" \
      -an -c:v libx264 -crf 20 -preset medium "$dst"
    printf "file '%s'\n" "$dst" >> "$list"
  done
  # Re-encode the join: stream-copying clips from different sources (Playwright webm,
  # screencapture) yields a file that plays only one of them.
  ffmpeg -y -loglevel error -f concat -safe 0 -i "$list" -c:v libx264 -crf 20 -preset medium -pix_fmt yuv420p -r 30 -an "$OUT/alfavit-demo.mp4"

  # GIF: two-pass palette; shrink until it fits Telegram/GitHub limits (≤ 8 MB)
  local fps=15 width=960 size
  while :; do
    ffmpeg -y -loglevel error -i "$OUT/alfavit-demo.mp4" \
      -vf "fps=${fps},scale=${width}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle" \
      "$OUT/alfavit-demo.gif"
    size=$(stat -f%z "$OUT/alfavit-demo.gif")
    if [ "$size" -le 8388608 ] || [ "$width" -le 640 ]; then break; fi
    fps=12; width=$((width - 160))
  done

  ffmpeg -y -loglevel error -ss 4.5 -i "$RAW/clip1.mp4" -frames:v 1 "$OUT/still-web.png"
  ffmpeg -y -loglevel error -ss 4.5 -i "$RAW/clip2.mp4" -frames:v 1 "$OUT/still-telegram.png"

  title "Done"
  say "MP4: $OUT/alfavit-demo.mp4 ($(du -h "$OUT/alfavit-demo.mp4" | cut -f1), $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT/alfavit-demo.mp4" | cut -c1-4) s)"
  say "GIF: $OUT/alfavit-demo.gif ($(du -h "$OUT/alfavit-demo.gif" | cut -f1), ${width}px, ${fps} fps)"
  say "Stills: still-web.png, still-telegram.png"
  note "Next: post the MP4 in your Telegram channel, copy the post link, paste it into"
  note "docs/marketing/press-kit.md → Assets. Commit the GIF and stills (raw/ is gitignored)."
}

case "${1:-}" in
  --build) build; exit 0 ;;
  --clip)
    case "${2:-}" in
      1) record 1 "Web converter" "Chrome → https://alfavit.uz (uz), scroll to the converter, click the input box. While recording: ⌘V, wait for the result, move the mouse to 'Nusxa olish' and hold." "Ўзбекистон Республикаси Президентининг қарори" ;;
      2) record 2 "Telegram inline" "Telegram → Saved Messages, click the message box. While recording: ⌘V, wait for the result popup, click it, let the sent message sit so the 'via @alfavit_uz_bot' stamp is readable." "@alfavit_uz_bot Тошкент шаҳар ҳокимлиги" ;;
      3) maybe_update_app; record 3 "Mac live transform" "Notes → a new note; Alfavit menu-bar app running with Live transform ON. While recording, TYPE slowly (do not paste): O'zbekiston sharqida choy ichildi" "" ;;
      *) echo "usage: $0 --clip 1|2|3"; exit 1 ;;
    esac
    build; exit 0 ;;
esac

title "Alfavit demo recorder"
say "Three ~$SECS-second clips recorded from a window you select, assembled into docs/marketing/assets/."
say "Before you start: Focus mode on, site language uz, Chrome zoom 125 % if the text looks small,"
say "and make each window roughly 1280×800 so nothing is cut off."
pause

record 1 "Web converter" "Chrome → https://alfavit.uz (uz), scroll to the converter, click the input box. While recording: ⌘V, wait for the result, move the mouse to 'Nusxa olish' and hold." "Ўзбекистон Республикаси Президентининг қарори"
record 2 "Telegram inline" "Telegram → Saved Messages, click the message box. While recording: ⌘V, wait for the result popup, click it, let the sent message sit so the 'via @alfavit_uz_bot' stamp is readable." "@alfavit_uz_bot Тошкент шаҳар ҳокимлиги"
maybe_update_app
record 3 "Mac live transform" "Notes → a new note; Alfavit menu-bar app running with Live transform ON. While recording, TYPE slowly (do not paste): O'zbekiston sharqida choy ichildi" ""
build
