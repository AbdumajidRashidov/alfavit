import { expect, test } from 'vitest'
import { createApp } from '../app'

interface Point { indexes: string[]; blobs: string[]; doubles: number[] }

function fakeEnv() {
  const points: Point[] = []
  return {
    points,
    env: {
      SESSION_SECRET: 'test-secret',
      ANALYTICS: { writeDataPoint: (p: Point) => { points.push(p) } },
    },
  }
}

const get = (path: string) =>
  new Request(`https://alfavit.uz${path}`, { headers: { 'cf-connecting-ip': '213.230.90.1' } })

test('/dl/mac redirects to the hosted dmg', async () => {
  const { env } = fakeEnv()
  const res = await createApp().fetch(get('/dl/mac'), env)
  expect(res.status).toBe(302)
  expect(res.headers.get('location')).toBe('/download/Alfavit.dmg')
})

test('/dl/win redirects to the hosted exe', async () => {
  const { env } = fakeEnv()
  const res = await createApp().fetch(get('/dl/win'), env)
  expect(res.status).toBe(302)
  expect(res.headers.get('location')).toBe('/download/Alfavit-Setup.exe')
})

test('a download writes one point tagged with the platform', async () => {
  const { points, env } = fakeEnv()
  await createApp().fetch(get('/dl/mac'), env)
  expect(points).toHaveLength(1)
  expect(points[0].indexes).toEqual(['download'])
  expect(points[0].blobs[9]).toBe('mac') // blob10 detail
})

test('an unknown platform 404s and is not an open redirect', async () => {
  const { points, env } = fakeEnv()
  const res = await createApp().fetch(get('/dl/https://evil.example.com'), env)
  expect(res.status).toBe(404)
  expect(res.headers.get('location')).toBeNull()
  expect(points).toHaveLength(0)
})

test('the redirect still happens when the analytics binding is missing', async () => {
  const res = await createApp().fetch(get('/dl/win'), { SESSION_SECRET: 's' })
  expect(res.status).toBe(302)
  expect(res.headers.get('location')).toBe('/download/Alfavit-Setup.exe')
})

test('utm parameters on a download link are preserved in the data point', async () => {
  const { points, env } = fakeEnv()
  await createApp().fetch(get('/dl/mac?utm_source=telegram&utm_medium=post&utm_campaign=senate-2026-09'), env)
  expect(points[0].blobs[3]).toBe('telegram')
  expect(points[0].blobs[4]).toBe('post')
  expect(points[0].blobs[5]).toBe('senate-2026-09')
})
