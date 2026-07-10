# Official mapping source — grounding notes

Grounding completed: 2026-07-10.

## Law

"On Amending the Law of the Republic of Uzbekistan 'On the Introduction of the
Uzbek Alphabet Based on the Latin Script'", approved **2026-07-07** by the
Legislative Chamber of the Oliy Majlis.

## Outcome

The alphabet becomes **28 letters + 1 apostrophe sign** (previously 26 letters
+ 3 letter combinations).

## Confirmed reform substitutions (2021 proposal → 2026 law)

| Old-Latin (1995) | New-Latin (2026) |
| ----------------- | ----------------- |
| `sh`               | `ş`                |
| `ch`               | `ç`                |
| `gʻ`               | `ğ`                |
| `oʻ`               | `ŏ`                |
| `ts` (loanwords)   | `c`                |

The `oʻ → ö` vs `oʻ → ŏ` question is **RESOLVED: `ŏ`**. This is grounded, not
provisional.

## Sources

- Wikipedia, "Uzbek alphabet" (2021 reform proposal table).
- UzDaily, "Uzbek Lawmakers Approve Latin Alphabet Reform" (coverage of the
  2026-07-07 law).

## Known gap (not a blocker)

The letter-by-letter Cabinet *orthography rules* — i.e., the exact verbatim
Cyrillic → Latin transliteration table for `е`, `ц`, `ъ`, `ь` — were not
obtained verbatim from a primary source during this grounding pass. The
engine handles these cases via ambiguity flags (see Task 7 in the project
plan), so this gap is a data-only refinement to pick up later, not a blocker
for the reform-letter mapping work in Tasks 5–6.

## Status

The mapping values used in Tasks 5–6 are **GROUNDED** (not provisional) for
the reform letters (`ş`, `ç`, `ğ`, `ŏ`, loanword `c`). Any later discovery of
the verbatim Cabinet orthography table for `е`/`ц`/`ъ`/`ь` is a data-only
refinement, not a change to the grounded reform-letter mappings above.
