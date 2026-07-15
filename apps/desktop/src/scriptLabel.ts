import type { SourceScript } from '@alfavit/engine'

/** Human label for the detected source script, shown as the panel's badge. */
export function scriptLabel(script: SourceScript): string {
  switch (script) {
    case 'cyrillic':
      return 'Cyrillic'
    case 'old-latin':
      return 'Old Latin'
    default:
      return '—'
  }
}
