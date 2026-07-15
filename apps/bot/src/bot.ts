import { Bot } from 'grammy'
import { handleMessage, buildInlineResults } from './handlers'
import { pickLocale, strings } from './i18n'

/** Builds a configured bot. `logoUrl` (optional public https image) is used as the
 * inline result thumbnail. Passed in explicitly so this works both under Node
 * (process.env) and Cloudflare Workers (env bindings — no process.env). */
export function createBot(token: string, logoUrl?: string): Bot {
  const bot = new Bot(token)

  // Commands are registered BEFORE the text handler so a "/start" message is
  // handled here and does not fall through to the conversion handler.
  bot.command('start', (ctx) => ctx.reply(strings[pickLocale(ctx.from?.language_code)].start))
  bot.command('help', (ctx) => ctx.reply(strings[pickLocale(ctx.from?.language_code)].help))

  bot.on('inline_query', (ctx) =>
    ctx.answerInlineQuery(
      buildInlineResults(ctx.inlineQuery.query, pickLocale(ctx.from?.language_code), logoUrl),
      // Conversion is deterministic, so let Telegram cache identical queries.
      // 5 min is long enough to help yet short enough that engine fixes propagate.
      { cache_time: 300 },
    ),
  )

  bot.on('message:text', (ctx) => {
    if (ctx.message.text.startsWith('/')) return // ignore other commands
    return ctx.reply(handleMessage(ctx.message.text, pickLocale(ctx.from?.language_code)))
  })

  return bot
}
