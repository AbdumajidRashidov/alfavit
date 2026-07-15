import { webhookCallback } from 'grammy'
import { createBot } from './bot'

// Cloudflare Workers entrypoint (webhook mode). Unlike Node long-polling
// (index.ts), Workers are serverless: Telegram POSTs updates to this Worker's
// URL and grammY handles them per-request. Env comes from Worker bindings/secrets,
// NOT process.env. Set the webhook once with `pnpm --dir apps/bot setup:webhook`
// (see src/setup.ts) after deploying.

interface Env {
  BOT_TOKEN: string
  LOGO_URL?: string
}

// Cache the bot across requests on a warm isolate. A fresh `new Bot()` per
// request makes grammY call Telegram's `getMe` to initialize on every update —
// an extra round-trip per inline keystroke. Reusing the instance means the
// `getMe` init happens once per isolate, not once per request.
let bot: ReturnType<typeof createBot> | undefined

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (!env.BOT_TOKEN) return new Response('BOT_TOKEN not configured', { status: 500 })
    bot ??= createBot(env.BOT_TOKEN, env.LOGO_URL)
    return webhookCallback(bot, 'cloudflare-mod')(request)
  },
}
