# Contributing

Thanks for helping Uzbek text move to the 2026 alphabet.

- **Setup:** Node 20, pnpm 9. `pnpm install`, then `pnpm turbo run test` (all packages) and `pnpm build`.
- **Engine rules** live in `packages/engine/src/mappings` and `packages/engine/src/convert-*.ts`. Add a failing test in `packages/engine/src/tests` before changing a rule, and cite the orthography source in the PR description.
- **UI strings:** add every key to all three locales in `apps/web/src/i18n/translations.ts` (`en` first — it defines the key type). Uzbek uses `ʻ` (U+02BB) in `oʻ`/`gʻ` and `ʼ` (U+02BC) as tutuq belgisi; never a straight apostrophe.
- **Reform facts** on the site must stay within what the law and official sources state (four letter changes: sh→ş, ch→ç, gʻ→ğ, oʻ→ö; ng is no longer a separate letter; 28 letters + 1 apostrophe sign). When a fact is uncertain, omit it.
- **Commits:** Conventional Commits (`feat(web): …`, `fix(engine): …`, `docs: …`).
- **Conversion bugs:** open an issue with the input text, the expected output, and a source for the rule.
