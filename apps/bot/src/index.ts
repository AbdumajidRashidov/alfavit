import { createBot } from './bot'
import { applyBotConfig } from './config'

const token = process.env.BOT_TOKEN
if (!token) {
  console.error('BOT_TOKEN is not set. Create a bot with @BotFather and set BOT_TOKEN.')
  process.exit(1)
}

const bot = createBot(token)
await applyBotConfig(bot)
console.log('Alfavit bot: command menu and descriptions configured.')
void bot.start({
  onStart: (info) => console.log(`Alfavit bot live as @${info.username} (long polling).`),
})
