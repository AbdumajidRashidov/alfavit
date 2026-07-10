import { expect, test } from 'vitest'
import { Bot } from 'grammy'
import { createBot } from '../bot'

test('createBot builds a configured Bot without starting or network', () => {
  const bot = createBot('123456:dummy-token-for-construction')
  expect(bot).toBeInstanceOf(Bot)
})
