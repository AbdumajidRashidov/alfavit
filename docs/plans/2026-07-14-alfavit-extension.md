# Alfavit Browser Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `@alfavit/extension` — a Manifest V3 Chrome/Edge extension that converts selected Uzbek text (Cyrillic / old-Latin) to the new Latin via a right-click menu, plus a toolbar popup mini-converter, bundling `@alfavit/engine`.

**Architecture:** A service worker holds the engine and, on a context-menu click, converts the selection and injects a self-contained function that either replaces the selection in an editable field or copies it with a toast. A vanilla-TS popup reuses the same `toNewLatin` core. esbuild bundles entries to a loadable `dist/`.

**Tech Stack:** TypeScript (strict), esbuild, `@alfavit/engine`, `@types/chrome`, Vitest.

## Global Constraints

- Package `@alfavit/extension` in `apps/extension`; depends on `@alfavit/engine` via `workspace:*`. Strict TS, ESM.
- Manifest V3; `permissions: ["contextMenus", "scripting", "activeTab"]` (no host permissions). Service worker `type: "module"`.
- All conversion is `@alfavit/engine` (`toNewLatin(text) = transliterate(text).text`); client-side, offline, private. Only a converted string is injected into the page (engine never runs in the page).
- Context menu title "Convert to new Latin", `contexts: ["selection"]`. Editable field → replace in place; read-only → clipboard + toast "Copied — new Latin".
- Not auto-deployed (Chrome Web Store is a manual submit); CI just builds + tests (turbo picks up the package's `test`/`build`).
- TDD on the pure core; the browser-API glue is build-verified + manually loaded (it can't run under Vitest).

---

### Task 1: Scaffold apps/extension + tested conversion core

**Files:**
- Create: `apps/extension/package.json`, `apps/extension/tsconfig.json`, `apps/extension/vitest.config.ts`
- Create: `apps/extension/src/convert.ts`, `apps/extension/src/tests/convert.test.ts`

**Interfaces:**
- Consumes: `transliterate` from `@alfavit/engine`.
- Produces: `toNewLatin(text: string): string` — `transliterate(text).text`.

- [ ] **Step 1: Manifests**

`apps/extension/package.json`:
```json
{
  "name": "@alfavit/extension",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "node build.mjs && tsc -p tsconfig.json",
    "test": "vitest run"
  },
  "dependencies": {
    "@alfavit/engine": "workspace:*"
  },
  "devDependencies": {
    "@types/chrome": "^0.0.270",
    "esbuild": "^0.24.0",
    "typescript": "^5.5.0",
    "vitest": "^2.0.0"
  }
}
```

`apps/extension/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "noEmit": true,
    "types": ["chrome"],
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

`apps/extension/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { include: ['src/**/*.test.ts'] } })
```

- [ ] **Step 2: Write the failing test**

`apps/extension/src/tests/convert.test.ts`:
```ts
import { expect, test } from 'vitest'
import { toNewLatin } from '../convert'

test('toNewLatin converts Cyrillic and old-Latin', () => {
  expect(toNewLatin('салом дунё')).toBe('salom dunyo')
  expect(toNewLatin("o'zbek")).toBe('ŏzbek')
  expect(toNewLatin('Ўзбекча: шаҳар, чой')).toBe('Ŏzbekça: şahar, çoy')
})
```

- [ ] **Step 3: Run to verify it fails**

Run from repo root: `pnpm install`
Then from `apps/extension`: `pnpm test`
Expected: FAIL — `../convert` not found.

- [ ] **Step 4: Implement**

`apps/extension/src/convert.ts`:
```ts
import { transliterate } from '@alfavit/engine'

export function toNewLatin(text: string): string {
  return transliterate(text).text
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `pnpm test`
Expected: PASS (1 test).

- [ ] **Step 6: Commit**

```bash
git add apps/extension pnpm-lock.yaml
git commit -m "chore(extension): scaffold @alfavit/extension + tested conversion core"
```

---

### Task 2: Manifest, icons, build, and the extension glue

**Files:**
- Create: `apps/extension/manifest.json`, `apps/extension/build.mjs`, `apps/extension/README.md`
- Create: `apps/extension/public/popup.html`, `apps/extension/public/icons/{16,48,128}.png`
- Create: `apps/extension/src/inject.ts`, `apps/extension/src/background.ts`, `apps/extension/src/popup.ts`

**Interfaces:**
- Consumes: `toNewLatin` (Task 1); Chrome extension APIs.
- Produces: a `dist/` loadable as an unpacked MV3 extension.

- [ ] **Step 1: manifest.json**

`apps/extension/manifest.json`:
```json
{
  "manifest_version": 3,
  "name": "Alfavit — new Uzbek Latin",
  "description": "Convert Uzbek text from Cyrillic or old Latin to the reformed new Latin, right in your browser.",
  "version": "0.1.0",
  "permissions": ["contextMenus", "scripting", "activeTab"],
  "background": { "service_worker": "background.js", "type": "module" },
  "action": {
    "default_popup": "popup.html",
    "default_icon": { "16": "icons/16.png", "48": "icons/48.png", "128": "icons/128.png" }
  },
  "icons": { "16": "icons/16.png", "48": "icons/48.png", "128": "icons/128.png" }
}
```

- [ ] **Step 2: Generate icons from an "A" monogram**

The web logo is a wordmark (illegible at 16px), so generate a simple monogram. Run from `apps/extension`:
```bash
mkdir -p public/icons
cat > /tmp/alfavit-icon.svg <<'SVG'
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <rect width="128" height="128" rx="28" fill="#0B0B0B"/>
  <text x="64" y="95" text-anchor="middle" font-family="Georgia, serif" font-size="88" fill="#F4EFE6">A</text>
</svg>
SVG
qlmanage -t -s 128 -o /tmp /tmp/alfavit-icon.svg >/dev/null 2>&1
sips -z 128 128 /tmp/alfavit-icon.svg.png --out public/icons/128.png >/dev/null
sips -z 48 48   /tmp/alfavit-icon.svg.png --out public/icons/48.png  >/dev/null
sips -z 16 16   /tmp/alfavit-icon.svg.png --out public/icons/16.png  >/dev/null
ls public/icons
```
Expected: `16.png 48.png 128.png`. (If `qlmanage` is unavailable, any 3 square PNGs at those sizes work — note it.)

- [ ] **Step 3: public/popup.html**

`apps/extension/public/popup.html`:
```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { width: 320px; margin: 0; padding: 14px; font: 14px system-ui, sans-serif; background: #fff; color: #000; }
      h1 { font: 600 15px system-ui; margin: 0 0 10px; }
      textarea, .out { width: 100%; box-sizing: border-box; border: 1px solid rgba(0,0,0,.15); border-radius: 10px; padding: 8px; font: 14px system-ui; }
      .out { min-height: 60px; background: rgba(0,0,0,.03); white-space: pre-wrap; margin-top: 8px; }
      button { margin-top: 8px; border: 0; border-radius: 999px; background: #000; color: #fff; padding: 8px 14px; font: 14px system-ui; cursor: pointer; }
    </style>
  </head>
  <body>
    <h1>Alfavit — new Latin</h1>
    <textarea id="in" rows="3" placeholder="Matn kiriting…"></textarea>
    <div id="out" class="out"></div>
    <button id="copy">Copy</button>
    <script type="module" src="popup.js"></script>
  </body>
</html>
```

- [ ] **Step 4: inject.ts (self-contained page function)**

`apps/extension/src/inject.ts`:
```ts
// Injected into the page via chrome.scripting.executeScript. MUST be
// self-contained: no imports, no references to module-scope bindings — only
// its argument and page globals (document, navigator).
export function applyConversion(converted: string): void {
  const el = document.activeElement as HTMLElement | null
  const tag = el?.tagName
  if (el && (tag === 'INPUT' || tag === 'TEXTAREA')) {
    const field = el as HTMLInputElement | HTMLTextAreaElement
    const start = field.selectionStart ?? field.value.length
    const end = field.selectionEnd ?? field.value.length
    field.value = field.value.slice(0, start) + converted + field.value.slice(end)
    field.selectionStart = field.selectionEnd = start + converted.length
    field.dispatchEvent(new Event('input', { bubbles: true }))
    return
  }
  if (el && el.isContentEditable) {
    document.execCommand('insertText', false, converted)
    return
  }
  void navigator.clipboard.writeText(converted).catch(() => {})
  const toast = document.createElement('div')
  toast.textContent = 'Copied — new Latin'
  toast.style.cssText =
    'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#000;color:#fff;padding:10px 16px;border-radius:999px;font:14px sans-serif;z-index:2147483647;opacity:.95'
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 1800)
}
```

- [ ] **Step 5: background.ts (service worker)**

`apps/extension/src/background.ts`:
```ts
import { toNewLatin } from './convert'
import { applyConversion } from './inject'

const MENU_ID = 'alfavit-convert'

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: 'Convert to new Latin',
    contexts: ['selection'],
  })
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_ID || !tab?.id || !info.selectionText) return
  const converted = toNewLatin(info.selectionText)
  void chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: applyConversion,
    args: [converted],
  })
})
```

- [ ] **Step 6: popup.ts**

`apps/extension/src/popup.ts`:
```ts
import { toNewLatin } from './convert'

const input = document.getElementById('in') as HTMLTextAreaElement
const out = document.getElementById('out') as HTMLDivElement
const copy = document.getElementById('copy') as HTMLButtonElement

const render = () => {
  out.textContent = toNewLatin(input.value)
}
input.addEventListener('input', render)
copy.addEventListener('click', () => {
  void navigator.clipboard.writeText(out.textContent ?? '')
  copy.textContent = 'Copied'
  setTimeout(() => (copy.textContent = 'Copy'), 1200)
})
render()
```

- [ ] **Step 7: build.mjs**

`apps/extension/build.mjs`:
```js
import { build } from 'esbuild'
import { cpSync, mkdirSync, rmSync } from 'node:fs'

rmSync('dist', { recursive: true, force: true })
mkdirSync('dist', { recursive: true })

await build({
  entryPoints: ['src/background.ts', 'src/popup.ts'],
  bundle: true,
  format: 'esm',
  target: 'es2022',
  outdir: 'dist',
})

cpSync('manifest.json', 'dist/manifest.json')
cpSync('public/popup.html', 'dist/popup.html')
cpSync('public/icons', 'dist/icons', { recursive: true })
console.log('Built Alfavit extension → dist/')
```

- [ ] **Step 8: README.md (load-unpacked instructions)**

`apps/extension/README.md`:
```markdown
# @alfavit/extension

Convert Uzbek text (Cyrillic / old Latin) to the reformed new Latin, in the browser.

## Develop / try it
```
pnpm --filter @alfavit/extension build
```
Then in Chrome/Edge: `chrome://extensions` → enable **Developer mode** → **Load unpacked** →
select `apps/extension/dist`.

- Select Uzbek text on any page → right-click → **Convert to new Latin** (replaces it in
  editable fields; copies it elsewhere).
- Click the toolbar icon for the popup converter.

All conversion runs locally via `@alfavit/engine` — nothing is uploaded.
```

- [ ] **Step 9: Build and verify the output**

Run from repo root (ensures the engine is built first): `pnpm turbo run build --filter=@alfavit/extension`
Then verify the artifacts exist:
```bash
ls apps/extension/dist        # → background.js popup.js manifest.json popup.html icons
ls apps/extension/dist/icons  # → 16.png 48.png 128.png
```
Expected: all present; `tsc` type-check clean. Also run `pnpm -C apps/extension test` → the Task 1 core test still passes.

- [ ] **Step 10: Commit**

```bash
git add apps/extension
git commit -m "feat(extension): MV3 context-menu convert + popup, esbuild build, icons"
```

---

## Self-Review Notes

- **Spec coverage:** tested core (Task 1); manifest + minimal perms, context-menu convert with editable-replace/copy-toast (inject.ts + background.ts), popup converter, esbuild build to loadable dist, icons, README load steps (Task 2). Deploy correctly excluded (manual Web Store); CI auto-covers via turbo `test`/`build`.
- **Placeholder scan:** none — all steps carry real code/commands. Icon step has a documented fallback.
- **Type consistency:** `toNewLatin(string)→string`, `applyConversion(converted: string): void`, `MENU_ID` constant used consistently; manifest entry filenames (`background.js`, `popup.js`, `popup.html`, `icons/*`) match the build outputs.
- **Injected-function caveat:** `applyConversion` is passed to `chrome.scripting.executeScript({ func })`, which serializes it — it references only its arg + page globals, so it stays valid after bundling. Documented in the file.
