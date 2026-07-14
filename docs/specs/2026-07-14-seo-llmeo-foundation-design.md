# Alfavit SEO/LLMEO — Spec 1: Discoverability Foundation

**Date:** 2026-07-14
**Status:** Design approved, pending spec review
**Scope:** Foundation only. Content (FAQ, expanded reform reference, guide pages) is **Spec 2**, built next on top of this.

## Goal

Make the Alfavit web app render to static HTML that search engines and LLM crawlers can read, with correct multilingual URLs, structured data, and an `llms.txt` — so the content built in Spec 2 is actually discoverable and citable.

## Problem

The app is a pure client-rendered Vite + React SPA. The built `index.html` body is `<div id="root"></div>` — empty. Google can execute JS (partial coverage), but the LLM crawlers that matter for LLMEO (GPTBot, ClaudeBot, PerplexityBot, Google-Extended) mostly do **not** run JavaScript, so today they ingest a blank page. All three languages also share one URL and swap via JS, so only the default locale is ever visible to non-JS crawlers, and per-language content is ambiguous to Google.

## Primary audience (drives priorities)

Uzbek public converting text — high-volume uz **and** ru queries ("kirilldan lotinga", "yangi alifbo 2026", "кириллица на латиницу"). This is why proper multilingual (per-locale URL) SEO is in-scope, not deferred.

## Architecture

Migrate from `createBrowserRouter` + `createRoot` to **`vite-react-ssg`**, which prerenders every route to static HTML at build and hydrates into the same interactive app afterward.

- **Head management:** adopt **`@unhead/react`** (vite-react-ssg's head layer). Replaces the manual `usePageMeta` hook. This is what renders `<title>`, description, canonical, hreflang, and JSON-LD *into* the prerendered `<head>`.
- **Entry:** `main.tsx` changes from `createRoot(...).render(...)` to the `ViteReactSSG(routes, setupFn)` export form, which serves both prerender (build) and hydration (client).
- **Build:** `vite-react-ssg build` replaces `vite build`.
- **Deploy:** unchanged. Cloudflare Pages serves the static `dist/`. `_redirects` (`/* /index.html 200`) stays as the fallback for genuine unknown paths; real routes now have their own static HTML that Pages serves before consulting `_redirects`.

## Locale URL scheme + hreflang

Move from one-URL-swaps-via-JS to **per-locale URLs**:

- **uz at root (no prefix):** `/`, `/files`, `/apps`, `/developers`, `/reform`, `/privacy`
- **ru prefixed:** `/ru/`, `/ru/files`, `/ru/apps`, `/ru/developers`, `/ru/reform`, `/ru/privacy`
- **en prefixed:** `/en/`, `/en/files`, `/en/apps`, `/en/developers`, `/en/reform`, `/en/privacy`

→ 6 routes × 3 locales = **18 prerendered HTML pages**, each with its language's text baked into the HTML.

**Rules:**
- Locale is derived from the **URL**, not `localStorage`/`navigator`.
- The language switcher becomes **navigation** (`/reform` → `/ru/reform`), preserving the current path across the locale change.
- **No auto-redirect** by browser language — `/` always serves stable uz for crawlers and users. hreflang alternates + `x-default`→uz communicate the alternates. (Preference-remembering redirects are explicitly out of scope; can be added later without breaking this.)
- Existing uz URLs are **unchanged**, so nothing already shipped breaks.

**Per page, in `<head>`:**
- `canonical` = the page's own locale-specific URL
- `hreflang` alternates for uz / ru / en + `x-default` → the uz URL

## Structured data (JSON-LD)

Injected via unhead into the prerendered head:

- **`Organization`** (Alfavit) — sitewide
- **`WebSite`** with `SearchAction` — home
- **`SoftwareApplication`** — the converter tool: name, `applicationCategory: UtilitiesApplication`, `offers` free, `operatingSystem: browser`, description mentioning Cyrillic/old-Latin → new-Latin — home
- **`BreadcrumbList`** — sub-pages
- `FAQPage` is **deferred to Spec 2** (its content lives there).

## llms.txt + sitemap + robots

- **`/llms.txt`** — Markdown per the llms.txt convention: what Alfavit is, the reform mapping (sh→ş, ch→ç, gʻ→ğ, oʻ→ŏ, loanword ts→c), and links to key pages. Concise now; grows in Spec 2. Served as a static file.
- **`sitemap.xml` generated at build** from the route list, expanded to all 18 locale URLs with `<xhtml:link rel="alternate" hreflang>` entries. Replaces the hand-maintained file so it can't drift.
- **`robots.txt`** — keep `Allow: /` (already permits the LLM bots); add explicit `Allow` lines for GPTBot, ClaudeBot, PerplexityBot, Google-Extended and keep the `Sitemap:` reference, for clarity.

## SSR-safety refactor

Browser globals used at **render time** (would crash prerender):
- **`detectInitialLocale()`** via `useState` in `LanguageProvider` — the one real crash point. Removed; locale now comes from the route param. `setLocale` becomes navigation.

Browser globals already inside effects/handlers (client-only — safe, minimal/no change):
- `useVideoLoop` `window.matchMedia` — add a guard for extra safety (runs in effect, but defensive).
- `Converter` (`navigator.clipboard`), `FileConverter` (`Blob`, `URL.createObjectURL`, `document.createElement`), `Hero` (`document.getElementById` in click handler) — no change.
- `usePageMeta` (`document.*`) — **removed**, replaced by unhead.

## Testing

- **Build-output assertions** (new): after `vite-react-ssg build`, assert the static HTML really contains content —
  - `dist/index.html` contains the uz hero text
  - `dist/ru/index.html` contains the ru hero text
  - `dist/en/reform/index.html` contains the reform letter table
- **Head assertions**: each prerendered page contains its `canonical`, the three `hreflang` alternates, and expected JSON-LD `@type`.
- **Sitemap assertion**: `dist/sitemap.xml` lists all 18 URLs with hreflang alternates.
- **Hydration check**: preview the built site, navigate routes and switch locale, confirm no console errors / hydration mismatch.
- **Regression**: existing component vitest suite stays green.

## Out of scope (Spec 2 and beyond)

- FAQ content + `FAQPage` schema
- Expanded reform reference page content
- Targeted guide/landing pages
- Preference-remembering locale redirects
- Any backend/API SEO work

## Success criteria

- All 18 locale routes exist as static HTML in `dist/` with their language's content in the markup (verified by a non-JS fetch of the built file).
- Each page has correct canonical + hreflang + JSON-LD in the prerendered head.
- `llms.txt`, generated `sitemap.xml` (18 URLs), and `robots.txt` served correctly.
- App remains fully interactive after hydration; no console/hydration errors; existing tests green.
- Deploys unchanged via Cloudflare Pages / existing CI.
