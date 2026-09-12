import { describe, expect, test } from 'vitest'
import { STAGE } from '../content/status'
import { timeline } from '../content/timeline'
import { faq } from '../content/faq'
import { translations } from '../i18n/translations'
import { LOCALES } from '../i18n/translations'

/**
 * Catches the failure mode the signature drill found.
 *
 * Flipping STAGE updates /status and everything derived from it, but a lot of
 * prose about the reform is editorial and cannot be derived: the timeline's
 * "next step", the reform FAQ, the news strip. On the day the President signs,
 * those would quietly keep saying the law is still waiting — on the same site
 * whose /status page says it is not.
 *
 * So: the moment STAGE moves past 'awaiting-signature', any string still
 * phrased as "waiting for the signature" fails this test, with a pointer to
 * the runbook.
 */
const AWAITING_PHRASES: Record<string, RegExp> = {
  en: /awaits the President|Presidential signature and official publication|has not been signed/i,
  uz: /Prezident imzosi(ni| va|\b)|imzolagach|imzosi kutilmoqda|hali imzolanmagan/i,
  ru: /Подпись Президента|ждёт подписи|ожидает подписи|ещё не подписан/i,
}

/** Every user-facing string that talks about the reform's progress. */
function progressStrings(locale: (typeof LOCALES)[number]): [string, string][] {
  const out: [string, string][] = []
  for (const step of timeline[locale]) out.push([`timeline.ts (${step.date})`, step.body])
  for (const item of faq[locale]) out.push([`faq.ts (${item.q.slice(0, 40)})`, item.a])
  for (const key of ['reform.law', 'news.senate'] as const) {
    out.push([`translations.ts ${locale}.${key}`, translations[locale][key]])
  }
  return out
}

describe('signature drift', () => {
  test('editorial prose agrees with STAGE', () => {
    if (STAGE === 'awaiting-signature') {
      // Nothing to check: the prose and the stage both say "not yet".
      expect(STAGE).toBe('awaiting-signature')
      return
    }

    const stale: string[] = []
    for (const locale of LOCALES) {
      for (const [where, text] of progressStrings(locale)) {
        if (AWAITING_PHRASES[locale].test(text)) stale.push(`${where}: "${text.slice(0, 80)}…"`)
      }
    }

    expect(
      stale,
      `STAGE is "${STAGE}" but these still say the law is awaiting signature.\n` +
        `See docs/signature-runbook.md.\n\n  ${stale.join('\n  ')}\n`,
    ).toEqual([])
  })

  test('the phrase list actually matches the current prose', () => {
    // Guards the guard: if someone rewords the timeline, the patterns above go
    // silently dead and the test above would pass on the signature day for the
    // wrong reason. While STAGE is 'awaiting-signature', each locale must match
    // somewhere.
    if (STAGE !== 'awaiting-signature') return
    for (const locale of LOCALES) {
      const hit = progressStrings(locale).some(([, text]) => AWAITING_PHRASES[locale].test(text))
      expect(hit, `no "awaiting signature" phrasing found for ${locale} — update AWAITING_PHRASES`).toBe(
        true,
      )
    }
  })
})
