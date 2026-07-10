import { expect, test } from 'vitest'
import { commandsFor } from '../config'

test('commandsFor returns start and help with localized descriptions', () => {
  const uz = commandsFor('uz')
  expect(uz.map((c) => c.command)).toEqual(['start', 'help'])
  expect(uz[0].description).toBe('Botni ishga tushirish')

  const en = commandsFor('en')
  expect(en[1]).toEqual({ command: 'help', description: 'Show how it works' })
})
