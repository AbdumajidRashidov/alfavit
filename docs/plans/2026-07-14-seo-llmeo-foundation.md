# SEO/LLMEO Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Alfavit web app prerender every route to static, per-locale HTML that search engines and non-JS LLM crawlers can read, with correct canonical/hreflang, JSON-LD, a generated sitemap, and an `llms.txt`.

**Architecture:** Migrate `apps/web` from a client-only Vite SPA (`createBrowserRouter` + `createRoot`) to `vite-react-ssg`, which prerenders routes to static HTML at build then hydrates the same React app. Locale becomes URL-derived (uz at root, `/ru`, `/en`), 6 pages × 3 locales = 18 static pages. Head tags (title, description, canonical, hreflang, OG, JSON-LD) render into the prerendered `<head>` via `vite-react-ssg`'s built-in `<Head>` component. Sitemap and static discovery files are generated/served from a shared pure-data config.

**Tech Stack:** Vite 5, React 18, react-router-dom 6, `vite-react-ssg` (adds SSG + `<Head>`), TypeScript, Vitest.

## Global Constraints

- Canonical origin is exactly `https://alfavit.uz` (no trailing slash in the constant).
- Locales: `uz` (root, no prefix, `x-default`), `ru` (`/ru`), `en` (`/en`). uz URLs stay unchanged.
- Pages (locale-agnostic paths): `''` (index), `files`, `apps`, `developers`, `reform`, `privacy` → 18 prerendered pages total.
- No emojis anywhere in UI or content — inline SVG only (existing project rule).
- Head management uses `vite-react-ssg`'s exported `<Head>` (react-helmet-based) — do NOT add a separate `@unhead/react` dependency.
- Deploy is unchanged: Cloudflare Pages serves `dist/`; keep `public/_redirects` (`/* /index.html 200`).
- Every task ends green: `pnpm --dir apps/web test` passes and (from Task 2 on) `pnpm --dir apps/web build` succeeds.
- Commit trailer on every commit: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Commit as `-c user.name="Alfavit" -c user.email="abdumajid.r@iman.uz"`.

---

## File Structure

- `apps/web/src/seo/config.ts` — **new.** Pure data + pure helpers: `SITE_URL`, `PAGE_PATHS`, `localePath`, `parsePath`, `generateSitemapXml`. No React, no browser globals (safe to import from `vite.config.ts`).
- `apps/web/src/seo/jsonld.ts` — **new.** JSON-LD builders (`organizationLd`, `websiteLd`, `softwareAppLd`, `breadcrumbLd`).
- `apps/web/src/seo/sitemapPlugin.ts` — **new.** Vite build plugin writing `dist/sitemap.xml`.
- `apps/web/src/components/Seo.tsx` — **new.** Per-page `<Head>` (title/desc/canonical/hreflang/OG/JSON-LD).
- `apps/web/src/i18n/translations.ts` — **modify.** Export `LOCALES`, add/export `DEFAULT_LOCALE`; later remove `detectInitialLocale`.
- `apps/web/src/i18n/LanguageProvider.tsx` — **modify.** SSR-safe (Task 2), then URL-derived locale + navigation (Task 3).
- `apps/web/src/i18n/useLocalePath.ts` — **new (Task 3).** Hook returning a locale-prefixing function for internal links.
- `apps/web/src/main.tsx` — **modify.** `ViteReactSSG` entry.
- `apps/web/src/router.tsx` — **modify.** `RouteRecord[]` with `entry`, per-locale subtrees.
- `apps/web/src/components/RootLayout.tsx` — **modify.** Wrap `LanguageProvider`; sitewide JSON-LD `<Head>`.
- `apps/web/src/components/{Nav,Footer,Channels}.tsx`, `pages/HomePage.tsx` — **modify.** Locale-aware links.
- `apps/web/src/pages/*.tsx` — **modify.** Replace `usePageMeta` with `<Seo>`.
- `apps/web/src/i18n/usePageMeta.ts` — **delete (Task 4).**
- `apps/web/index.html` — **modify (Task 4).** Strip per-page meta (now in `<Head>`).
- `apps/web/public/{robots.txt,llms.txt}` — **modify/new (Task 6).** `public/sitemap.xml` deleted (Task 6).
- `apps/web/src/tests/renderApp.tsx` — **new (Task 3).** Shared render helpers.
- `apps/web/vite.config.ts`, `apps/web/package.json` — **modify.**

---

## Task 1: Shared SEO config + pure helpers

Pure, framework-free foundation. Fully unit-tested, zero build risk.

**Files:**
- Modify: `apps/web/src/i18n/translations.ts` (export `LOCALES`, add `DEFAULT_LOCALE`)
- Create: `apps/web/src/seo/config.ts`
- Test: `apps/web/src/tests/seo.test.ts`

**Interfaces:**
- Consumes: `Locale` type from `../i18n/translations`.
- Produces:
  - `SITE_URL: string` (`'https://alfavit.uz'`)
  - `DEFAULT_LOCALE: Locale` (`'uz'`), `LOCALES: readonly Locale[]`
  - `PAGE_PATHS: { path: string; priority: number }[]`
  - `localePath(locale: Locale, pagePath: string): string`
  - `parsePath(pathname: string): { locale: Locale; pagePath: string }`
  - `generateSitemapXml(): string`

- [ ] **Step 1: Export locale constants from translations.ts**

In `apps/web/src/i18n/translations.ts`, change the existing line `const LOCALES: Locale[] = ['uz', 'ru', 'en']` to be exported and add a default. Find:

```ts
const LOCALES: Locale[] = ['uz', 'ru', 'en']
```

Replace with:

```ts
export const LOCALES: Locale[] = ['uz', 'ru', 'en']
export const DEFAULT_LOCALE: Locale = 'uz'
```

(Leave `detectInitialLocale` untouched for now — it still uses `LOCALES`; it is removed in Task 3.)

- [ ] **Step 2: Write the failing test**

Create `apps/web/src/tests/seo.test.ts`:

```ts
import { expect, test } from 'vitest'
import { localePath, parsePath, generateSitemapXml, SITE_URL, PAGE_PATHS, LOCALES } from '../seo/config'

test('localePath: uz has no prefix, ru/en do', () => {
  expect(localePath('uz', '')).toBe('/')
  expect(localePath('uz', 'files')).toBe('/files')
  expect(localePath('ru', '')).toBe('/ru')
  expect(localePath('ru', 'files')).toBe('/ru/files')
  expect(localePath('en', 'reform')).toBe('/en/reform')
})

test('parsePath: derives locale and bare page path', () => {
  expect(parsePath('/')).toEqual({ locale: 'uz', pagePath: '' })
  expect(parsePath('/files')).toEqual({ locale: 'uz', pagePath: 'files' })
  expect(parsePath('/ru')).toEqual({ locale: 'ru', pagePath: '' })
  expect(parsePath('/ru/')).toEqual({ locale: 'ru', pagePath: '' })
  expect(parsePath('/ru/files')).toEqual({ locale: 'ru', pagePath: 'files' })
  expect(parsePath('/en/reform')).toEqual({ locale: 'en', pagePath: 'reform' })
  expect(parsePath('/unknown')).toEqual({ locale: 'uz', pagePath: 'unknown' })
})

test('generateSitemapXml: 18 urls with hreflang alternates', () => {
  const xml = generateSitemapXml()
  expect((xml.match(/<loc>/g) ?? []).length).toBe(LOCALES.length * PAGE_PATHS.length) // 18
  expect(xml).toContain(`<loc>${SITE_URL}/ru/files</loc>`)
  expect(xml).toContain(`<loc>${SITE_URL}/en/reform</loc>`)
  expect(xml).toContain('hreflang="x-default"')
  expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"')
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm --dir apps/web exec vitest run src/tests/seo.test.ts`
Expected: FAIL — cannot resolve `../seo/config`.

- [ ] **Step 4: Implement `seo/config.ts`**

Create `apps/web/src/seo/config.ts`:

```ts
import { LOCALES, DEFAULT_LOCALE, type Locale } from '../i18n/translations'

export { LOCALES, DEFAULT_LOCALE }
export type { Locale }

export const SITE_URL = 'https://alfavit.uz'

export const PAGE_PATHS: { path: string; priority: number }[] = [
  { path: '', priority: 1.0 },
  { path: 'files', priority: 0.8 },
  { path: 'apps', priority: 0.8 },
  { path: 'developers', priority: 0.8 },
  { path: 'reform', priority: 0.6 },
  { path: 'privacy', priority: 0.3 },
]

export function localePath(locale: Locale, pagePath: string): string {
  const prefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`
  const suffix = pagePath ? `/${pagePath}` : ''
  return prefix + suffix || '/'
}

export function parsePath(pathname: string): { locale: Locale; pagePath: string } {
  const segments = pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean)
  const first = segments[0]
  if (first === 'ru' || first === 'en') {
    return { locale: first, pagePath: segments.slice(1).join('/') }
  }
  return { locale: DEFAULT_LOCALE, pagePath: segments.join('/') }
}

export function generateSitemapXml(): string {
  const urls = LOCALES.flatMap((locale) =>
    PAGE_PATHS.map(({ path, priority }) => {
      const loc = SITE_URL + localePath(locale, path)
      const alts = LOCALES
        .map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE_URL + localePath(l, path)}"/>`)
        .join('\n')
      const xdefault = `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL + localePath(DEFAULT_LOCALE, path)}"/>`
      return `  <url>\n    <loc>${loc}</loc>\n${alts}\n${xdefault}\n    <priority>${priority.toFixed(1)}</priority>\n  </url>`
    }),
  )
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --dir apps/web exec vitest run src/tests/seo.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/seo/config.ts apps/web/src/tests/seo.test.ts apps/web/src/i18n/translations.ts
git -c user.name="Alfavit" -c user.email="abdumajid.r@iman.uz" commit -m "feat(web/seo): shared locale/url config + sitemap generator (pure, tested)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Migrate to vite-react-ssg (static HTML build)

Swap the SPA entry/router for `vite-react-ssg` and make the app prerender to static HTML. Behavior stays single-flow (uz-at-root, client-side locale detection preserved) — the per-locale URL redesign is Task 3. This isolates "does SSG build + hydrate" from the locale rework.

**Files:**
- Modify: `apps/web/package.json` (add dep + scripts)
- Modify: `apps/web/src/main.tsx`, `apps/web/src/router.tsx`, `apps/web/src/components/RootLayout.tsx`, `apps/web/src/i18n/LanguageProvider.tsx`
- Modify: `apps/web/src/tests/routing.test.tsx` (routes now embed the provider)

**Interfaces:**
- Consumes: `routes` (now typed `RouteRecord[]`).
- Produces: `export const createRoot` from `main.tsx` (the `ViteReactSSG` return); `routes: RouteRecord[]` from `router.tsx`; `LanguageProvider` that renders without an outer router and is SSR-safe.

- [ ] **Step 1: Install vite-react-ssg**

Run:
```bash
pnpm --dir apps/web add vite-react-ssg
```
Expected: added to `dependencies`. (It brings its own head/helmet layer — no other dep needed.)

- [ ] **Step 2: Point package.json scripts at vite-react-ssg**

In `apps/web/package.json`, replace the `scripts` block with:

```json
  "scripts": {
    "dev": "vite-react-ssg dev",
    "build": "tsc -b && vite-react-ssg build",
    "preview": "vite preview --outDir dist",
    "test": "vitest run"
  },
```

- [ ] **Step 3: Make LanguageProvider SSR-safe**

The current provider calls `detectInitialLocale()` inside `useState` — that runs during render and touches `localStorage`/`navigator`, crashing SSR. Move detection into an effect (client-only). Replace the whole body of `apps/web/src/i18n/LanguageProvider.tsx` with:

```tsx
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { detectInitialLocale, translations, type Locale, type TranslationKey } from './translations'

interface Ctx { t: (key: TranslationKey) => string; locale: Locale; setLocale: (l: Locale) => void }
export const LanguageContext = createContext<Ctx | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  // SSR-safe default; real detection runs client-side after mount.
  const [locale, setLocaleState] = useState<Locale>('uz')
  useEffect(() => {
    setLocaleState(detectInitialLocale())
  }, [])
  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    try { localStorage.setItem('alfavit.locale', l) } catch { /* ignore */ }
  }, [])
  const t = useCallback((key: TranslationKey) => translations[locale][key], [locale])
  const value = useMemo(() => ({ t, locale, setLocale }), [t, locale, setLocale])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
```

- [ ] **Step 4: Move the provider into RootLayout**

`vite-react-ssg` renders `routes` directly — there is no place to wrap providers in `main.tsx` around a `RouterProvider`. Put the provider in the layout route element. Replace `apps/web/src/components/RootLayout.tsx` with:

```tsx
import { Outlet } from 'react-router-dom'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { Nav } from './Nav'
import { Footer } from './Footer'

export function RootLayout() {
  return (
    <LanguageProvider>
      <Nav />
      <main>
        <Outlet />
      </main>
      <Footer />
    </LanguageProvider>
  )
}
```

- [ ] **Step 5: Convert the router to RouteRecord[]**

Replace `apps/web/src/router.tsx` with (still uz-only routing here — locale subtrees arrive in Task 3):

```tsx
import type { RouteRecord } from 'vite-react-ssg'
import { RootLayout } from './components/RootLayout'
import { HomePage } from './pages/HomePage'
import { FilesPage } from './pages/FilesPage'
import { AppsPage } from './pages/AppsPage'
import { DevelopersPage } from './pages/DevelopersPage'
import { ReformPage } from './pages/ReformPage'
import { PrivacyPage } from './pages/PrivacyPage'

export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <RootLayout />,
    entry: 'src/components/RootLayout.tsx',
    children: [
      { index: true, Component: HomePage },
      { path: 'files', Component: FilesPage },
      { path: 'apps', Component: AppsPage },
      { path: 'developers', Component: DevelopersPage },
      { path: 'reform', Component: ReformPage },
      { path: 'privacy', Component: PrivacyPage },
      { path: '*', Component: HomePage },
    ],
  },
]
```

- [ ] **Step 6: Convert the entry to ViteReactSSG**

Replace `apps/web/src/main.tsx` with:

```tsx
import { ViteReactSSG } from 'vite-react-ssg'
import { routes } from './router'
import './styles/index.css'

export const createRoot = ViteReactSSG({ routes, basename: import.meta.env.BASE_URL })
```

- [ ] **Step 7: Fix routing.test.tsx (routes now embed the provider)**

`routes` now include `RootLayout`, which renders `LanguageProvider`. The old test wrapped `RouterProvider` in a second `LanguageProvider`; drop it. Replace the imports and `renderAt` in `apps/web/src/tests/routing.test.tsx`:

Find:
```tsx
import { LanguageProvider } from '../i18n/LanguageProvider'
import { routes } from '../router'
```
Replace with:
```tsx
import { routes } from '../router'
import type { RouteObject } from 'react-router-dom'
```

Find:
```tsx
function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return render(
    <LanguageProvider>
      <RouterProvider router={router} />
    </LanguageProvider>,
  )
}
```
Replace with:
```tsx
function renderAt(path: string) {
  const router = createMemoryRouter(routes as unknown as RouteObject[], { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}
```

(`RouteRecord` is a superset of react-router's `RouteObject`; the cast keeps `createMemoryRouter` happy in tests.)

- [ ] **Step 8: Run tests**

Run: `pnpm --dir apps/web test`
Expected: PASS. (All existing suites; `LanguageProvider` still works standalone because detection now runs in an effect and defaults to uz.)

- [ ] **Step 9: Build and verify static HTML contains content**

Run:
```bash
pnpm --dir apps/web build
grep -q "yangi alifbo" apps/web/dist/index.html && echo "HERO CONTENT IN HTML: OK"
grep -q "id=\"root\"><" apps/web/dist/index.html && echo "STILL EMPTY (BAD)" || echo "ROOT NOT EMPTY: OK"
```
Expected: `HERO CONTENT IN HTML: OK` and `ROOT NOT EMPTY: OK`. The uz hero copy (`hero.headlineEm` = "yangi alifbosida.") is now in the prerendered markup.

- [ ] **Step 10: Commit**

```bash
git add apps/web/package.json apps/web/pnpm-lock.yaml apps/web/src/main.tsx apps/web/src/router.tsx apps/web/src/components/RootLayout.tsx apps/web/src/i18n/LanguageProvider.tsx apps/web/src/tests/routing.test.tsx
git -c user.name="Alfavit" -c user.email="abdumajid.r@iman.uz" commit -m "feat(web): prerender to static HTML via vite-react-ssg

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

> Note: `pnpm-lock.yaml` lives at the repo root in this monorepo; adjust the path if `git add` reports it missing under `apps/web/`.

---

## Task 3: Per-locale URLs, links, and switcher

Move locale into the URL: uz at root, `/ru`, `/en` subtrees (all static → all prerendered). Locale is derived from the pathname; the language switcher navigates; internal links carry the current locale.

**Files:**
- Modify: `apps/web/src/i18n/LanguageProvider.tsx` (URL-derived locale + navigation)
- Modify: `apps/web/src/i18n/translations.ts` (remove now-unused `detectInitialLocale`)
- Create: `apps/web/src/i18n/useLocalePath.ts`
- Modify: `apps/web/src/router.tsx` (locale subtrees)
- Modify: `apps/web/src/components/{Nav,Footer,Channels}.tsx`, `apps/web/src/pages/HomePage.tsx`
- Create: `apps/web/src/tests/renderApp.tsx`
- Modify tests: `apps/web/src/tests/{i18n,Nav,Channels,Converter,Developers,FileConverter}.test.tsx`

**Interfaces:**
- Consumes: `localePath`, `parsePath`, `DEFAULT_LOCALE` from `../seo/config`.
- Produces:
  - `LanguageProvider` deriving `locale` from `useLocation().pathname`; `setLocale(l)` navigates to the same page in locale `l`.
  - `useLocalePath(): (appPath: string) => string` — prefixes a locale-agnostic path (`'/reform'`) with the current locale (`'/ru/reform'`).
  - Test helpers `renderApp(path)` and `renderWithLocale(ui, path?)`.

- [ ] **Step 1: Write failing router test for locale routes**

Add to `apps/web/src/tests/routing.test.tsx` (after the existing tests):

```tsx
test('/ru renders Russian hero copy', () => {
  renderAt('/ru')
  expect(screen.getByText(/новом алфавите/i)).toBeInTheDocument()
})

test('/en/reform renders the English reform title', () => {
  renderAt('/en/reform')
  expect(screen.getByText('The 2026 reform')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --dir apps/web exec vitest run src/tests/routing.test.tsx`
Expected: FAIL — `/ru` and `/en/reform` currently fall through to the `*` → HomePage (uz), so the Russian/English text is absent.

- [ ] **Step 3: Add per-locale route subtrees**

Replace `apps/web/src/router.tsx` with:

```tsx
import type { RouteRecord } from 'vite-react-ssg'
import { RootLayout } from './components/RootLayout'
import { HomePage } from './pages/HomePage'
import { FilesPage } from './pages/FilesPage'
import { AppsPage } from './pages/AppsPage'
import { DevelopersPage } from './pages/DevelopersPage'
import { ReformPage } from './pages/ReformPage'
import { PrivacyPage } from './pages/PrivacyPage'

function contentChildren(): RouteRecord[] {
  return [
    { index: true, Component: HomePage },
    { path: 'files', Component: FilesPage },
    { path: 'apps', Component: AppsPage },
    { path: 'developers', Component: DevelopersPage },
    { path: 'reform', Component: ReformPage },
    { path: 'privacy', Component: PrivacyPage },
  ]
}

export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <RootLayout />,
    entry: 'src/components/RootLayout.tsx',
    children: [
      ...contentChildren(), // uz at root
      { path: 'ru', children: contentChildren() },
      { path: 'en', children: contentChildren() },
      { path: '*', Component: HomePage },
    ],
  },
]
```

All paths are static (no `:param`), so `vite-react-ssg` prerenders all 18 automatically — no `getStaticPaths` needed.

- [ ] **Step 4: Derive locale from the URL in LanguageProvider**

Replace `apps/web/src/i18n/LanguageProvider.tsx` with:

```tsx
import { createContext, useCallback, useMemo, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { translations, type Locale, type TranslationKey } from './translations'
import { localePath, parsePath } from '../seo/config'

interface Ctx { t: (key: TranslationKey) => string; locale: Locale; setLocale: (l: Locale) => void }
export const LanguageContext = createContext<Ctx | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { locale, pagePath } = parsePath(pathname)
  const setLocale = useCallback(
    (l: Locale) => { navigate(localePath(l, pagePath)) },
    [navigate, pagePath],
  )
  const t = useCallback((key: TranslationKey) => translations[locale][key], [locale])
  const value = useMemo(() => ({ t, locale, setLocale }), [t, locale, setLocale])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
```

- [ ] **Step 5: Remove the now-unused detectInitialLocale**

In `apps/web/src/i18n/translations.ts`, delete the entire `detectInitialLocale` function and the now-unused `LOCALES`-based logic inside it. Keep the `export const LOCALES` and `export const DEFAULT_LOCALE` lines (used elsewhere). Remove:

```ts
export function detectInitialLocale(): Locale {
  try {
    const saved = localStorage.getItem('alfavit.locale')
    if (saved && LOCALES.includes(saved as Locale)) return saved as Locale
  } catch { /* ignore */ }
  const nav = (typeof navigator !== 'undefined' ? navigator.language : 'uz').slice(0, 2)
  return (LOCALES as string[]).includes(nav) ? (nav as Locale) : 'uz'
}
```

- [ ] **Step 6: Run to verify the router tests pass**

Run: `pnpm --dir apps/web exec vitest run src/tests/routing.test.tsx`
Expected: PASS (uz, ru, en assertions).

- [ ] **Step 7: Add the useLocalePath hook**

Create `apps/web/src/i18n/useLocalePath.ts`:

```ts
import { useT } from './useT'
import { localePath } from '../seo/config'

// Returns a fn that prefixes a locale-agnostic app path ('/reform') with the
// current locale ('/ru/reform'). '/' maps to '' | '/ru' | '/en'.
export function useLocalePath() {
  const { locale } = useT()
  return (appPath: string) => localePath(locale, appPath.replace(/^\//, ''))
}
```

- [ ] **Step 8: Localize internal links in Nav**

In `apps/web/src/components/Nav.tsx`:

Add the import:
```tsx
import { useLocalePath } from '../i18n/useLocalePath'
```
Inside `Nav()`, after `const { t } = useT()`:
```tsx
  const lp = useLocalePath()
```
Then wrap every internal `to`:
- Logo link: `to="/"` → `to={lp('/')}`
- Desktop `NavLink`: `to={to}` → `to={lp(to)}` and change `end={to === '/'}` → `end={to === '/'}` (unchanged; `end` still keyed off the agnostic path)
- Desktop CTA: `to="/"` → `to={lp('/')}`
- Mobile `NavLink`: `to={to}` → `to={lp(to)}`
- Mobile CTA: `to="/"` → `to={lp('/')}`

- [ ] **Step 9: Localize internal links in Footer, Channels, HomePage**

`apps/web/src/components/Footer.tsx`: add `import { useLocalePath } from '../i18n/useLocalePath'`, add `const lp = useLocalePath()` in the component, then `to="/"` → `to={lp('/')}`, `to="/reform"` → `to={lp('/reform')}`, `to="/developers"` → `to={lp('/developers')}`.

`apps/web/src/components/Channels.tsx`: add the same import + `const lp = useLocalePath()` inside `Channels()`. The internal branch renders `<Link to={item.href} ...>`; change to `<Link to={lp(item.href)} ...>`. (Only the `item.href.startsWith('/')` branch — external `<a>` links are unchanged.)

`apps/web/src/pages/HomePage.tsx`: add the import + `const lp = useLocalePath()` inside `HomePage()` (alongside the existing `const { t } = useT()`), then in the card `<Link to={to} ...>` change to `<Link to={lp(to)} ...>`.

- [ ] **Step 10: Create shared test helpers**

Create `apps/web/src/tests/renderApp.tsx`:

```tsx
import type { ReactNode } from 'react'
import { render } from '@testing-library/react'
import { RouterProvider, MemoryRouter, createMemoryRouter } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { routes } from '../router'

// Full app at a given path (routes include RootLayout → LanguageProvider).
export function renderApp(path: string) {
  const router = createMemoryRouter(routes as unknown as RouteObject[], { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

// A single component under the language provider at a chosen locale path.
export function renderWithLocale(ui: ReactNode, path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <LanguageProvider>{ui}</LanguageProvider>
    </MemoryRouter>,
  )
}
```

- [ ] **Step 11: Update component tests to provide a router**

`LanguageProvider` now calls `useLocation`/`useNavigate`, so every test rendering it must sit inside a router. Update these files to use `renderWithLocale` from `./renderApp` instead of wrapping `<LanguageProvider>` directly:

`apps/web/src/tests/Converter.test.tsx` — replace:
```tsx
import { LanguageProvider } from '../i18n/LanguageProvider'
...
function renderConverter() {
  return render(<LanguageProvider><Converter /></LanguageProvider>)
}
```
with:
```tsx
import { renderWithLocale } from './renderApp'
...
function renderConverter() {
  return renderWithLocale(<Converter />)
}
```

`apps/web/src/tests/Developers.test.tsx` — replace `render(<LanguageProvider><Developers /></LanguageProvider>)` with `renderWithLocale(<Developers />)` and drop the `LanguageProvider` import (add `import { renderWithLocale } from './renderApp'`).

`apps/web/src/tests/FileConverter.test.tsx` — replace `render(<LanguageProvider><FileConverter /></LanguageProvider>)` inside `renderFC()` with `renderWithLocale(<FileConverter />)`; swap the import.

`apps/web/src/tests/Channels.test.tsx` — replace the `render(<LanguageProvider><MemoryRouter><Channels /></MemoryRouter></LanguageProvider>)` call with `renderWithLocale(<Channels />)`; swap the imports (remove `LanguageProvider` and `MemoryRouter`, add `renderWithLocale`).

- [ ] **Step 12: Rewrite the i18n test for URL-based locale**

Replace `apps/web/src/tests/i18n.test.tsx` with:

```tsx
import { screen, act } from '@testing-library/react'
import { expect, test } from 'vitest'
import { useT } from '../i18n/useT'
import { renderWithLocale } from './renderApp'

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

test('root path is uz and shows uz strings', () => {
  renderWithLocale(<Probe />, '/')
  expect(screen.getByTestId('locale')).toHaveTextContent('uz')
  expect(screen.getByTestId('cta')).toHaveTextContent('Boshlash')
})

test('/ru path is ru and shows ru strings', () => {
  renderWithLocale(<Probe />, '/ru')
  expect(screen.getByTestId('locale')).toHaveTextContent('ru')
  expect(screen.getByTestId('cta')).toHaveTextContent('Начать')
})

test('setLocale navigates to the same page in the new locale', () => {
  renderWithLocale(<Probe />, '/')
  act(() => { screen.getByText('ru').click() })
  expect(screen.getByTestId('locale')).toHaveTextContent('ru')
  expect(screen.getByTestId('cta')).toHaveTextContent('Начать')
})
```

- [ ] **Step 13: Update the Nav language-switch test**

In `apps/web/src/tests/Nav.test.tsx`, the switch test must navigate within the full app so a `/ru` route exists. Replace the `renderNav` helper and the switch test:

Find `renderNav()` (the `LanguageProvider` > `MemoryRouter` > `Nav` wrapper) and the test body of `'renders logo, route links, and localized CTA; switches language'`. Replace the switch assertion to render the full app and click RU:

Replace the imports block:
```tsx
import { MemoryRouter } from 'react-router-dom'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { Nav } from '../components/Nav'
```
with (the Nav test now renders through the shared helpers, so `MemoryRouter` and `LanguageProvider` are no longer imported here):
```tsx
import { Nav } from '../components/Nav'
import { renderApp, renderWithLocale } from './renderApp'
```

Replace `renderNav()`:
```tsx
function renderNav() {
  return renderWithLocale(<Nav />, '/')
}
```

Replace the switch test with:
```tsx
test('renders logo, route links, and localized CTA', () => {
  renderNav()
  expect(screen.getByText(/Alfavit/)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Boshlash' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Dasturchilar' })).toHaveAttribute('href', '/developers')
})

test('switching language navigates and re-localizes', async () => {
  const user = userEvent.setup()
  renderApp('/')
  await user.click(screen.getByRole('button', { name: 'RU' }))
  expect(await screen.findByRole('link', { name: 'Начать' })).toBeInTheDocument()
})
```

(The `mobile menu toggles open` test keeps using `renderNav()` and is unchanged aside from the helper swap.)

- [ ] **Step 14: Run the full test suite**

Run: `pnpm --dir apps/web test`
Expected: PASS (all suites, including new ru/en routing, i18n navigation, and Nav switch-navigation).

- [ ] **Step 15: Build and verify per-locale static HTML**

Run:
```bash
pnpm --dir apps/web build
grep -q "новом алфавите" apps/web/dist/ru/index.html && echo "RU HERO IN HTML: OK"
grep -q "The 2026 reform" apps/web/dist/en/reform/index.html && echo "EN REFORM IN HTML: OK"
ls apps/web/dist/ru apps/web/dist/en
```
Expected: both `OK` lines; `dist/ru` and `dist/en` each contain `files/ apps/ developers/ reform/ privacy/` subdirs (with `index.html`).

- [ ] **Step 16: Commit**

```bash
git add apps/web/src
git -c user.name="Alfavit" -c user.email="abdumajid.r@iman.uz" commit -m "feat(web): per-locale URLs (/ru,/en) with locale-aware links and switcher

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Per-page head via vite-react-ssg <Head> (Seo component)

Replace the client-only `usePageMeta` with a `<Seo>` component that renders title, description, canonical, hreflang alternates, and OG/Twitter into the prerendered `<head>`.

**Files:**
- Create: `apps/web/src/components/Seo.tsx`
- Modify: `apps/web/src/pages/{HomePage,FilesPage,AppsPage,DevelopersPage,ReformPage,PrivacyPage}.tsx`
- Delete: `apps/web/src/i18n/usePageMeta.ts`
- Modify: `apps/web/index.html`
- Test: `apps/web/src/tests/seo-head.test.ts` (build-output assertion)

**Interfaces:**
- Consumes: `Head` from `vite-react-ssg`; `useT`; `SITE_URL`, `LOCALES`, `localePath` from `../seo/config`.
- Produces: `Seo({ titleKey, descKey, pagePath, jsonLd?, breadcrumb? })`.

- [ ] **Step 1: Create the Seo component**

Create `apps/web/src/components/Seo.tsx`:

```tsx
import { Head } from 'vite-react-ssg'
import { useT } from '../i18n/useT'
import { SITE_URL, LOCALES, localePath } from '../seo/config'
import { breadcrumbLd } from '../seo/jsonld'
import type { TranslationKey } from '../i18n/translations'

interface SeoProps {
  titleKey: TranslationKey
  descKey: TranslationKey
  pagePath: string // '' | 'files' | 'apps' | 'developers' | 'reform' | 'privacy'
  jsonLd?: object
  breadcrumb?: boolean
}

export function Seo({ titleKey, descKey, pagePath, jsonLd, breadcrumb }: SeoProps) {
  const { t, locale } = useT()
  const title = t(titleKey)
  const desc = t(descKey)
  const canonical = SITE_URL + localePath(locale, pagePath)
  const crumb = breadcrumb ? breadcrumbLd(title, canonical) : null
  return (
    <Head>
      <html lang={locale} />
      <title>{title}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canonical} />
      {LOCALES.map((l) => (
        <link key={l} rel="alternate" hrefLang={l} href={SITE_URL + localePath(l, pagePath)} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={SITE_URL + localePath('uz', pagePath)} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Alfavit" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={`${SITE_URL}/og.png`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={`${SITE_URL}/og.png`} />
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
      {crumb && <script type="application/ld+json">{JSON.stringify(crumb)}</script>}
    </Head>
  )
}
```

> `jsonld.ts` (with `breadcrumbLd`) is created in Task 5. To keep Task 4 self-contained and green, create a minimal `apps/web/src/seo/jsonld.ts` now containing just `breadcrumbLd` (Task 5 adds the rest):
> ```ts
> import { SITE_URL } from './config'
> export function breadcrumbLd(name: string, url: string) {
>   return {
>     '@context': 'https://schema.org',
>     '@type': 'BreadcrumbList',
>     itemListElement: [
>       { '@type': 'ListItem', position: 1, name: 'Alfavit', item: SITE_URL },
>       { '@type': 'ListItem', position: 2, name, item: url },
>     ],
>   }
> }
> ```

- [ ] **Step 2: Swap usePageMeta for Seo in every page**

For each page, remove the `usePageMeta` import and call, and render `<Seo .../>` as the first element. Exact edits:

`apps/web/src/pages/HomePage.tsx` — remove `import { usePageMeta } from '../i18n/usePageMeta'` and the `usePageMeta('meta.home.title', 'meta.home.desc')` line; add `import { Seo } from '../components/Seo'` and `import { softwareAppLd } from '../seo/jsonld'`; render at the top of the returned fragment:
```tsx
      <Seo titleKey="meta.home.title" descKey="meta.home.desc" pagePath="" jsonLd={softwareAppLd} />
```

`apps/web/src/pages/FilesPage.tsx`:
```tsx
import { FileConverter } from '../components/FileConverter'
import { Seo } from '../components/Seo'

export function FilesPage() {
  return (
    <>
      <Seo titleKey="meta.files.title" descKey="meta.files.desc" pagePath="files" breadcrumb />
      <FileConverter />
    </>
  )
}
```

`apps/web/src/pages/AppsPage.tsx`:
```tsx
import { Channels } from '../components/Channels'
import { Seo } from '../components/Seo'

export function AppsPage() {
  return (
    <>
      <Seo titleKey="meta.apps.title" descKey="meta.apps.desc" pagePath="apps" breadcrumb />
      <Channels />
    </>
  )
}
```

`apps/web/src/pages/DevelopersPage.tsx`:
```tsx
import { Developers } from '../components/Developers'
import { Seo } from '../components/Seo'

export function DevelopersPage() {
  return (
    <>
      <Seo titleKey="meta.dev.title" descKey="meta.dev.desc" pagePath="developers" breadcrumb />
      <Developers />
    </>
  )
}
```

`apps/web/src/pages/ReformPage.tsx` — remove the `usePageMeta` import and its call; add `import { Seo } from '../components/Seo'`; render `<Seo titleKey="meta.reform.title" descKey="meta.reform.desc" pagePath="reform" breadcrumb />` as the first child of the returned `<section>`'s parent (wrap the existing `<section>` in a fragment with `<Seo>` first).

`apps/web/src/pages/PrivacyPage.tsx` — remove the `usePageMeta` import and its call; add `import { Seo } from '../components/Seo'`; render `<Seo titleKey="meta.privacy.title" descKey="meta.privacy.desc" pagePath="privacy" breadcrumb />` as the first child (wrap existing `<section>` in a fragment).

- [ ] **Step 3: Delete usePageMeta**

```bash
rm apps/web/src/i18n/usePageMeta.ts
```
Confirm no remaining references:
```bash
grep -rn "usePageMeta" apps/web/src || echo "NO REFERENCES: OK"
```
Expected: `NO REFERENCES: OK`.

- [ ] **Step 4: Strip per-page meta from index.html**

`<Head>` now owns title/description/canonical/OG/Twitter. Replace `apps/web/index.html` with (keeping only static head bits):

```html
<!doctype html>
<html lang="uz">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#f2f1ec" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Write the build-output head test**

Create `apps/web/src/tests/seo-head.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from 'vitest'

// Requires `pnpm --dir apps/web build` to have run (see the step below).
const dist = (p: string) => readFileSync(resolve(__dirname, '../../dist', p), 'utf-8')

test('home has canonical + hreflang + SoftwareApplication', () => {
  const html = dist('index.html')
  expect(html).toContain('<link rel="canonical" href="https://alfavit.uz/"')
  expect(html).toContain('hreflang="ru"')
  expect(html).toContain('hreflang="x-default"')
  expect(html).toContain('"@type":"SoftwareApplication"')
})

test('ru reform page canonical points at the ru URL', () => {
  const html = dist('ru/reform/index.html')
  expect(html).toContain('<link rel="canonical" href="https://alfavit.uz/ru/reform"')
})
```

- [ ] **Step 6: Build, then run the head test**

Run:
```bash
pnpm --dir apps/web build
pnpm --dir apps/web exec vitest run src/tests/seo-head.test.ts
```
Expected: build succeeds; both tests PASS. (This test depends on `softwareAppLd` from Task 5's `jsonld.ts` — if running Task 4 in isolation before Task 5, temporarily add `softwareAppLd` per Step 1's note. Task 5 finalizes it.)

- [ ] **Step 7: Run the whole suite + commit**

Run: `pnpm --dir apps/web test`
Expected: PASS.

```bash
git add apps/web/src apps/web/index.html
git rm apps/web/src/i18n/usePageMeta.ts
git -c user.name="Alfavit" -c user.email="abdumajid.r@iman.uz" commit -m "feat(web/seo): prerendered per-page head (title, canonical, hreflang, OG) via Head

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Structured data (JSON-LD)

Add sitewide `Organization` + `WebSite` (in RootLayout) and the `SoftwareApplication` used by the home page. (`breadcrumbLd` already exists from Task 4.)

**Files:**
- Modify: `apps/web/src/seo/jsonld.ts` (add org/website/softwareApp)
- Modify: `apps/web/src/components/RootLayout.tsx` (sitewide JSON-LD `<Head>`)
- Test: extend `apps/web/src/tests/seo-head.test.ts`

**Interfaces:**
- Produces: `organizationLd`, `websiteLd`, `softwareAppLd` (objects) from `../seo/jsonld`.

- [ ] **Step 1: Complete jsonld.ts**

Replace `apps/web/src/seo/jsonld.ts` with:

```ts
import { SITE_URL } from './config'

export const organizationLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Alfavit',
  url: SITE_URL,
  logo: `${SITE_URL}/apple-touch-icon.png`,
}

export const websiteLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Alfavit',
  url: SITE_URL,
}

export const softwareAppLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Alfavit',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Any (web browser)',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  description:
    'Convert Uzbek text from Cyrillic or old Latin to the reformed 2026 new Latin script, in your browser.',
}

export function breadcrumbLd(name: string, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Alfavit', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name, item: url },
    ],
  }
}
```

- [ ] **Step 2: Emit sitewide JSON-LD from RootLayout**

Replace `apps/web/src/components/RootLayout.tsx` with:

```tsx
import { Outlet } from 'react-router-dom'
import { Head } from 'vite-react-ssg'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { Nav } from './Nav'
import { Footer } from './Footer'
import { organizationLd, websiteLd } from '../seo/jsonld'

export function RootLayout() {
  return (
    <LanguageProvider>
      <Head>
        <script type="application/ld+json">{JSON.stringify(organizationLd)}</script>
        <script type="application/ld+json">{JSON.stringify(websiteLd)}</script>
      </Head>
      <Nav />
      <main>
        <Outlet />
      </main>
      <Footer />
    </LanguageProvider>
  )
}
```

- [ ] **Step 3: Extend the head test for sitewide schema**

Add to `apps/web/src/tests/seo-head.test.ts`:

```ts
test('every page carries Organization + WebSite schema', () => {
  const html = dist('index.html')
  expect(html).toContain('"@type":"Organization"')
  expect(html).toContain('"@type":"WebSite"')
  const ru = dist('ru/reform/index.html')
  expect(ru).toContain('"@type":"Organization"')
  expect(ru).toContain('"@type":"BreadcrumbList"')
})
```

- [ ] **Step 4: Build + test**

Run:
```bash
pnpm --dir apps/web build
pnpm --dir apps/web exec vitest run src/tests/seo-head.test.ts
```
Expected: PASS (home has Organization/WebSite/SoftwareApplication; ru/reform has Organization + BreadcrumbList).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src
git -c user.name="Alfavit" -c user.email="abdumajid.r@iman.uz" commit -m "feat(web/seo): Organization, WebSite, SoftwareApplication, BreadcrumbList JSON-LD

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Generated sitemap, llms.txt, robots.txt

Generate `dist/sitemap.xml` from the shared config at build; add `llms.txt`; broaden `robots.txt`; delete the stale hand-written sitemap.

**Files:**
- Create: `apps/web/src/seo/sitemapPlugin.ts`
- Modify: `apps/web/vite.config.ts`
- Delete: `apps/web/public/sitemap.xml`
- Create: `apps/web/public/llms.txt`
- Modify: `apps/web/public/robots.txt`
- Test: `apps/web/src/tests/sitemap-build.test.ts`

**Interfaces:**
- Consumes: `generateSitemapXml` from `./config`.
- Produces: `sitemapPlugin(): Plugin`.

- [ ] **Step 1: Create the sitemap Vite plugin**

Create `apps/web/src/seo/sitemapPlugin.ts`:

```ts
import type { Plugin } from 'vite'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { generateSitemapXml } from './config'

// Writes dist/sitemap.xml after the build bundle is emitted.
export function sitemapPlugin(): Plugin {
  return {
    name: 'alfavit-sitemap',
    apply: 'build',
    closeBundle() {
      writeFileSync(resolve('apps/web/dist/sitemap.xml'), generateSitemapXml())
    },
  }
}
```

> Path note: `closeBundle` runs with the process CWD, which is the repo root when invoked via `pnpm --dir apps/web build` from root, but `apps/web` when run inside the package. Use `resolve(process.cwd().endsWith('apps/web') ? 'dist/sitemap.xml' : 'apps/web/dist/sitemap.xml')`. Concretely:
> ```ts
>   closeBundle() {
>     const out = process.cwd().endsWith('apps/web') ? 'dist/sitemap.xml' : 'apps/web/dist/sitemap.xml'
>     writeFileSync(resolve(out), generateSitemapXml())
>   },
> ```

- [ ] **Step 2: Register the plugin in vite.config.ts**

Edit `apps/web/vite.config.ts`. Add the import and include the plugin:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { sitemapPlugin } from './src/seo/sitemapPlugin'

export default defineConfig({
  plugins: [react(), sitemapPlugin()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
```

- [ ] **Step 3: Delete the stale hand-written sitemap**

```bash
git rm apps/web/public/sitemap.xml
```
(The generated one replaces it; leaving the static file would be copied into `dist` and then overwritten inconsistently.)

- [ ] **Step 4: Add llms.txt**

Create `apps/web/public/llms.txt`:

```markdown
# Alfavit

> Alfavit converts Uzbek text from Cyrillic or the old 1995 Latin script into Uzbekistan's reformed 2026 new Latin alphabet — free, instant, and fully on-device. No account, no upload, no tracking.

## Reform mapping (2026)

- sh → ş
- ch → ç
- gʻ → ğ
- oʻ → ŏ
- loanword ts → c

The 2026 reform (adopted 7 July 2026) replaced the 1995 digraphs and apostrophe-letters with single letters: 28 letters and one apostrophe sign.

## Pages

- [Converter](https://alfavit.uz/): the web converter (Cyrillic / old Latin → new Latin)
- [Files](https://alfavit.uz/files): convert .txt, .srt, and .docx files in-browser
- [Apps & channels](https://alfavit.uz/apps): web app, Telegram bot, browser extension, public API
- [Developers](https://alfavit.uz/developers): free public transliteration API, no key required
- [The 2026 reform](https://alfavit.uz/reform): what changed, letter by letter
```

- [ ] **Step 5: Broaden robots.txt**

Replace `apps/web/public/robots.txt` with:

```
User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: https://alfavit.uz/sitemap.xml
```

- [ ] **Step 6: Write the sitemap build test**

Create `apps/web/src/tests/sitemap-build.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from 'vitest'

test('dist/sitemap.xml has all 18 locale URLs', () => {
  const xml = readFileSync(resolve(__dirname, '../../dist/sitemap.xml'), 'utf-8')
  expect((xml.match(/<loc>/g) ?? []).length).toBe(18)
  expect(xml).toContain('<loc>https://alfavit.uz/ru/files</loc>')
  expect(xml).toContain('hreflang="x-default"')
})

test('dist/llms.txt and robots.txt are present', () => {
  const llms = readFileSync(resolve(__dirname, '../../dist/llms.txt'), 'utf-8')
  expect(llms).toContain('# Alfavit')
  const robots = readFileSync(resolve(__dirname, '../../dist/robots.txt'), 'utf-8')
  expect(robots).toContain('GPTBot')
  expect(robots).toContain('Sitemap: https://alfavit.uz/sitemap.xml')
})
```

- [ ] **Step 7: Build then test**

Run:
```bash
pnpm --dir apps/web build
pnpm --dir apps/web exec vitest run src/tests/sitemap-build.test.ts
```
Expected: PASS — `dist/sitemap.xml` has 18 `<loc>`, and `llms.txt`/`robots.txt` are in `dist`.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src apps/web/vite.config.ts apps/web/public/llms.txt apps/web/public/robots.txt
git rm apps/web/public/sitemap.xml
git -c user.name="Alfavit" -c user.email="abdumajid.r@iman.uz" commit -m "feat(web/seo): generated sitemap (18 locale URLs), llms.txt, LLM-bot robots.txt

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: End-to-end verification

Prove the whole foundation holds together: full build, static content per locale, hydration without errors, all tests green, deploy artifact intact.

**Files:** none created; verification + one consolidated assertion test.

- [ ] **Step 1: Clean build**

Run:
```bash
rm -rf apps/web/dist
pnpm --dir apps/web build
```
Expected: build completes; no errors.

- [ ] **Step 2: Confirm all 18 pages exist as static HTML with content**

Run:
```bash
for p in "" files apps developers reform privacy; do
  for loc in "" ru/ en/; do
    f="apps/web/dist/${loc}${p:+$p/}index.html"; [ "$p" = "" ] && f="apps/web/dist/${loc}index.html"
    test -s "$f" && echo "OK  $f" || echo "MISSING  $f"
  done
done
```
Expected: 18 `OK` lines, zero `MISSING`.

- [ ] **Step 3: Confirm non-JS content is really in the HTML**

Run:
```bash
grep -q "новом алфавите" apps/web/dist/ru/index.html && echo "ru home content OK"
grep -q "Ş ş" apps/web/dist/en/reform/index.html && echo "en reform table OK"
grep -q "id=\"root\"></div>" apps/web/dist/index.html && echo "EMPTY SHELL (BAD)" || echo "content hydrated into shell OK"
```
Expected: `ru home content OK`, `en reform table OK`, `content hydrated into shell OK`.

- [ ] **Step 4: Hydration check in the preview**

Serve the build and confirm no hydration/console errors, and that the language switcher navigates:
```bash
pnpm --dir apps/web preview --port 4173 &
```
Then, using the Browser pane: navigate to `http://localhost:4173/`, read console messages (expect none, especially no "hydration" warnings), click the `RU` switcher, confirm the URL becomes `/ru` and the hero switches to Russian. Then stop the preview server.

- [ ] **Step 5: Full test suite**

Run: `pnpm --dir apps/web test`
Expected: PASS — all suites (seo, seo-head, sitemap-build, routing with ru/en, i18n navigation, Nav, Channels, Converter, Developers, FileConverter, plus the untouched suites).

- [ ] **Step 6: Confirm deploy artifacts intact**

Run:
```bash
ls apps/web/dist/_redirects apps/web/dist/sitemap.xml apps/web/dist/llms.txt apps/web/dist/robots.txt apps/web/dist/favicon.svg apps/web/dist/og.png
```
Expected: all present (Cloudflare Pages serves these directly; `_redirects` still provides SPA fallback for unknown paths).

- [ ] **Step 7: Final commit (if any verification-driven fixes were made)**

```bash
git add -A apps/web
git -c user.name="Alfavit" -c user.email="abdumajid.r@iman.uz" commit -m "test(web/seo): end-to-end verification of the discoverability foundation

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Notes for the implementer

- **CI:** the deploy workflow builds web via its existing script; since `build` now calls `vite-react-ssg build`, confirm CI's Node/pnpm build step still resolves the new dependency (it will after `pnpm-lock.yaml` is committed in Task 2).
- **Do not** auto-redirect by browser language — `/` must stay a stable uz page for crawlers (per spec). Preference-based redirects are out of scope.
- **framer-motion** is SSR-safe; if any prerender warning about `useLayoutEffect` on the server appears, it is benign, but prefer `whileInView`/`initial` props that render a sensible static first frame (already the case in `Reveal`).
- If `vite-react-ssg` emits `/ru.html` instead of `/ru/index.html` for the index of a locale subtree, set the build to directory-style output is default; verify in Task 3 Step 15 and adjust the grep paths if the tool uses `ru.html`.
