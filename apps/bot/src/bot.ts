import { Bot } from 'grammy'
import type { UserFromGetMe } from 'grammy/types'
import { handleMessage, buildInlineResults } from './handlers'
import { pickLocale, strings } from './i18n'

// The bot's identity, hardcoded so grammY never calls Telegram's getMe to
// initialize — eliminating a round-trip even on cold starts (serverless).
// Values from the bot's getMe; stable across token rotations (same bot id).
// Update only if the underlying bot changes.
const BOT_INFO: UserFromGetMe = {
  id: 8927758194,
  is_bot: true,
  first_name: 'Alfavit.uz',
  username: 'alfavit_uz_bot',
  can_join_groups: true,
  can_read_all_group_messages: false,
  supports_inline_queries: true,
  can_connect_to_business: false,
  has_main_web_app: false,
  has_topics_enabled: false,
  allows_users_to_create_topics: false,
  can_manage_bots: false,
  supports_join_request_queries: false,
}

/** Builds a configured bot. `logoUrl` (optional public https image) is used as the
 * inline result thumbnail. Passed in explicitly so this works both under Node
 * (process.env) and Cloudflare Workers (env bindings — no process.env). */
export function createBot(token: string, logoUrl?: string): Bot {
  const bot = new Bot(token, { botInfo: BOT_INFO })

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
