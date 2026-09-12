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

function beacon(body: unknown, headers: Record<string, string> = {}) {
  return new Request('https://alfavit.uz/e', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'cf-connecting-ip': '213.230.90.1', ...headers },
    body: JSON.stringify(body),
  })
}

const PAGEVIEW = { e: 'pageview', u: 'https://alfavit.uz/apps?utm_source=x&utm_medium=post&utm_campaign=senate-2026-09', r: 'https://t.co/abc' }

test('a valid beacon writes exactly one data point and returns 204', async () => {
  const { points, env } = fakeEnv()
  const res = await createApp().fetch(beacon(PAGEVIEW), env)
  expect(res.status).toBe(204)
  expect(points).toHaveLength(1)
})

test('the data point matches the schema positions', async () => {
  const { points, env } = fakeEnv()
  await createApp().fetch(beacon(PAGEVIEW), env)
  const [p] = points
  expect(p.indexes).toEqual(['pageview'])
  expect(p.blobs[0]).toBe('/apps')          // blob1 path
  expect(p.blobs[1]).toBe('uz')             // blob2 locale
  expect(p.blobs[2]).toBe('t.co')           // blob3 referrer host
  expect(p.blobs[3]).toBe('x')              // blob4 utm_source
  expect(p.blobs[4]).toBe('post')           // blob5 utm_medium
  expect(p.blobs[5]).toBe('senate-2026-09') // blob6 utm_campaign
  expect(p.blobs[7]).toBe('desktop')        // blob8 device (no UA -> desktop)
  expect(p.blobs[8]).toMatch(/^[0-9a-f]{16}$/) // blob9 session hash
  expect(p.doubles).toEqual([1])
})

test('the raw IP is never written', async () => {
  const { points, env } = fakeEnv()
  await createApp().fetch(beacon(PAGEVIEW), env)
  expect(JSON.stringify(points)).not.toContain('213.230.90.1')
})

test('an Android user agent is classified as mobile', async () => {
  const { points, env } = fakeEnv()
  await createApp().fetch(beacon(PAGEVIEW, { 'user-agent': 'Mozilla/5.0 (Linux; Android 13; SM-A125F)' }), env)
  expect(points[0].blobs[7]).toBe('mobile')
})

test('an iPad user agent is classified as tablet', async () => {
  const { points, env } = fakeEnv()
  await createApp().fetch(beacon(PAGEVIEW, { 'user-agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)' }), env)
  expect(points[0].blobs[7]).toBe('tablet')
})

test('an unknown event name is rejected and writes nothing', async () => {
  const { points, env } = fakeEnv()
  const res = await createApp().fetch(beacon({ ...PAGEVIEW, e: 'exfiltrate' }), env)
  expect(res.status).toBe(400)
  expect(points).toHaveLength(0)
})

test('malformed JSON is rejected and writes nothing', async () => {
  const { points, env } = fakeEnv()
  const req = new Request('https://alfavit.uz/e', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{not json',
  })
  expect((await createApp().fetch(req, env)).status).toBe(400)
  expect(points).toHaveLength(0)
})

test('a missing ANALYTICS binding degrades to 204 rather than erroring', async () => {
  const res = await createApp().fetch(beacon(PAGEVIEW), { SESSION_SECRET: 's' })
  expect(res.status).toBe(204)
})

test('GET /e is not a write path', async () => {
  const { points, env } = fakeEnv()
  const res = await createApp().fetch(new Request('https://alfavit.uz/e'), env)
  expect(res.status).toBe(405)
  expect(points).toHaveLength(0)
})
