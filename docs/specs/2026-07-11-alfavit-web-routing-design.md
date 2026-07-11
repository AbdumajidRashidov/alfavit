# Alfavit Web — Multi-page Routing — Design

**Date:** 2026-07-11
**Status:** Approved (design)
**Location:** `apps/web` (restructure the single-scroll SPA into routed pages)

## 1. Purpose

Split the one long scroll page into separate pages — one per product/channel — with
client-side routing. Each existing section is already an isolated component, so this is
mostly composition + routing, not rewrites. Adds a real **Reform** explainer page (fills
the currently-dead nav link).

## 2. Architecture

- **Router:** `react-router-dom` (`createBrowserRouter` + `RouterProvider`). Still a static
  SPA (no SSR).
- **Layout:** a `RootLayout` renders `Nav` + `Outlet` + `Footer`; `LanguageProvider` wraps
  the router so locale persists across navigation.
- **Cloudflare Pages deep-link fallback:** `apps/web/public/_redirects` with
  `/* /index.html 200` so directly visiting e.g. `/developers` serves the SPA (React Router
  then renders the route).

## 3. Routes

| Route | Page component | Content |
|-------|----------------|---------|
| `/` | `HomePage` | Video `Hero` + the live `Converter` (flagship, immediately usable) + a "more ways" strip linking to Files/Apps/Developers |
| `/files` | `FilesPage` | `FileConverter` |
| `/apps` | `AppsPage` | `Channels` (downloads-style grid) |
| `/developers` | `DevelopersPage` | `Developers` (API docs) |
| `/reform` | `ReformPage` | Concise 2026-reform explainer (see §5) |
| `*` | `HomePage` (redirect to `/`) | Unknown paths → Home |

Non-Home pages get a compact page header (no video). Existing components
(`Converter`, `FileConverter`, `Channels`, `Developers`, `Hero`) are reused as-is; pages are
thin wrappers.

## 4. Nav & footer

- `Nav` items become `<Link>`s: **Convert** → `/`, **Files** → `/files`, **Apps** → `/apps`,
  **Reform** → `/reform`, **Developers** → `/developers`; **Telegram** stays an external
  link. The logo links to `/`. The active route uses the dark (`text-foreground`) style via
  `NavLink` `isActive`.
- Footer links become route links (Reform/Developers) + external (Telegram/GitHub).
- The previous scroll-to-anchor logic (`scrollIntoView`, `#converter`, `#developers`) and
  the in-page `href="#developers"` on the Apps "API & SDK" card are replaced by route links
  (that card's "Open" → `/developers`).

## 5. Reform page content

Localized title + short prose (uz/ru/en) around a universal letter-change table:

- **Intro:** in 2026 Uzbekistan reformed its Latin alphabet — the 1995 digraphs and
  apostrophe-letters became single letters.
- **Letter changes** (table, script symbols are language-neutral):
  `Sh sh → Ş ş`, `Ch ch → Ç ç`, `Gʻ gʻ → Ğ ğ`, `Oʻ oʻ → Ŏ ŏ`, and loanword `Ts ts → C c`.
- **Law:** adopted 7 July 2026; the alphabet now has 28 letters + one apostrophe sign
  (was 26 letters + 3 letter combinations).
- **Why:** single letters remove clumsy digraphs/apostrophes (which broke software, URLs,
  and search) and align Uzbek with other Turkic Latin alphabets.

New i18n keys (uz/ru/en): `reform.intro`, `reform.changesLabel`, `reform.law`, `reform.why`
(the `reform.title` reuses the existing `nav.reform`/`footer.reform` wording via a new
`reform.title` key). Table letter pairs are hardcoded literals.

## 6. Testing (Vitest + React Testing Library)

- Each page renders in `<LanguageProvider><MemoryRouter>…`: `HomePage` shows the converter
  textbox; `FilesPage` shows the file input; `AppsPage` shows the channel names;
  `DevelopersPage` shows the endpoint; `ReformPage` shows the reform letters (`ş ŏ ç ğ`).
- **Router smoke:** render the app router at `/developers` (via `createMemoryRouter` with
  `initialEntries`) → the API endpoint is visible; at `/` → the converter is visible.
- Existing component tests (`Converter`, `FileConverter`, `Channels`, `Developers`, `Nav`,
  `i18n`, …) keep passing; `Nav` test updates to assert route links instead of scroll.
- The old full-page `smoke.test.tsx` (single scroll) is replaced by the router smoke test.

## 7. Out of scope

SSR/SSG; per-page SEO meta beyond `document.title`; auth-gated routes; page transition
animations; breadcrumb/secondary nav.
