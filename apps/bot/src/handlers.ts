import { InlineQueryResultBuilder } from 'grammy'
import type { InlineQueryResult } from 'grammy/types'
import { transliterate } from '@alfavit/engine'
import { strings, type Locale } from './i18n'

export const MAX_INPUT = 4000

export function handleMessage(text: string, locale: Locale): string {
  const capped = text.slice(0, MAX_INPUT)
  if (!capped.trim()) return strings[locale].emptyHint
  return transliterate(capped).text
}

export function buildInlineResults(query: string, locale: Locale, logoUrl?: string): InlineQueryResult[] {
  const withThumb = (description: string) =>
    logoUrl ? { description, thumbnail_url: logoUrl } : { description }
  const capped = query.slice(0, MAX_INPUT)
  if (!capped.trim()) {
    const hint = strings[locale].emptyHint
    return [InlineQueryResultBuilder.article('empty', strings[locale].inlineEmptyTitle, withThumb(hint)).text(hint)]
  }
  const converted = transliterate(capped).text
  const preview = converted.slice(0, 100)
  return [InlineQueryResultBuilder.article('convert', strings[locale].inlineTitle, withThumb(preview)).text(converted)]
}
