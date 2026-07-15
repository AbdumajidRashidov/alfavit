# Official mapping source — grounding notes

Grounding completed: 2026-07-10.

## Law

"On Amending the Law of the Republic of Uzbekistan 'On the Introduction of the
Uzbek Alphabet Based on the Latin Script'", approved **2026-07-07** by the
Legislative Chamber of the Oliy Majlis.

## Outcome

The alphabet becomes **28 letters + 1 apostrophe sign** (previously 26 letters
+ 3 letter combinations).

## Confirmed reform substitutions (2026 law)

| Old-Latin (1995) | New-Latin (2026) |
| ----------------- | ----------------- |
| `sh`               | `ş`                |
| `ch`               | `ç`                |
| `gʻ`               | `ğ`                |
| `oʻ`               | `ö`                |
| `ts` (loanwords)   | `c`                |

### CORRECTION (2026-07-15): `oʻ → ö`, NOT `ŏ`

The original grounding (2026-07-10) recorded `oʻ → ŏ` (o with breve), citing
Wikipedia's table of the **2021 draft proposal**. That was wrong. The **final
2026 law uses `Ö/ö` (o with diaeresis, U+00F6)**, not the breve `ŏ`:

- The Academy of Sciences' official explanation of the four changes states
  `Oʻ → Ö` and justifies it by **alignment with the Turkic Latin alphabets
  (Turkish, Azerbaijani, Turkmen)** — which use `ö` (diaeresis) and `ğ` (breve
  on *g*). No Turkic alphabet uses breve on `o`; the rationale only holds for `ö`.
- Multiple Uzbek-language outlets (gazeta.uz, kun.uz, daryo.uz, zamon.uz) report
  `Ö`. Wikipedia's `ŏ` reflected the superseded 2021 draft.

The engine, all content, and the `ŏ`-based golden corpus were corrected to `ö`
on 2026-07-15. `ŏ` is additionally self-healed to `ö` on input so previously
mis-converted text fixes itself on re-run.

## Sources

- gazeta.uz (uz), "Fanlar akademiyasi oʻzbek alifbosidagi toʻrtta harfni
  oʻzgartirish zaruratini tushuntirdi" — 2026-07-07 (Academy of Sciences).
- gazeta.uz / kun.uz / daryo.uz — 2026-07-07 coverage of the adopted law.
- (Superseded) Wikipedia "Uzbek alphabet" — 2021 draft proposal table (`ŏ`).

## Known gap (not a blocker)

The letter-by-letter Cabinet *orthography rules* — i.e., the exact verbatim
Cyrillic → Latin transliteration table for `е`, `ц`, `ъ`, `ь` — were not
obtained verbatim from a primary source during this grounding pass. The
engine handles these cases via ambiguity flags (see Task 7 in the project
plan), so this gap is a data-only refinement to pick up later, not a blocker
for the reform-letter mapping work in Tasks 5–6.

## Status

The mapping values are **GROUNDED** for the reform letters (`ş`, `ç`, `ğ`, `ö`,
loanword `c`) — see the 2026-07-15 correction above. Any later discovery of
the verbatim Cabinet orthography table for `е`/`ц`/`ъ`/`ь` is a data-only
refinement, not a change to the grounded reform-letter mappings above.
