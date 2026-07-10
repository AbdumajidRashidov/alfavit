# Alfavit Web App — Design (Sub-project 2)

**Date:** 2026-07-10
**Status:** Approved (design)
**Package:** `@alfavit/web` — `apps/web` in the monorepo

## 1. Purpose

The free, public front door for Alfavit: a cinematic single-page site where anyone
pastes or types Uzbek text (Cyrillic or old 1995 Latin) and instantly gets the
reformed **new Latin** script. It proves `@alfavit/engine` in a real UI and is the
platform's growth engine. Deployed at alfavit.uz.

## 2. Stack & architecture

- **Vite + React + TypeScript + Tailwind CSS.**
- Depends on `@alfavit/engine` via `workspace:*`; imports `transliterate`, `detectScript`.
- **Fully static / client-side.** Conversion runs in the browser — no backend, instant,
  offline-capable, nothing uploaded (a privacy selling point). Deploys to any static host.
- Turborepo picks it up automatically (`apps/*` glob); `pnpm turbo run build` builds
  engine first (`^build`), then the app.

## 3. Page structure (single scroll page)

1. **Hero** — looping video background with a manual fade-in/out loop; gradient overlays;
   nav; headline; description; CTA ("Convert now") that smooth-scrolls to the converter.
2. **Converter** (functional heart, scope A) — input pane (paste/type; auto script
   detection with a subtle "Detected: Cyrillic / Old Latin" badge) → live new-Latin
   output pane → Copy button. Debounced, effectively instant. Two-pane on desktop,
   stacked on mobile.
3. **Letter-morph showcase** — three.js section: Uzbek glyphs morph
   **ш→ş, ў→ŏ, ч→ç, gʻ→ğ**, scroll-triggered, illustrating the 2026 reform. Lazy-loaded.
4. **Footer** — links: Reform explainer, Developers/API (coming), Telegram, GitHub.

## 4. Aesthetic (from the provided template, aligned to Alfavit)

- **Fonts:** Instrument Serif (display: headings, logo) + Inter (body: nav, descriptions),
  imported in `src/styles/fonts.css`. Fitting for a typography-led product.
- **Palette:** background white `#FFFFFF`; headings/logo/buttons black `#000000`;
  descriptions/menu items gray `#6F6F6F`; button text white.
- **Logo:** `Alfavit®` — `text-3xl`, `tracking-tight`, Instrument Serif, superscript ®.
- **Nav:** Convert (active) · Reform · Developers · Telegram · Reach us; CTA "Convert now",
  `rounded-full`, black bg, white text, hover `scale-1.03`. Layout `flex justify-between`,
  `px-8 py-6`, `max-w-7xl mx-auto`.
- **Hero copy** (Instrument Serif, `text-5xl sm:text-7xl md:text-8xl`, line-height 0.95,
  letter-spacing ~-2.46px; emphasis words italic in `#6F6F6F`): see i18n table below.
- **Description:** `text-base sm:text-lg`, `max-w-2xl`, `mt-8`, gray.
- **Hero CTA:** `rounded-full px-14 py-5 text-base mt-12`, black/white, hover `scale-1.03`.

## 5. Motion & libraries

- **Hero video loop:** template's logic verbatim — `useVideoLoop` hook using `useRef` +
  `requestAnimationFrame` monitoring `currentTime`/`duration`: fade in 0.5s at start, fade
  out 0.5s before end; on `ended` set opacity 0, wait 100ms, reset `currentTime=0`, `play()`.
  Video positioned per template (`top:300px`, `inset:auto 0 0 0`) with
  `bg-gradient-to-b from-background via-transparent to-background` overlay.
- **3D morph:** `@react-three/fiber` + `@react-three/drei`, lazy-loaded, `Suspense`-wrapped,
  with a static image/text fallback.
- **Scroll reveals + fade-rise:** `framer-motion`. `fade-rise` = opacity 0→1, translateY
  20px→0, 0.8s ease-out; `-delay` +0.2s; `-delay-2` +0.4s (defined in `src/styles/theme.css`).
- **Accessibility:** honor `prefers-reduced-motion` — pause video and 3D, show static states.
- Video is the only heavy asset; template URL used as a placeholder, swappable pre-launch.

## 6. Internationalization (uz / ru / en)

- **Scope:** UI chrome only (nav, headline, description, buttons, badges, footer). The
  converter is language-agnostic — it always transliterates *Uzbek* text regardless of UI
  language.
- **Approach:** lightweight, zero-dependency. A typed `translations` record keyed by locale,
  a `LanguageProvider` context, a `useT()` hook, and a nav switcher (UZ · RU · EN). Choice
  persisted to `localStorage`.
- **Default:** detect `navigator.language` among uz/ru/en; fall back to **Uzbek**.
- **Headline per locale** (emphasis in bold/italic gray):

  | Locale | Headline |
  |--------|----------|
  | uz | Soʻzlaringiz — Oʻzbekistonning **yangi alifbosida.** |
  | ru | Ваши слова — в **новом алфавите** Узбекистана. |
  | en | Your words, in Uzbekistan's **new alphabet.** |

  (The Uzbek headline is written in the new Latin script — the page demonstrates the product.)

## 7. Component structure

```
apps/web/
├── index.html
├── package.json            # deps: react, react-dom, three, @react-three/fiber,
│                           #       @react-three/drei, framer-motion; dev: vite, tailwind, vitest, RTL
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── i18n/{translations.ts, LanguageProvider.tsx, useT.ts}
    ├── components/{Nav,Hero,Converter,MorphShowcase,Footer,LanguageSwitcher}.tsx
    ├── hooks/{useVideoLoop.ts, useTransliterate.ts}
    ├── styles/{fonts.css, theme.css, index.css}
    └── tests/
```

- `useTransliterate(input)` — debounced wrapper over the engine returning `{text, detectedScript}`.
- Each component has one responsibility; the converter holds the only real interaction state.

## 8. Testing

- **Vitest + React Testing Library:**
  - Converter: typing Cyrillic yields correct new-Latin output; Copy writes to clipboard;
    the detection badge reflects `detectScript`.
  - i18n: switching locale updates chrome strings and persists to `localStorage`; default
    falls back to Uzbek.
  - Render smoke test for the full page (guards the 3D/video sections against crashes).
- Visual/3D output is not unit-tested (visual); the smoke test covers "it renders".
- The engine is already fully tested; app tests focus on wiring + UI behavior.

## 9. Out of scope (YAGNI)

- Ambiguity-flag toggling UI (the engine returns flags; the output component won't preclude
  it, but v1 doesn't build it).
- File/document conversion (Pro tier).
- Accounts, API, SSR/SEO framework (Vite static is enough for v1; revisit if Pro needs routing).
- A real branded hero video (placeholder now; sourced before launch).
