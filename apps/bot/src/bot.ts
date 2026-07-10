import { Bot } from 'grammy'
import { handleMessage, buildInlineResults } from './handlers'
import { pickLocale, strings } from './i18n'

export function createBot(token: string): Bot {
  const bot = new Bot(token)

  // Commands are registered BEFORE the text handler so a "/start" message is
  // handled here and does not fall through to the conversion handler.
  bot.command('start', (ctx) => ctx.reply(strings[pickLocale(ctx.from?.language_code)].start))
  bot.command('help', (ctx) => ctx.reply(strings[pickLocale(ctx.from?.language_code)].help))

  // LOGO_URL (optional): a public https image URL used as the inline result thumbnail.
  bot.on('inline_query', (ctx) =>
    ctx.answerInlineQuery(
      buildInlineResults(ctx.inlineQuery.query, pickLocale(ctx.from?.language_code), process.env.LOGO_URL),
      { cache_time: 0 },
    ),
  )

  bot.on('message:text', (ctx) => {
    if (ctx.message.text.startsWith('/')) return // ignore other commands
    return ctx.reply(handleMessage(ctx.message.text, pickLocale(ctx.from?.language_code)))
  })

  return bot
}
