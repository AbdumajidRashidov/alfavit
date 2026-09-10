import { Bot } from 'grammy'
import { applyBotConfig } from './config'

// Pushes the command menu + profile descriptions only — the webhook is untouched.
//   BOT_TOKEN=… pnpm --dir apps/bot setup:config
const token = process.env.BOT_TOKEN
if (!token) {
  console.error('BOT_TOKEN is not set.')
  process.exit(1)
}
const bot = new Bot(token)
await applyBotConfig(bot)
console.log('Command menu and descriptions configured.')
