import { createBot } from './bot'

const token = process.env.BOT_TOKEN
if (!token) {
  console.error('BOT_TOKEN is not set. Create a bot with @BotFather and set BOT_TOKEN.')
  process.exit(1)
}

const bot = createBot(token)
console.log('Alfavit bot starting (long polling)…')
void bot.start()
