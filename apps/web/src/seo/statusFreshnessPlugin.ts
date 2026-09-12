import type { Plugin } from 'vite'
import { CHECKED_ON, MAX_AGE_DAYS, STAGE } from '../content/status'

/**
 * Whole days between an ISO date and now, both read as UTC.
 *
 * CHECKED_ON is written by a human in their own timezone — Tashkent is UTC+5 —
 * so on a machine running UTC this can legitimately come back as -1 on the day
 * the date is set. That slop is irrelevant to the guard, which only cares about
 * ages in the tens of days, but it is why callers must not assume a floor of 0.
 */
export function daysSince(isoDate: string, now: Date = new Date()): number {
  const then = Date.parse(`${isoDate}T00:00:00Z`)
  if (Number.isNaN(then)) throw new Error(`status.ts: CHECKED_ON is not an ISO date: "${isoDate}"`)
  return Math.floor((now.getTime() - then) / 86_400_000)
}

export function stalenessError(age: number): string {
  return [
    '',
    `  /status has not been verified in ${age} days (limit ${MAX_AGE_DAYS}).`,
    '',
    `  It currently tells every reader and every language model: "${STAGE}".`,
    '  That page is the one most likely to be quoted, and a wrong answer there',
    '  is worse than no page at all.',
    '',
    '  Check the sources in src/content/sources.ts, then in src/content/status.ts:',
    '    - set STAGE if the law has moved on',
    '    - set CHECKED_ON to today either way',
    '',
  ].join('\n')
}

/**
 * Fails the build when the reform status has gone unverified for too long.
 *
 * CI runs `pnpm build`, so a stale status page cannot reach production. The
 * check is deliberately a build failure and not a warning: a warning in a log
 * nobody reads is the same as no check.
 */
export function statusFreshnessPlugin(): Plugin {
  return {
    name: 'alfavit-status-freshness',
    apply: 'build',
    buildStart() {
      const age = daysSince(CHECKED_ON)
      if (age > MAX_AGE_DAYS) this.error(stalenessError(age))
    },
  }
}
