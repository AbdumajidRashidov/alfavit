# Website Desktop Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Announce the macOS desktop app on alfavit.uz — flip the "macOS" channel card from "Coming soon" to a live **Download** (a universal `.dmg` hosted on the site), with a "New" badge, a system-wide live-transform description, and an unsigned-app note, in uz/ru/en.

**Architecture:** Merge the finished desktop app to `main`, build a universal `.dmg`, and host it as a static asset under `apps/web/public/download/`. Extend the existing data-driven `Channels` component with optional per-card fields (`download`, `descKey`, `noteKey`, `badge`) so only the macOS card changes; add the copy as i18n keys in all three locales.

**Tech Stack:** React + Vite + Tailwind + react-router (apps/web), vite-react-ssg, Vitest; Tauri v2 universal build (apps/desktop); Cloudflare Pages static hosting.

## Global Constraints

- Repo is **private** → the `.dmg` is hosted on the site (`apps/web/public/download/Alfavit.dmg`, served at `https://alfavit.uz/download/Alfavit.dmg`), **not** a GitHub Release. Stable filename; replaced per release.
- The hosted `.dmg` is a **universal** build (Intel `x86_64` + Apple Silicon `aarch64`).
- Conversion/engine unchanged. No new route → sitemap/JSON-LD unchanged.
- **Uzbek UI copy uses current official Latin** (the turned-comma `oʻ`/`gʻ`, digraphs `sh`/`ch`) — matching the existing site UI (e.g. "Oʻgirish"), NOT reformed new-Latin.
- **uz/ru copy requires native-speaker (user) verification before merge** — the drafts below are starting points.
- No emojis anywhere. Commits authored `git -c user.name="Alfavit" -c user.email="abdumajid.r@iman.uz" commit -m "…"` ending with the trailer `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

## File Structure

```
apps/web/
  public/download/Alfavit.dmg        # Create: the hosted universal dmg (~6 MB binary)
  src/components/Channels.tsx        # Modify: card model + macOS live download + badge/desc/note
  src/i18n/translations.ts           # Modify: add 4 keys x 3 locales
  src/tests/Channels.test.tsx        # Modify: assert macOS is a live Download + badge/desc; 4 "Coming soon"
```

---

### Task 1: Merge desktop app, build the universal `.dmg`, host it

Ops task (no unit test). The deliverable is a universal `.dmg` present at the web public path, on a fresh web branch off an updated `main`.

**Files:**
- Create: `apps/web/public/download/Alfavit.dmg`

**Interfaces:**
- Consumes: the `desktop-live-transform` branch (finished, reviewed desktop app).
- Produces: `main` contains the desktop app; a new branch `web-desktop-download`; the hosted `apps/web/public/download/Alfavit.dmg` (universal).

- [ ] **Step 1: Merge the desktop branch into `main`**

```bash
cd /Users/abdumajidrashidov/Desktop/alfavit
git checkout main
git -c user.name="Alfavit" -c user.email="abdumajid.r@iman.uz" merge --no-ff desktop-live-transform -m "Merge desktop-live-transform: system-wide live transform (Phase 2)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```
Expected: fast, clean merge (no conflicts — the branch is linear ahead of `main`). `git log --oneline -1` shows the merge commit.

- [ ] **Step 2: Create the web work branch**

```bash
git checkout -b web-desktop-download
```

- [ ] **Step 3: Add the Intel Rust target (once)**

Run: `rustup target add x86_64-apple-darwin`
Expected: "installed" (or "up to date" if already present). (aarch64 is already installed from prior builds.)

- [ ] **Step 4: Build the universal `.dmg`**

Run: `pnpm --dir apps/desktop tauri build --target universal-apple-darwin`
Expected: builds both arches and bundles `apps/desktop/src-tauri/target/universal-apple-darwin/release/bundle/dmg/Alfavit_0.2.0_universal.dmg`.
If `bundle_dmg.sh` fails with a mount error, eject stale volumes and retry:
```bash
for v in $(find /Volumes -maxdepth 1 \( -name 'Alfavit*' -o -name 'dmg.*' \)); do diskutil eject "$v"; done
find apps/desktop/src-tauri/target -name 'rw.*.dmg' -delete
pnpm --dir apps/desktop tauri build --target universal-apple-darwin
```

- [ ] **Step 5: Verify the binary is universal**

Run: `lipo -archs apps/desktop/src-tauri/target/universal-apple-darwin/release/alfavit-desktop`
Expected: `x86_64 arm64`.

- [ ] **Step 6: Host it under the web public dir (stable filename)**

```bash
mkdir -p apps/web/public/download
cp apps/desktop/src-tauri/target/universal-apple-darwin/release/bundle/dmg/Alfavit_0.2.0_universal.dmg apps/web/public/download/Alfavit.dmg
ls -lh apps/web/public/download/Alfavit.dmg
```
Expected: `Alfavit.dmg` present (~6 MB).

- [ ] **Step 7: Commit the hosted dmg**

```bash
git add apps/web/public/download/Alfavit.dmg
git -c user.name="Alfavit" -c user.email="abdumajid.r@iman.uz" commit -m "chore(web): host universal macOS .dmg for download

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: macOS channel card → live Download + feature highlight

**Files:**
- Modify: `apps/web/src/i18n/translations.ts` (add 4 keys to each of `en`, `uz`, `ru`)
- Modify: `apps/web/src/components/Channels.tsx` (card model + macOS card + rendering)
- Modify: `apps/web/src/tests/Channels.test.tsx` (update assertions)

**Interfaces:**
- Consumes: the hosted `/download/Alfavit.dmg` (Task 1); existing `TranslationKey` type (`keyof typeof translations.en`), `useT`, `useLocalePath`, `Reveal`, icon components.
- Produces: a live macOS Download card. New translation keys: `channels.download`, `channels.mac.desc`, `channels.mac.note`, `channels.badge.new`.

- [ ] **Step 1: Update the test to the new expectations (RED) — replace `apps/web/src/tests/Channels.test.tsx`**

```tsx
import { screen } from '@testing-library/react'
import { expect, test, beforeEach } from 'vitest'
import { renderWithLocale } from './renderApp'
import { Channels } from '../components/Channels'

beforeEach(() => {
  localStorage.clear()
  Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true })
})

test('renders groups, platforms, and CTAs with macOS live for download', () => {
  renderWithLocale(<Channels />, '/en')
  for (const label of ['Desktop', 'Mobile', 'More ways']) {
    expect(screen.getByText(label)).toBeInTheDocument()
  }
  for (const name of ['macOS', 'Windows', 'iOS', 'Android', 'Web app', 'Telegram bot', 'Browser extension', 'API & SDK']) {
    expect(screen.getByText(name)).toBeInTheDocument()
  }
  // macOS is now live: a Download link to the hosted universal dmg.
  const dl = screen.getByRole('link', { name: 'Download' })
  expect(dl).toHaveAttribute('href', '/download/Alfavit.dmg')
  // macOS shows the New badge + the live-transform description.
  expect(screen.getByText('New')).toBeInTheDocument()
  expect(screen.getByText(/converts to new-Latin/i)).toBeInTheDocument()
  // Three "Open" links remain: Web (/en), Telegram (external), API (/en/developers).
  const openHrefs = screen.getAllByRole('link', { name: 'Open' }).map((a) => a.getAttribute('href'))
  expect(openHrefs).toContain('/en')
  expect(openHrefs).toContain('https://t.me/alfavit_uz_bot')
  expect(openHrefs).toContain('/en/developers')
  // Four remain Coming soon: Windows, iOS, Android, extension.
  expect(screen.getAllByText('Coming soon')).toHaveLength(4)
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --dir apps/web test Channels`
Expected: FAIL — no "Download" link yet; macOS still "Coming soon" (5, not 4); no "New"/description.

- [ ] **Step 3: Add the i18n keys — edit `apps/web/src/i18n/translations.ts`**

In the `en` block, immediately after the `'channels.open': 'Open',` line, add:
```ts
    'channels.download': 'Download',
    'channels.mac.desc': 'Type anywhere — Uzbek Cyrillic or old-Latin converts to new-Latin as you go.',
    'channels.mac.note': 'Unsigned — on first open, right-click the app and choose Open.',
    'channels.badge.new': 'New',
```

In the `uz` block, immediately after its `'channels.open': 'Ochish',` line, add (current official Latin; user verifies):
```ts
    'channels.download': 'Yuklab olish',
    'channels.mac.desc': 'Istalgan ilovada yozing — kirill yoki eski lotin yozuvingiz shu zahoti yangi lotinga oʻgiriladi.',
    'channels.mac.note': 'Imzosiz — ilk ochishda ilovani sichqonchaning oʻng tugmasi bilan bosib, «Open» ni tanlang.',
    'channels.badge.new': 'Yangi',
```

In the `ru` block, immediately after its `'channels.open': 'Открыть',` line, add (user verifies):
```ts
    'channels.download': 'Скачать',
    'channels.mac.desc': 'Печатайте где угодно — кириллица или старая латиница сразу превращается в новую латиницу.',
    'channels.mac.note': 'Без подписи — при первом запуске щёлкните приложение правой кнопкой и выберите «Открыть».',
    'channels.badge.new': 'Новое',
```

- [ ] **Step 4: Update the component — replace `apps/web/src/components/Channels.tsx`**

```tsx
import type { ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useT } from '../i18n/useT'
import { useLocalePath } from '../i18n/useLocalePath'
import { Reveal } from './Reveal'
import type { TranslationKey } from '../i18n/translations'
import { AppleIcon, WindowsIcon, AndroidIcon, GlobeIcon, TelegramIcon, PuzzleIcon, CodeIcon } from './icons'

interface Item {
  nameKey: TranslationKey
  Icon: ComponentType<{ className?: string }>
  live?: boolean
  href?: string
  download?: boolean
  descKey?: TranslationKey
  noteKey?: TranslationKey
  badge?: 'new'
}
interface Group { labelKey: TranslationKey; items: Item[] }

const GROUPS: Group[] = [
  {
    labelKey: 'channels.group.desktop',
    items: [
      {
        nameKey: 'channels.mac.name',
        Icon: AppleIcon,
        live: true,
        href: '/download/Alfavit.dmg',
        download: true,
        descKey: 'channels.mac.desc',
        noteKey: 'channels.mac.note',
        badge: 'new',
      },
      { nameKey: 'channels.windows.name', Icon: WindowsIcon },
    ],
  },
  {
    labelKey: 'channels.group.mobile',
    items: [
      { nameKey: 'channels.ios.name', Icon: AppleIcon },
      { nameKey: 'channels.android.name', Icon: AndroidIcon },
    ],
  },
  {
    labelKey: 'channels.group.more',
    items: [
      { nameKey: 'channels.web.name', Icon: GlobeIcon, live: true, href: '/' },
      { nameKey: 'channels.telegram.name', Icon: TelegramIcon, live: true, href: 'https://t.me/alfavit_uz_bot' },
      { nameKey: 'channels.extension.name', Icon: PuzzleIcon },
      { nameKey: 'channels.api.name', Icon: CodeIcon, live: true, href: '/developers' },
    ],
  },
]

const BTN = 'shrink-0 rounded-full bg-foreground px-5 py-2 text-sm text-background transition-transform hover:scale-[1.03]'

export function Channels() {
  const { t } = useT()
  const lp = useLocalePath()

  return (
    <section id="channels" className="bg-background">
      <div className="mx-auto max-w-5xl px-6 py-24">
        <Reveal>
          <h2 className="text-center font-serif text-4xl sm:text-6xl text-foreground">{t('channels.title')}</h2>
          <p className="mt-4 text-center text-base text-muted">{t('channels.subtitle')}</p>
        </Reveal>

        <div className="mt-16 space-y-12">
          {GROUPS.map((group) => (
            <div key={group.labelKey}>
              <h3 className="text-sm font-medium uppercase tracking-wider text-muted">{t(group.labelKey)}</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {group.items.map((item, i) => (
                  <motion.div
                    key={item.nameKey}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-black/10 p-5 transition-colors hover:border-black/25"
                  >
                    <div className="flex items-start gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black/[0.04] text-foreground">
                        <item.Icon className="h-6 w-6" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{t(item.nameKey)}</span>
                          {item.badge === 'new' && (
                            <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-xs font-medium text-foreground">
                              {t('channels.badge.new')}
                            </span>
                          )}
                        </div>
                        {item.descKey && <p className="mt-1 text-sm text-muted">{t(item.descKey)}</p>}
                        {item.noteKey && <p className="mt-1 text-xs text-muted/80">{t(item.noteKey)}</p>}
                      </div>
                    </div>
                    {!item.live || !item.href ? (
                      <span className="shrink-0 text-sm text-muted">{t('status.soon')}</span>
                    ) : item.download ? (
                      <a href={item.href} download className={BTN}>{t('channels.download')}</a>
                    ) : item.href.startsWith('/') ? (
                      <Link to={lp(item.href)} className={BTN}>{t('channels.open')}</Link>
                    ) : (
                      <a href={item.href} target="_blank" rel="noopener noreferrer" className={BTN}>{t('channels.open')}</a>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --dir apps/web test Channels`
Expected: PASS. Then run the full web suite: `pnpm --dir apps/web test` — all green.

- [ ] **Step 6: Verify in the browser preview (assistant)**

Start the web dev server (`apps/web`, port 5173) and open `/en` (or `/apps`). Confirm the macOS card shows: the **Download** button, a **New** pill, the live-transform description, and the unsigned note; other cards unchanged (Windows/iOS/Android/extension "Coming soon"). Confirm the Download link's href is `/download/Alfavit.dmg` (via read_page) and that the static file resolves (Vite serves `public/`). Take a screenshot. Check `read_console_messages` for errors (expect none). Check dark mode via `resize_window` colorScheme dark.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/i18n/translations.ts apps/web/src/components/Channels.tsx apps/web/src/tests/Channels.test.tsx
git -c user.name="Alfavit" -c user.email="abdumajid.r@iman.uz" commit -m "feat(web): macOS channel live download + live-transform highlight

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Go-live (after both tasks + user sign-off)

Not a task — the deploy trigger, run once the user approves the uz/ru copy:
- Merge `web-desktop-download` → `main` and `git push origin main`. Cloudflare Pages auto-deploys `apps/web`, publishing the card + the `/download/Alfavit.dmg`.
- (Optional, separate) push a `desktop-v0.2.0` tag if a GitHub Release is also wanted later.

## Self-Review

**Spec coverage:**
- Host universal `.dmg` on the site → Task 1 (Steps 4-7). ✓
- macOS card → live Download → Task 2 (component + test). ✓
- "New" badge + live-transform description + unsigned note, uz/ru/en → Task 2 (Step 3 i18n + Step 4 rendering). ✓
- Data-driven card fields (`download`/`descKey`/`noteKey`/`badge`); Windows/others unchanged → Task 2 Step 4. ✓
- Prereqs (merge desktop, universal build) → Task 1. ✓
- No new route → sitemap/SEO unchanged (no task needed). ✓ (The optional `/apps` meta tweak is deferred per spec — omitted to avoid guessing existing copy.)
- Native-speaker uz/ru verification before merge → Global Constraints + go-live gate. ✓

**Placeholder scan:** No TBD/TODO; all code and copy are concrete (uz/ru are real drafts flagged for verification, not placeholders).

**Type consistency:** New keys added to `en` extend `TranslationKey` and are added to `uz`/`ru` too; `Item` fields (`download`, `descKey`, `noteKey`, `badge`) are defined in Step 4 and used consistently; the test's `name: 'Download'` matches `channels.download` = "Download"; href `/download/Alfavit.dmg` matches the macOS item and Task 1's file path.
