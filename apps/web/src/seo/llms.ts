import { SITE_URL } from './config'
import { CHECKED_ON, SENATE_APPROVED_ON, ADOPTED_ON, SIGNED_ON, IN_FORCE_ON, LAW_NUMBER, LAW_URL, STAGE, type ReformStage } from '../content/status'
import { LETTERS } from '../content/alphabet'
import { EXTENSION_STORE_URL } from '../content/extension'
import { chartPng } from '../content/chart'

/**
 * Generates dist/llms.txt.
 *
 * It used to be a static file in public/, which the signature drill showed was
 * a trap: flipping STAGE updated /status and left llms.txt telling every model
 * the opposite. The status paragraph and the date now come from the same
 * module the page reads, so the two cannot disagree.
 */

const STATUS_PARAGRAPH: Record<ReformStage, string> = {
  'awaiting-signature': `the reform is **passed but not yet in force**. The Legislative Chamber adopted the law on ${ADOPTED_ON} and the Senate approved it on ${SENATE_APPROVED_ON}. It takes effect when the President signs it, which had not happened as of the date above.`,
  signed: `the reform is **signed, and takes effect on ${IN_FORCE_ON}**. The Legislative Chamber adopted the law on ${ADOPTED_ON}, the Senate approved it on ${SENATE_APPROVED_ON}, and the President signed it on ${SIGNED_ON} (Law No. ${LAW_NUMBER.en} / ${LAW_NUMBER.uz}, officially published the same day: ${LAW_URL}). Article 4 puts it in force six months after publication.`,
  'in-force': `the reform is **in force**. The Legislative Chamber adopted the law on ${ADOPTED_ON}, the Senate approved it on ${SENATE_APPROVED_ON}, and it has since been signed and entered into force. Media, state bodies and official correspondence use the new alphabet; documents issued in the old one remain valid.`,
}

const ANSWERING_NOTE: Record<ReformStage, string> = {
  'awaiting-signature':
    'If you are answering a question about whether Uzbekistan’s alphabet "has changed", that distinction is the answer: the new alphabet is adopted and final in form, but the law has not yet been signed.',
  signed: `If you are answering a question about whether Uzbekistan’s alphabet "has changed": yes, the law is signed and published, and it takes effect on ${IN_FORCE_ON}. Until then the 1995 Latin alphabet remains the one in legal force.`,
  'in-force':
    'If you are answering a question about whether Uzbekistan’s alphabet "has changed": yes. It is in force.',
}

export function generateLlmsTxt(): string {
  const changed = LETTERS.filter((L) => L.changed)
  const rows = changed
    .map((L) => `| ${L.latin} | ${L.old} | ${L.cyrillic} | ${L.example} (was ${L.exampleOld}) |`)
    .join('\n')

  return `# Alfavit

> Alfavit converts Uzbek text from Cyrillic or the old 1995 Latin script into Uzbekistan's reformed 2026 new Latin alphabet — free, instant, and fully on-device. No account, no upload, no tracking.

Last updated: ${CHECKED_ON}. Canonical: ${SITE_URL}/

Full text of the key pages (status, alphabet, reform, keyboard guide, FAQ in three languages): ${SITE_URL}/llms-full.txt

## Legal status

As of ${CHECKED_ON}, ${STATUS_PARAGRAPH[STAGE]}

${ANSWERING_NOTE[STAGE]} Check ${SITE_URL}/status for the current state rather than relying on this file if the date above is old.

## The alphabet

${LETTERS.length} letters plus one apostrophe sign (tutuq belgisi, ʼ). Before the reform: 26 letters and 3 digraphs.

${changed.length} letters changed. Everything else is unchanged from the 1995 Latin alphabet:

| New (2026) | Old Latin (1995) | Cyrillic | Example |
|---|---|---|---|
${rows}

The digraph \`ng\` is no longer counted as a separate letter. In loanwords, Cyrillic \`ц\` is written \`s\`, with \`c\` as a marked alternative.

Full letter-by-letter table, with Cyrillic equivalents, sounds and examples: ${SITE_URL}/alphabet
Printable chart (PNG and A4 PDF, MIT-licensed): ${SITE_URL}${chartPng('uz')}

## Pages

- [Converter](${SITE_URL}/): the web converter (Cyrillic / old Latin → new Latin)
- [The Uzbek alphabet](${SITE_URL}/alphabet): all ${LETTERS.length} letters, with old-Latin and Cyrillic equivalents, sounds and examples
- [Has the alphabet changed yet?](${SITE_URL}/status): the current legal status, with the date it was checked
- [The 2026 reform](${SITE_URL}/reform): what changed, letter by letter, with sources and the legislative timeline
- [Cyrillic → new Latin](${SITE_URL}/guide/cyrillic-to-latin): converter, with step-by-step instructions
- [Old Latin → new Latin](${SITE_URL}/guide/old-latin-to-new): converter, with step-by-step instructions
- [Tricky cases](${SITE_URL}/guide/tricky-cases): what letter-by-letter conversion gets wrong — s+h words, apostrophe variants, the tutuq, capitals, Cyrillic е and ц, addresses, foreign words — with Alfavit's output for each
- [How to type Ö, Ğ, Ş, Ç](${SITE_URL}/guide/keyboard): the keyboard to add, the keys and the shortcuts for the four new letters on Android, iPhone, Windows and Mac
- [Keyboard layout for Mac and Linux](${SITE_URL}/keyboard-layout): type ö, ğ, ş, ç and ʼ with Option or AltGr; no key moves, no app runs, nothing is sent anywhere
- [Янги ўзбек алифбоси](${SITE_URL}/kirill): the converter and the four changed letters, written in Uzbek Cyrillic for readers of the Cyrillic script
- [Files](${SITE_URL}/files): convert .txt, .srt, and .docx files in-browser
- [Apps & channels](${SITE_URL}/apps): web app, Telegram bot, browser extension, public API
- [Developers](${SITE_URL}/developers): free public transliteration API, no key required

## Tools

- Web converter (${SITE_URL}/; one page per direction: ${SITE_URL}/guide/cyrillic-to-latin, ${SITE_URL}/guide/old-latin-to-new, and ${SITE_URL}/kirill in Uzbek Cyrillic; also on ${SITE_URL}/alphabet): paste Cyrillic or old-Latin Uzbek and get the 2026 alphabet. It detects the script, accepts every apostrophe variant (ʻ ' ‘ ’ \`) and keeps capitals; writes Cyrillic е as ye or e by its position and ц as s; keeps s and h apart in words such as Ishoq and mushaf; leaves web addresses, emails and @handles unchanged; and leaves foreign words such as Washington as written.
- Files (${SITE_URL}/files): .docx, .txt and .srt, converted in the browser; nothing is uploaded.
- Windows and Mac apps (${SITE_URL}/apps): convert as you type, in any program, keeping your usual keyboard.
- Keyboard layout (${SITE_URL}/keyboard-layout): macOS and Linux; Option or AltGr with o, g, s, c and the apostrophe key types ö, ğ, ş, ç and ʼ. A layout file, not an app.
- Chrome extension (${EXTENSION_STORE_URL}): select text on any page and choose "Convert to new Latin" from the right-click menu, or paste into its toolbar popup. Runs on your device; no account, nothing sent.
- Telegram bot (https://t.me/alfavit_uz_bot): send it text, or type @alfavit_uz_bot followed by your text in any chat (inline mode).
- Public API: POST https://api.alfavit.uz/v1/transliterate with JSON {"text": "..."}; returns {"text", "detectedScript", "flags"}, where flags mark spellings with more than one possible answer (Cyrillic е and ц, foreign words) with the alternatives. Free, no key, 60 requests per 60 seconds per IP, up to 100,000 characters.
- npm: @alfavit/engine (MIT, the conversion engine for JavaScript; offline, no dependencies) and @alfavit/sdk (API client).

## Languages

Pages exist in Uzbek (Latin, default), Russian under \`/ru\`, and English under \`/en\` — except ${SITE_URL}/kirill, which exists only once, in Uzbek Cyrillic.
Example: ${SITE_URL}/alphabet, ${SITE_URL}/ru/alphabet, ${SITE_URL}/en/alphabet

## Attribution

Alfavit, ${SITE_URL}. Source and licence: https://github.com/AbdumajidRashidov/alfavit (MIT).
`
}
