# Alfavit — Platform Design

**Date:** 2026-07-10
**Status:** Approved (product level)
**Domain:** alfavit.uz

## 1. Problem & timing

Uzbekistan is mid-migration to a reformed Latin script (2025–2026 reform: the
1995 digraphs/apostrophe-letters `sh, ch, gʻ, oʻ` and loanword `ts` are being
replaced by `ş, ç, ğ, ŏ, c`). Millions of people, documents, websites, and signs
must move from **Cyrillic** and **old Latin (1995)** into the **new Latin** over
the next several years. Alfavit is the standard tool for that migration.

**Positioning:** *The standard tool for moving Uzbek text into the new Latin
script — free for people, paid for professionals and developers.*

## 2. Core architectural principle

One engine, many surfaces. Every channel is a thin shell over a single,
exhaustively-tested transliteration engine.

```
                ┌──────────────────────────────┐
                │   CORE ENGINE (TypeScript)     │  pure: text → new-Latin text
                │   Cyrillic / old-Latin → new   │  offline, dependency-free
                └──────────────────────────────┘
                              ▲
        ┌──────────┬──────────┼──────────┬───────────────┐
      Web app    Pro layer   Public    Browser        Native
      (free)     (accounts)  API+SDK   extension    (menu-bar/keyboard/mobile)
```

The engine holds all the hard problems (linguistic ambiguity). Channels are
plumbing + UX. Nothing is rewritten per channel.

## 3. Product tiers (one product, a value ladder)

| Tier | Audience | Value | Monetization |
|------|----------|-------|--------------|
| **Free** | Everyday people | Web app: paste/type → convert → copy. Any browser, mobile or desktop. | Free — growth engine + live demo |
| **Pro** | Media / content professionals | Accounts, bulk & file conversion (.docx/.txt/.srt), history, batch, style options | Subscription |
| **API** | Developers (banks, telecoms, apps) | Hosted engine as API + SDK | Usage-based |
| **Enterprise** | Government / institutions | Self-host/on-prem, document pipelines, SLA, audit | Contracts (sales motion, not new build) |

Pro/API/Enterprise are primarily **packaging and access control** over the
identical engine + web app — not separate products.

## 4. Build sequence

Each item is its own spec → plan → build cycle.

1. **Core engine** (sub-project 1 — see engine design doc). Build & perfect first.
2. **Free web app** — proves the engine end-to-end; becomes the brand's front door.
3. **Pro layer** — accounts + bulk/file features on the same app.
4. **Public API + SDK** — the engine, hosted.
5. **Additional channels** — menu-bar tool, system keyboard, browser extension,
   mobile — layered on as demand shows. Each just calls the engine.

## 5. Immediate non-build action

- Register **alfavit.uz** now (availability confirmed 2026-07-10; the sibling name
  `alifbe.uz` was taken within days of the reform news — availability is volatile).
- Optionally reserve **skript.uz** (available) for a future developer/API brand.

## 6. Out of scope (YAGNI for now)

- ML/statistical disambiguation (may enhance the engine later).
- Native/mobile channels (sequenced after the web app + API prove the model).
- Enterprise document-pipeline features (contract-driven, built on demand).
