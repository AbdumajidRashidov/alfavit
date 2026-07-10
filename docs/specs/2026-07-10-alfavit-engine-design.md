# Alfavit Engine — Design (Sub-project 1)

**Date:** 2026-07-10
**Status:** Approved (design); mapping table pending official grounding
**Package:** `@alfavit/engine` (TypeScript, dependency-free)

## 1. Purpose & boundaries

A pure, offline library that converts Uzbek text into the **new Latin script**
from either source: **Cyrillic** or **old Latin (1995)**. No UI, no network, no
platform assumptions. Every Alfavit channel consumes this identical package.

**What it does:** `text (Cyrillic | old-Latin | mixed) → new-Latin text`, plus
per-segment ambiguity flags.
**How you use it:** import, call `transliterate(input, options)`.
**What it depends on:** nothing (runs in browser, Node, RN, Electron/Tauri).

## 2. Why this is non-trivial

- **Old-Latin → new-Latin** is nearly mechanical: `sh→ş`, `ch→ç`, `oʻ→ŏ`,
  `gʻ→ğ`, loanword `ts→c`, plus apostrophe/tsokhcha normalization (`ʻ ' ' ‘`).
- **Cyrillic → new-Latin** is context-dependent and lossy in edge cases:
  - `е` → `e` or `ye` (position-dependent)
  - `ц` → `s` or `ts`/`c` (loanword-dependent)
  - `ъ`/`ь` (hard/soft signs), `ё/ю/я` (`yo/yu/ya`), `в→v`
  - proper nouns & loanwords that violate the regular rules
- Therefore **100% blind accuracy is impossible**. The engine is designed to be
  *right, and honest when unsure* — not silently wrong.

## 3. Architecture

Three-layer pipeline, each independently testable:

```
input ─▶ [1] Detect & normalize ─▶ [2] Rule engine ─▶ [3] Exception/dictionary
                                          │                    │
                                          └──── ambiguity flags ┘
                                                     │
                                                     ▼
                                          { text, segments[], flags[] }
```

1. **Detect & normalize** — classify each run of text as Cyrillic, old-Latin, or
   foreign/passthrough (auto-detect; user never has to choose). Normalize
   apostrophe variants; preserve case, punctuation, numbers, whitespace, emoji,
   and non-Uzbek runs verbatim.
2. **Rule engine** — deterministic, ordered context rules per source script.
   Handles the ~97% clean cases. Case-preserving (`Ш→Ş`, `ш→ş`).
3. **Exception dictionary** — curated map of common ambiguous words and proper
   nouns to their correct output; overrides rules. Grows over time; data-only,
   no code change to extend.

Where output is genuinely uncertain (e.g. `е` at a position that could be
`e`/`ye`), the segment carries an **ambiguity flag** with alternatives, so a
channel UI can highlight it and offer a one-tap switch.

## 4. Public API (shape, not final signatures)

```ts
transliterate(input: string, options?: {
  source?: 'auto' | 'cyrillic' | 'old-latin';   // default 'auto'
  onAmbiguity?: 'first' | 'flag';                // default 'flag'
}): {
  text: string;                 // best-effort new-Latin output
  segments: Segment[];          // aligned spans (source ↔ output)
  flags: AmbiguityFlag[];       // uncertain spots + alternatives
}
```

Also exported: `detectScript(input)`, and the raw mapping tables (for tooling).

## 5. Mapping table — grounding requirement (FIRST implementation task)

The authoritative letter set and orthography rules come from the **adopted reform
law + Cabinet orthography rules**, not from memory. Implementation task #1 is to
source and cite that official table, then encode it. The table below is a
**provisional** working draft to be verified/corrected against the official
source before any release.

**Provisional Cyrillic → new-Latin (subject to official verification):**

| Cyrillic | New Latin | Notes |
|---|---|---|
| а б в г д | a b v g d | |
| е | e / ye | context-dependent → may flag |
| ё ж з и й к л м н о п р с т у ф х | yo j z i y k l m n o p r s t u f x | |
| ц | s / c | loanword-dependent → may flag |
| ч ш | ç ş | reform letters |
| ъ ь | (rules) | hard/soft sign handling |
| э ю я | e yu ya | |
| ў ғ қ ҳ | ŏ ğ q h | ў,ғ use reform letters |

**Old-Latin (1995) → new-Latin:** `sh→ş`, `ch→ç`, `oʻ→ŏ`, `gʻ→ğ`, `ts→c`
(loanwords), apostrophe normalization; all other letters pass through.

## 6. Testing strategy (TDD)

The engine's value is its correctness, so tests lead implementation:
- **Golden corpus**: curated Cyrillic / old-Latin inputs ↔ verified new-Latin
  outputs, including every ambiguous case and known proper-noun exceptions.
- **Round-trip & idempotency**: new-Latin input passes through unchanged;
  double-conversion is stable.
- **Passthrough**: foreign words, numbers, punctuation, emoji preserved exactly.
- **Case preservation**: upper/lower/title case maintained.
- **Property tests**: no dropped/added characters outside defined mappings.
- Coverage of the exception dictionary as it grows.

## 7. Non-goals (v1)

- ML/statistical disambiguation (later enhancement).
- Reverse direction (new-Latin → Cyrillic) — add only if a channel needs it.
- Document-format parsing (.docx etc.) — that lives in the Pro channel, not the
  engine; the engine only sees plain text.
