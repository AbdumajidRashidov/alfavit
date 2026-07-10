import { Bot } from 'grammy'
import { applyBotConfig } from './config'

// One-time setup for webhook (Cloudflare Workers) deployment. Run locally after
// deploying the Worker:
//   BOT_TOKEN=… WEBHOOK_URL=https://alfavit-bot.<subdomain>.workers.dev \
//     pnpm --dir apps/bot setup:webhook
// It registers the webhook and configures the command menu + descriptions.
const token = process.env.BOT_TOKEN
const url = process.env.WEBHOOK_URL
if (!token) {
  console.error('BOT_TOKEN is not set.')
  process.exit(1)
}
if (!url) {
  console.error('WEBHOOK_URL is not set (your deployed Worker URL).')
  process.exit(1)
}

const bot = new Bot(token)
await applyBotConfig(bot)
await bot.api.setWebhook(url)
console.log(`Webhook set to ${url}. Command menu and descriptions configured.`)
