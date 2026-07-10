# Alfavit Web App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `@alfavit/web` (`apps/web`) — a cinematic, static, client-side React site that converts Uzbek Cyrillic / old-Latin text to the reformed new Latin using `@alfavit/engine`, with a video hero, a live converter, a three.js letter-morph showcase, and uz/ru/en i18n.

**Architecture:** Vite + React + TS + Tailwind SPA in the Turborepo. All conversion runs in-browser (engine imported directly; no backend). Components are focused and single-responsibility; tested logic (i18n, transliterate hook, converter, video-opacity math) is TDD'd; visual/3D sections get render smoke tests plus a reduced-motion static fallback.

**Tech Stack:** Vite, React 18, TypeScript (strict), Tailwind CSS, framer-motion, @react-three/fiber + @react-three/drei (lazy), Vitest + React Testing Library + jsdom.

## Global Constraints

- Package: `@alfavit/web`, private, in `apps/web`. Depends on `@alfavit/engine` via `"@alfavit/engine": "workspace:*"`. Imports `transliterate`, `detectScript`, and types from it.
- Fully static/client-side; no backend. TypeScript `strict: true`.
- Fonts: **Instrument Serif** (display: headings, logo) + **Inter** (body), imported in `src/styles/fonts.css`.
- Palette (Tailwind theme tokens): `background #FFFFFF`, `foreground #000000`, `muted #6F6F6F`.
- Logo: `Alfavit®` — `text-3xl tracking-tight`, Instrument Serif, superscript ®.
- Nav items: Convert · Reform · Developers · Telegram · Reach us. CTA "Convert now": `rounded-full px-6 py-2.5 text-sm`, bg `#000`, text `#fff`, hover `scale-[1.03]`. Nav layout: `flex justify-between px-8 py-6 max-w-7xl mx-auto`.
- Hero headline: Instrument Serif, `text-5xl sm:text-7xl md:text-8xl`, `leading-[0.95]`, `tracking-[-2.46px]`; emphasis words italic in `#6F6F6F`. Description: `text-base sm:text-lg max-w-2xl mt-8` gray. Hero CTA: `rounded-full px-14 py-5 text-base mt-12`, black/white, hover `scale-[1.03]`.
- Hero video: `top:300px`, `inset:auto 0 0 0`; fade in 0.5s at start, fade out 0.5s before end; on `ended` → opacity 0, wait 100ms, `currentTime=0`, `play()`. Overlay: `bg-gradient-to-b from-background via-transparent to-background`. Placeholder URL: `https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_083109_283f3553-e28f-428b-a723-d639c617eb2b.mp4`
- Animations (`src/styles/theme.css`): `fade-rise` opacity 0→1 + translateY 20px→0, 0.8s ease-out; `fade-rise-delay` +0.2s; `fade-rise-delay-2` +0.4s.
- Motion libs: `framer-motion` for reveals; `@react-three/fiber`+`@react-three/drei` for the 3D backdrop, **lazy-loaded + Suspense**. Honor `prefers-reduced-motion` (pause video + 3D; show static).
- i18n: zero-dependency, locales `uz | ru | en`, **chrome only** (the converter is language-agnostic). Default: detect `navigator.language`, fall back to **uz**. Persist to `localStorage` key `alfavit.locale`. Headlines per locale (see Task 2).
- Tests in `apps/web/src/tests/`. Focused test from `apps/web`: `pnpm test <file>`; full: `pnpm test`. Build: `pnpm --filter @alfavit/web build` or `pnpm turbo run build`.

---

### Task 1: Scaffold apps/web (Vite + React + TS + Tailwind + Vitest)

**Files:**
- Create: `apps/web/package.json`, `apps/web/index.html`, `apps/web/vite.config.ts`, `apps/web/tsconfig.json`, `apps/web/tailwind.config.ts`, `apps/web/postcss.config.js`
- Create: `apps/web/src/main.tsx`, `apps/web/src/App.tsx`
- Create: `apps/web/src/styles/{fonts.css,theme.css,index.css}`
- Create: `apps/web/src/test-setup.ts`, `apps/web/src/tests/smoke.test.tsx`

**Interfaces:**
- Consumes: `@alfavit/engine` (already published in-workspace).
- Produces: a working Vite/Vitest harness; `App` renders a landmark element.

- [ ] **Step 1: Create manifests and config**

`apps/web/package.json`:
```json
{
  "name": "@alfavit/web",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "@alfavit/engine": "workspace:*",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "framer-motion": "^11.0.0",
    "three": "^0.169.0",
    "@react-three/fiber": "^8.17.0",
    "@react-three/drei": "^9.114.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/three": "^0.169.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "vitest": "^2.0.0",
    "jsdom": "^25.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@testing-library/jest-dom": "^6.5.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

`apps/web/index.html`:
```html
<!doctype html>
<html lang="uz">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Alfavit — Uzbek new Latin converter</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`apps/web/vite.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
```

`apps/web/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"],
    "noEmit": true
  },
  "include": ["src"]
}
```

`apps/web/tailwind.config.ts`:
```ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { background: '#FFFFFF', foreground: '#000000', muted: '#6F6F6F' },
      fontFamily: { serif: ['"Instrument Serif"', 'serif'], sans: ['Inter', 'sans-serif'] },
    },
  },
  plugins: [],
} satisfies Config
```

`apps/web/postcss.config.js`:
```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } }
```

- [ ] **Step 2: Create styles**

`apps/web/src/styles/fonts.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&display=swap');
```

`apps/web/src/styles/theme.css`:
```css
@keyframes fade-rise {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-rise { animation: fade-rise 0.8s ease-out both; }
.animate-fade-rise-delay { animation: fade-rise 0.8s ease-out 0.2s both; }
.animate-fade-rise-delay-2 { animation: fade-rise 0.8s ease-out 0.4s both; }

@media (prefers-reduced-motion: reduce) {
  .animate-fade-rise, .animate-fade-rise-delay, .animate-fade-rise-delay-2 { animation: none; }
}
```

`apps/web/src/styles/index.css`:
```css
@import './fonts.css';
@tailwind base;
@tailwind components;
@tailwind utilities;
@import './theme.css';

body { background: #FFFFFF; color: #000000; font-family: Inter, sans-serif; }
```

- [ ] **Step 3: Create app entry + minimal App**

`apps/web/src/main.tsx`:
```tsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>,
)
```

`apps/web/src/App.tsx`:
```tsx
export default function App() {
  return <main data-testid="app-root" />
}
```

`apps/web/src/test-setup.ts`:
```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Write the failing smoke test**

`apps/web/src/tests/smoke.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from '../App'

test('App renders a main landmark', () => {
  render(<App />)
  expect(screen.getByTestId('app-root')).toBeInTheDocument()
})
```

- [ ] **Step 5: Install and run test to verify it passes**

Run from repo root: `pnpm install`
Then from `apps/web`: `pnpm test`
Expected: PASS (1 test). If `pnpm install` fails on a version not found, relax the offending caret to the nearest available minor and note it in the report.

- [ ] **Step 6: Verify build**

Run from `apps/web`: `pnpm build`
Expected: succeeds, emits `dist/`.

- [ ] **Step 7: Commit**

```bash
git add apps/web pnpm-lock.yaml
git commit -m "chore(web): scaffold @alfavit/web (Vite+React+TS+Tailwind+Vitest)"
```

---

### Task 2: i18n foundation (uz/ru/en)

**Files:**
- Create: `apps/web/src/i18n/translations.ts`, `apps/web/src/i18n/LanguageProvider.tsx`, `apps/web/src/i18n/useT.ts`
- Create: `apps/web/src/tests/i18n.test.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type Locale = 'uz' | 'ru' | 'en'`
  - `translations: Record<Locale, Record<TranslationKey, string>>` where `TranslationKey` is `keyof typeof translations.en`
  - `detectInitialLocale(): Locale` — reads `localStorage['alfavit.locale']` if valid, else `navigator.language` prefix (`uz`/`ru`/`en`), else `'uz'`
  - `<LanguageProvider>` context component
  - `useT(): { t: (key: TranslationKey) => string; locale: Locale; setLocale: (l: Locale) => void }` — `setLocale` persists to `localStorage`

- [ ] **Step 1: Write the failing test**

`apps/web/src/tests/i18n.test.tsx`:
```tsx
import { render, screen, act } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { useT } from '../i18n/useT'

function Probe() {
  const { t, locale, setLocale } = useT()
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="cta">{t('nav.cta')}</span>
      <button onClick={() => setLocale('ru')}>ru</button>
    </div>
  )
}

beforeEach(() => { localStorage.clear() })

test('defaults to uz and shows uz strings', () => {
  render(<LanguageProvider><Probe /></LanguageProvider>)
  expect(screen.getByTestId('locale')).toHaveTextContent('uz')
  expect(screen.getByTestId('cta')).toHaveTextContent('Boshlash')
})

test('setLocale switches strings and persists', () => {
  render(<LanguageProvider><Probe /></LanguageProvider>)
  act(() => { screen.getByText('ru').click() })
  expect(screen.getByTestId('locale')).toHaveTextContent('ru')
  expect(screen.getByTestId('cta')).toHaveTextContent('Начать')
  expect(localStorage.getItem('alfavit.locale')).toBe('ru')
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test src/tests/i18n.test.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement translations**

`apps/web/src/i18n/translations.ts`:
```ts
export type Locale = 'uz' | 'ru' | 'en'

export const translations = {
  en: {
    'nav.convert': 'Convert',
    'nav.reform': 'Reform',
    'nav.developers': 'Developers',
    'nav.telegram': 'Telegram',
    'nav.reach': 'Reach us',
    'nav.cta': 'Convert now',
    'hero.headlinePre': "Your words, in Uzbekistan's ",
    'hero.headlineEm': 'new alphabet.',
    'hero.desc': 'Instantly convert Uzbek text from Cyrillic or the old Latin into the reformed 2026 Latin script — free, in your browser, nothing uploaded.',
    'converter.inputLabel': 'Cyrillic or old Latin',
    'converter.outputLabel': 'New Latin',
    'converter.placeholder': 'Matn kiriting…',
    'converter.copy': 'Copy',
    'converter.copied': 'Copied',
    'converter.detected': 'Detected',
    'script.cyrillic': 'Cyrillic',
    'script.old-latin': 'Old Latin',
    'script.foreign': 'Text',
    'morph.title': 'Four letters, reformed.',
    'footer.reform': 'The reform',
    'footer.developers': 'Developers',
    'footer.telegram': 'Telegram',
    'footer.github': 'GitHub',
  },
  uz: {
    'nav.convert': 'Oʻgirish',
    'nav.reform': 'Islohot',
    'nav.developers': 'Dasturchilar',
    'nav.telegram': 'Telegram',
    'nav.reach': 'Aloqa',
    'nav.cta': 'Boshlash',
    'hero.headlinePre': 'Soʻzlaringiz — Oʻzbekistonning ',
    'hero.headlineEm': 'yangi alifbosida.',
    'hero.desc': 'Oʻzbek matnini kirill yoki eski lotindan 2026-yilgi yangilangan lotin yozuviga bir zumda oʻgiring — bepul, brauzeringizda, hech narsa yuklanmaydi.',
    'converter.inputLabel': 'Kirill yoki eski lotin',
    'converter.outputLabel': 'Yangi lotin',
    'converter.placeholder': 'Matn kiriting…',
    'converter.copy': 'Nusxa olish',
    'converter.copied': 'Nusxa olindi',
    'converter.detected': 'Aniqlandi',
    'script.cyrillic': 'Kirill',
    'script.old-latin': 'Eski lotin',
    'script.foreign': 'Matn',
    'morph.title': 'Toʻrt harf, yangilandi.',
    'footer.reform': 'Islohot',
    'footer.developers': 'Dasturchilar',
    'footer.telegram': 'Telegram',
    'footer.github': 'GitHub',
  },
  ru: {
    'nav.convert': 'Конвертер',
    'nav.reform': 'Реформа',
    'nav.developers': 'Разработчикам',
    'nav.telegram': 'Telegram',
    'nav.reach': 'Контакты',
    'nav.cta': 'Начать',
    'hero.headlinePre': 'Ваши слова — в ',
    'hero.headlineEm': 'новом алфавите',
    'hero.desc': 'Мгновенно конвертируйте узбекский текст с кириллицы или старой латиницы в реформированную латиницу 2026 года — бесплатно, в браузере, ничего не загружается.',
    'converter.inputLabel': 'Кириллица или старая латиница',
    'converter.outputLabel': 'Новая латиница',
    'converter.placeholder': 'Введите текст…',
    'converter.copy': 'Копировать',
    'converter.copied': 'Скопировано',
    'converter.detected': 'Определено',
    'script.cyrillic': 'Кириллица',
    'script.old-latin': 'Старая латиница',
    'script.foreign': 'Текст',
    'morph.title': 'Четыре буквы, реформированы.',
    'footer.reform': 'Реформа',
    'footer.developers': 'Разработчикам',
    'footer.telegram': 'Telegram',
    'footer.github': 'GitHub',
  },
} as const

export type TranslationKey = keyof typeof translations.en

const LOCALES: Locale[] = ['uz', 'ru', 'en']

export function detectInitialLocale(): Locale {
  try {
    const saved = localStorage.getItem('alfavit.locale')
    if (saved && LOCALES.includes(saved as Locale)) return saved as Locale
  } catch { /* ignore */ }
  const nav = (typeof navigator !== 'undefined' ? navigator.language : 'uz').slice(0, 2)
  return (LOCALES as string[]).includes(nav) ? (nav as Locale) : 'uz'
}
```

- [ ] **Step 4: Implement provider + hook**

`apps/web/src/i18n/LanguageProvider.tsx`:
```tsx
import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react'
import { detectInitialLocale, translations, type Locale, type TranslationKey } from './translations'

interface Ctx { t: (key: TranslationKey) => string; locale: Locale; setLocale: (l: Locale) => void }
export const LanguageContext = createContext<Ctx | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectInitialLocale)
  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    try { localStorage.setItem('alfavit.locale', l) } catch { /* ignore */ }
  }, [])
  const t = useCallback((key: TranslationKey) => translations[locale][key], [locale])
  const value = useMemo(() => ({ t, locale, setLocale }), [t, locale, setLocale])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
```

`apps/web/src/i18n/useT.ts`:
```ts
import { useContext } from 'react'
import { LanguageContext } from './LanguageProvider'

export function useT() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useT must be used within LanguageProvider')
  return ctx
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `pnpm test src/tests/i18n.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/i18n apps/web/src/tests/i18n.test.tsx
git commit -m "feat(web): zero-dep uz/ru/en i18n provider"
```

---

### Task 3: useTransliterate hook (debounced engine wrapper)

**Files:**
- Create: `apps/web/src/hooks/useTransliterate.ts`
- Create: `apps/web/src/tests/useTransliterate.test.tsx`

**Interfaces:**
- Consumes: `transliterate`, `detectScript`, `SourceScript` from `@alfavit/engine`.
- Produces: `useTransliterate(input: string, delayMs?: number): { text: string; detectedScript: SourceScript }` — returns converted text (debounced by `delayMs`, default 120) and the detected script of the current input (computed immediately, not debounced).

- [ ] **Step 1: Write the failing test**

`apps/web/src/tests/useTransliterate.test.tsx`:
```tsx
import { renderHook } from '@testing-library/react'
import { expect, test, vi, beforeEach, afterEach } from 'vitest'
import { useTransliterate } from '../hooks/useTransliterate'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

test('detects script immediately and converts after debounce', () => {
  const { result, rerender } = renderHook(({ s }) => useTransliterate(s, 100), {
    initialProps: { s: 'салом' },
  })
  expect(result.current.detectedScript).toBe('cyrillic')
  // before debounce elapses, text is still the (converted) initial value; advance timers
  vi.advanceTimersByTime(100)
  rerender({ s: 'салом' })
  expect(result.current.text).toBe('salom')
})

test('empty input yields empty output', () => {
  const { result } = renderHook(() => useTransliterate('', 100))
  expect(result.current.text).toBe('')
  expect(result.current.detectedScript).toBe('foreign')
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test src/tests/useTransliterate.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`apps/web/src/hooks/useTransliterate.ts`:
```ts
import { useEffect, useState } from 'react'
import { transliterate, detectScript, type SourceScript } from '@alfavit/engine'

export function useTransliterate(
  input: string,
  delayMs = 120,
): { text: string; detectedScript: SourceScript } {
  const [text, setText] = useState(() => transliterate(input).text)
  const detectedScript = detectScript(input)

  useEffect(() => {
    const id = setTimeout(() => setText(transliterate(input).text), delayMs)
    return () => clearTimeout(id)
  }, [input, delayMs])

  return { text, detectedScript }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm test src/tests/useTransliterate.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/hooks/useTransliterate.ts apps/web/src/tests/useTransliterate.test.tsx
git commit -m "feat(web): debounced useTransliterate hook over the engine"
```

---

### Task 4: Converter component

**Files:**
- Create: `apps/web/src/components/Converter.tsx`
- Create: `apps/web/src/tests/Converter.test.tsx`

**Interfaces:**
- Consumes: `useTransliterate` (Task 3), `useT` (Task 2).
- Produces: `<Converter />` — a `section#converter` with an input `<textarea>`, a detection badge, a read-only output area (`data-testid="output"`), and a Copy button that writes the output to `navigator.clipboard`. Must be wrapped in `<LanguageProvider>` by the caller.

- [ ] **Step 1: Write the failing test**

`apps/web/src/tests/Converter.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { Converter } from '../components/Converter'

function renderConverter() {
  return render(<LanguageProvider><Converter /></LanguageProvider>)
}

test('typing Cyrillic shows new-Latin output and detected script', async () => {
  const user = userEvent.setup()
  renderConverter()
  await user.type(screen.getByRole('textbox'), 'салом')
  expect(await screen.findByTestId('output')).toHaveTextContent('salom')
  expect(screen.getByTestId('detected-badge')).toHaveTextContent(/Cyrillic|Kirill|Кириллица/)
})

test('Copy button writes output to clipboard', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined)
  Object.assign(navigator, { clipboard: { writeText } })
  const user = userEvent.setup()
  renderConverter()
  await user.type(screen.getByRole('textbox'), 'чой')
  await screen.findByText('çoy')
  await user.click(screen.getByRole('button', { name: /Copy|Nusxa|Копировать/ }))
  expect(writeText).toHaveBeenCalledWith('çoy')
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test src/tests/Converter.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`apps/web/src/components/Converter.tsx`:
```tsx
import { useState } from 'react'
import { useTransliterate } from '../hooks/useTransliterate'
import { useT } from '../i18n/useT'
import type { TranslationKey } from '../i18n/translations'

export function Converter() {
  const { t } = useT()
  const [input, setInput] = useState('')
  const { text, detectedScript } = useTransliterate(input)
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const scriptKey = `script.${detectedScript}` as TranslationKey

  return (
    <section id="converter" className="max-w-7xl mx-auto px-6 py-24">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="text-sm text-muted">{t('converter.inputLabel')}</label>
          {input && (
            <span data-testid="detected-badge" className="ml-3 text-xs text-muted">
              {t('converter.detected')}: {t(scriptKey)}
            </span>
          )}
          <textarea
            className="mt-3 w-full h-64 rounded-2xl border border-black/10 p-4 font-sans text-lg outline-none focus:border-black/30"
            placeholder={t('converter.placeholder')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-muted">{t('converter.outputLabel')}</label>
            <button
              onClick={copy}
              className="rounded-full bg-foreground px-5 py-2 text-sm text-background transition-transform hover:scale-[1.03]"
            >
              {copied ? t('converter.copied') : t('converter.copy')}
            </button>
          </div>
          <div
            data-testid="output"
            className="mt-3 w-full h-64 overflow-auto rounded-2xl bg-black/[0.03] p-4 font-sans text-lg whitespace-pre-wrap"
          >
            {text}
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm test src/tests/Converter.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/Converter.tsx apps/web/src/tests/Converter.test.tsx
git commit -m "feat(web): live converter with detection badge and copy"
```

---

### Task 5: Nav + LanguageSwitcher

**Files:**
- Create: `apps/web/src/components/LanguageSwitcher.tsx`, `apps/web/src/components/Nav.tsx`
- Create: `apps/web/src/tests/Nav.test.tsx`

**Interfaces:**
- Consumes: `useT` (Task 2).
- Produces: `<Nav />` (logo `Alfavit®`, menu items from i18n, CTA that scrolls to `#converter`) and `<LanguageSwitcher />` (UZ · RU · EN buttons calling `setLocale`).

- [ ] **Step 1: Write the failing test**

`apps/web/src/tests/Nav.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, beforeEach } from 'vitest'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { Nav } from '../components/Nav'

beforeEach(() => localStorage.clear())

test('renders logo and localized CTA, switches language', async () => {
  const user = userEvent.setup()
  render(<LanguageProvider><Nav /></LanguageProvider>)
  expect(screen.getByText('Alfavit')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Boshlash' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'RU' }))
  expect(screen.getByRole('button', { name: 'Начать' })).toBeInTheDocument()
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test src/tests/Nav.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement LanguageSwitcher**

`apps/web/src/components/LanguageSwitcher.tsx`:
```tsx
import { useT } from '../i18n/useT'
import type { Locale } from '../i18n/translations'

const LABELS: Record<Locale, string> = { uz: 'UZ', ru: 'RU', en: 'EN' }

export function LanguageSwitcher() {
  const { locale, setLocale } = useT()
  return (
    <div className="flex gap-2 text-sm">
      {(Object.keys(LABELS) as Locale[]).map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={l === locale ? 'text-foreground' : 'text-muted'}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Implement Nav**

`apps/web/src/components/Nav.tsx`:
```tsx
import { useT } from '../i18n/useT'
import { LanguageSwitcher } from './LanguageSwitcher'
import type { TranslationKey } from '../i18n/translations'

const MENU: TranslationKey[] = ['nav.convert', 'nav.reform', 'nav.developers', 'nav.telegram', 'nav.reach']

export function Nav() {
  const { t } = useT()
  const toConverter = () => document.getElementById('converter')?.scrollIntoView({ behavior: 'smooth' })
  return (
    <nav className="relative z-10 flex items-center justify-between max-w-7xl mx-auto px-8 py-6">
      <a href="#" className="font-serif text-3xl tracking-tight text-foreground">
        Alfavit<sup className="text-base align-super">®</sup>
      </a>
      <div className="hidden md:flex items-center gap-8 font-sans text-sm">
        {MENU.map((key, i) => (
          <button key={key} onClick={i === 0 ? toConverter : undefined} className={i === 0 ? 'text-foreground' : 'text-muted transition-colors hover:text-foreground'}>
            {t(key)}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-6">
        <LanguageSwitcher />
        <button onClick={toConverter} className="rounded-full bg-foreground px-6 py-2.5 text-sm text-background transition-transform hover:scale-[1.03]">
          {t('nav.cta')}
        </button>
      </div>
    </nav>
  )
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `pnpm test src/tests/Nav.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/Nav.tsx apps/web/src/components/LanguageSwitcher.tsx apps/web/src/tests/Nav.test.tsx
git commit -m "feat(web): nav with logo, localized menu, and language switcher"
```

---

### Task 6: Hero + useVideoLoop

**Files:**
- Create: `apps/web/src/hooks/useVideoLoop.ts`
- Create: `apps/web/src/components/Hero.tsx`
- Create: `apps/web/src/tests/videoOpacity.test.ts`

**Interfaces:**
- Consumes: `useT` (Task 2), `Nav` (Task 5).
- Produces:
  - `computeVideoOpacity(currentTime: number, duration: number, fade?: number): number` — pure; fade default 0.5; returns 0→1 ramp in first `fade`s, 1 in the middle, 1→0 ramp in last `fade`s; clamped [0,1]; returns 1 if `duration` is 0/NaN.
  - `useVideoLoop(): { videoRef, opacity }` — attaches `requestAnimationFrame` monitoring and the `ended`→reset→play loop; sets `opacity` from `computeVideoOpacity`.
  - `<Hero />` — full-screen section: video background (placeholder URL, positioned per constraints) + gradient overlay + `<Nav />` + localized headline (emphasis italic gray, `animate-fade-rise`) + description (`animate-fade-rise-delay`) + CTA (`animate-fade-rise-delay-2`) scrolling to `#converter`.

- [ ] **Step 1: Write the failing test (pure opacity math)**

`apps/web/src/tests/videoOpacity.test.ts`:
```ts
import { expect, test } from 'vitest'
import { computeVideoOpacity } from '../hooks/useVideoLoop'

test('ramps in, holds, ramps out', () => {
  expect(computeVideoOpacity(0, 10, 0.5)).toBeCloseTo(0, 5)
  expect(computeVideoOpacity(0.25, 10, 0.5)).toBeCloseTo(0.5, 5)
  expect(computeVideoOpacity(5, 10, 0.5)).toBeCloseTo(1, 5)
  expect(computeVideoOpacity(9.75, 10, 0.5)).toBeCloseTo(0.5, 5)
  expect(computeVideoOpacity(10, 10, 0.5)).toBeCloseTo(0, 5)
})

test('degenerate duration returns 1', () => {
  expect(computeVideoOpacity(0, 0, 0.5)).toBe(1)
  expect(computeVideoOpacity(3, Number.NaN, 0.5)).toBe(1)
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test src/tests/videoOpacity.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the hook**

`apps/web/src/hooks/useVideoLoop.ts`:
```ts
import { useEffect, useRef, useState } from 'react'

export function computeVideoOpacity(currentTime: number, duration: number, fade = 0.5): number {
  if (!duration || Number.isNaN(duration)) return 1
  if (currentTime < fade) return Math.max(0, Math.min(1, currentTime / fade))
  const remaining = duration - currentTime
  if (remaining < fade) return Math.max(0, Math.min(1, remaining / fade))
  return 1
}

export function useVideoLoop() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    let raf = 0
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) { setOpacity(1); return }

    const tick = () => {
      setOpacity(computeVideoOpacity(video.currentTime, video.duration))
      raf = requestAnimationFrame(tick)
    }
    const onEnded = () => {
      setOpacity(0)
      setTimeout(() => { video.currentTime = 0; void video.play() }, 100)
    }
    video.addEventListener('ended', onEnded)
    void video.play().catch(() => { /* autoplay may be blocked; ignore */ })
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); video.removeEventListener('ended', onEnded) }
  }, [])

  return { videoRef, opacity }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm test src/tests/videoOpacity.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Implement Hero (no new test; covered by page smoke test in Task 8)**

`apps/web/src/components/Hero.tsx`:
```tsx
import { useT } from '../i18n/useT'
import { useVideoLoop } from '../hooks/useVideoLoop'
import { Nav } from './Nav'

const VIDEO_URL = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_083109_283f3553-e28f-428b-a723-d639c617eb2b.mp4'

export function Hero() {
  const { t } = useT()
  const { videoRef, opacity } = useVideoLoop()
  const toConverter = () => document.getElementById('converter')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-background">
      <video
        ref={videoRef}
        src={VIDEO_URL}
        muted
        playsInline
        preload="auto"
        style={{ position: 'absolute', top: '300px', inset: 'auto 0 0 0', opacity, transition: 'opacity 0.1s linear' }}
        className="z-0 w-full object-cover"
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-background via-transparent to-background" />
      <Nav />
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6" style={{ paddingTop: 'calc(8rem - 75px)', paddingBottom: '10rem' }}>
        <h1 className="animate-fade-rise font-serif font-normal text-foreground text-5xl sm:text-7xl md:text-8xl max-w-7xl leading-[0.95] tracking-[-2.46px]">
          {t('hero.headlinePre')}<em className="italic text-muted">{t('hero.headlineEm')}</em>
        </h1>
        <p className="animate-fade-rise-delay mt-8 max-w-2xl text-base sm:text-lg leading-relaxed text-muted">
          {t('hero.desc')}
        </p>
        <button onClick={toConverter} className="animate-fade-rise-delay-2 mt-12 rounded-full bg-foreground px-14 py-5 text-base text-background transition-transform hover:scale-[1.03]">
          {t('nav.cta')}
        </button>
      </div>
    </section>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/hooks/useVideoLoop.ts apps/web/src/components/Hero.tsx apps/web/src/tests/videoOpacity.test.ts
git commit -m "feat(web): hero with fade-loop video background and localized copy"
```

---

### Task 7: MorphShowcase (three.js backdrop + 2D letter morph)

**Files:**
- Create: `apps/web/src/components/MorphBackdrop.tsx` (R3F canvas; lazy-loaded)
- Create: `apps/web/src/components/MorphShowcase.tsx`
- Create: `apps/web/src/tests/MorphShowcase.test.tsx`

**Interfaces:**
- Consumes: `useT` (Task 2), `framer-motion`, `@react-three/fiber`, `@react-three/drei`.
- Produces: `<MorphShowcase />` — a section that crossfades the four reform letter pairs (`ш→ş`, `ў→ŏ`, `ч→ç`, `gʻ→ğ`) in the page fonts (foreground, framer-motion), over a lazy-loaded R3F ambient backdrop (`<MorphBackdrop />`, `React.lazy` + `Suspense`). When `prefers-reduced-motion` is set, render the pairs statically with NO canvas.

- [ ] **Step 1: Write the failing test**

`apps/web/src/tests/MorphShowcase.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { MorphShowcase } from '../components/MorphShowcase'

// jsdom has no WebGL; force the reduced-motion (static) path so no canvas mounts.
beforeEach(() => {
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: q.includes('reduce'), media: q, addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {}, onchange: null, dispatchEvent: () => false,
  }))
})

test('renders all four reform letter pairs (static, reduced-motion)', () => {
  render(<LanguageProvider><MorphShowcase /></LanguageProvider>)
  for (const glyph of ['ş', 'ŏ', 'ç', 'ğ']) {
    expect(screen.getByText(glyph)).toBeInTheDocument()
  }
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test src/tests/MorphShowcase.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the R3F backdrop**

`apps/web/src/components/MorphBackdrop.tsx`:
```tsx
import { Canvas, useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import { useRef } from 'react'
import type { Mesh } from 'three'

function Spinner() {
  const ref = useRef<Mesh>(null)
  useFrame((_, delta) => { if (ref.current) ref.current.rotation.y += delta * 0.2 })
  return (
    <Float speed={1.2} rotationIntensity={0.6} floatIntensity={0.8}>
      <mesh ref={ref}>
        <torusKnotGeometry args={[1, 0.28, 128, 32]} />
        <meshStandardMaterial color="#000000" roughness={0.5} metalness={0.1} />
      </mesh>
    </Float>
  )
}

export default function MorphBackdrop() {
  return (
    <Canvas className="!absolute inset-0" camera={{ position: [0, 0, 5] }} dpr={[1, 1.5]}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 3, 3]} intensity={0.6} />
      <Spinner />
    </Canvas>
  )
}
```

- [ ] **Step 4: Implement MorphShowcase**

`apps/web/src/components/MorphShowcase.tsx`:
```tsx
import { Suspense, lazy, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useT } from '../i18n/useT'

const MorphBackdrop = lazy(() => import('./MorphBackdrop'))

const PAIRS: Array<[string, string]> = [['ш', 'ş'], ['ў', 'ŏ'], ['ч', 'ç'], ['gʻ', 'ğ']]

function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false)
  useEffect(() => { setReduce(!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) }, [])
  return reduce
}

function MorphPair({ from, to, reduce }: { from: string; to: string; reduce: boolean }) {
  const [showTo, setShowTo] = useState(false)
  useEffect(() => {
    if (reduce) { setShowTo(true); return }
    const id = setInterval(() => setShowTo((s) => !s), 1800)
    return () => clearInterval(id)
  }, [reduce])
  return (
    <div className="relative flex h-40 w-40 items-center justify-center font-serif text-8xl">
      {reduce ? (
        <span>{to}</span>
      ) : (
        <AnimatePresence mode="wait">
          <motion.span
            key={showTo ? to : from}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5 }}
            className={showTo ? 'text-foreground' : 'text-muted'}
          >
            {showTo ? to : from}
          </motion.span>
        </AnimatePresence>
      )}
    </div>
  )
}

export function MorphShowcase() {
  const { t } = useT()
  const reduce = usePrefersReducedMotion()
  return (
    <section className="relative min-h-screen overflow-hidden bg-background">
      {!reduce && (
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <Suspense fallback={null}><MorphBackdrop /></Suspense>
        </div>
      )}
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-24 text-center">
        <h2 className="font-serif text-4xl sm:text-6xl text-foreground">{t('morph.title')}</h2>
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8">
          {PAIRS.map(([from, to]) => <MorphPair key={to} from={from} to={to} reduce={reduce} />)}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `pnpm test src/tests/MorphShowcase.test.tsx`
Expected: PASS (1 test — static path renders all four Latin glyphs).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/MorphBackdrop.tsx apps/web/src/components/MorphShowcase.tsx apps/web/src/tests/MorphShowcase.test.tsx
git commit -m "feat(web): letter-morph showcase with lazy R3F backdrop"
```

---

### Task 8: Footer + assemble App + full-page smoke test

**Files:**
- Create: `apps/web/src/components/Footer.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/tests/smoke.test.tsx`

**Interfaces:**
- Consumes: `LanguageProvider` (Task 2), `Hero` (Task 6), `Converter` (Task 4), `MorphShowcase` (Task 7), `Footer` (this task), `useT` (Task 2).
- Produces: `<Footer />` (localized links: reform, developers, telegram, github) and the assembled `<App />` wrapping all sections in `<LanguageProvider>`.

- [ ] **Step 1: Update the smoke test to assert the full page**

Replace `apps/web/src/tests/smoke.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { expect, test, vi, beforeEach } from 'vitest'
import App from '../App'

// Force reduced-motion so no WebGL canvas mounts under jsdom.
beforeEach(() => {
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: q.includes('reduce'), media: q, addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {}, onchange: null, dispatchEvent: () => false,
  }))
})

test('full page renders hero, converter, and footer without crashing', () => {
  render(<App />)
  expect(screen.getByText('Alfavit')).toBeInTheDocument()          // hero/nav
  expect(document.getElementById('converter')).toBeInTheDocument() // converter
  expect(screen.getByRole('contentinfo')).toBeInTheDocument()      // footer
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test src/tests/smoke.test.tsx`
Expected: FAIL — `App` still renders only the placeholder; `Footer`/`converter` absent.

- [ ] **Step 3: Implement Footer**

`apps/web/src/components/Footer.tsx`:
```tsx
import { useT } from '../i18n/useT'

export function Footer() {
  const { t } = useT()
  const links = [
    { key: 'footer.reform' as const, href: '#' },
    { key: 'footer.developers' as const, href: '#' },
    { key: 'footer.telegram' as const, href: 'https://t.me/' },
    { key: 'footer.github' as const, href: 'https://github.com/' },
  ]
  return (
    <footer className="border-t border-black/10 bg-background">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-8 py-10 sm:flex-row">
        <span className="font-serif text-2xl text-foreground">Alfavit<sup className="text-sm align-super">®</sup></span>
        <nav className="flex gap-6 font-sans text-sm text-muted">
          {links.map((l) => (
            <a key={l.key} href={l.href} className="transition-colors hover:text-foreground">{t(l.key)}</a>
          ))}
        </nav>
      </div>
    </footer>
  )
}
```

- [ ] **Step 4: Assemble App**

Replace `apps/web/src/App.tsx`:
```tsx
import { LanguageProvider } from './i18n/LanguageProvider'
import { Hero } from './components/Hero'
import { Converter } from './components/Converter'
import { MorphShowcase } from './components/MorphShowcase'
import { Footer } from './components/Footer'

export default function App() {
  return (
    <LanguageProvider>
      <Hero />
      <Converter />
      <MorphShowcase />
      <Footer />
    </LanguageProvider>
  )
}
```

- [ ] **Step 5: Run full suite + build**

Run from `apps/web`: `pnpm test`
Expected: ALL tests pass (smoke + i18n + useTransliterate + Converter + Nav + videoOpacity + MorphShowcase).
Then from repo root: `pnpm turbo run build`
Expected: engine builds first, then `@alfavit/web` builds to `apps/web/dist/`.

If the build fails on a type error in the video `style` object or R3F intrinsic elements, fix the types (do not `@ts-ignore` without a one-line reason). Report any assertion you had to change.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/Footer.tsx apps/web/src/App.tsx apps/web/src/tests/smoke.test.tsx
git commit -m "feat(web): footer and assembled single-page app"
```

---

## Self-Review Notes

- **Spec coverage:** stack/static (Task 1); i18n uz/ru/en + default uz + persistence (Task 2); engine wiring (Task 3); converter + detection badge + copy (Task 4); nav/logo/CTA/switcher (Task 5); hero video fade-loop + localized copy + fade-rise (Task 6); three.js morph showcase + reduced-motion fallback (Task 7); footer + assembly + page smoke (Task 8). Out-of-scope items (ambiguity UI, file mode, accounts/SSR, branded video) correctly excluded.
- **prefers-reduced-motion:** handled in `useVideoLoop` (Task 6) and `MorphShowcase` (Task 7); tests force the reduced path so jsdom never touches WebGL.
- **Type consistency:** `useTransliterate(input, delayMs?) → {text, detectedScript}`; `useT() → {t, locale, setLocale}`; `TranslationKey`/`Locale` from `translations.ts`; `computeVideoOpacity(currentTime, duration, fade?)` used identically across tasks.
- **Placeholder scan:** video URL is the spec-mandated placeholder (documented); footer hrefs are `#`/root placeholders pending real destinations — acceptable for v1 chrome, not logic gaps.
