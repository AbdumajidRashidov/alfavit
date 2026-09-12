#!/usr/bin/env node
/**
 * Prints the weekly review block defined in docs/marketing/metrics.md.
 *
 * Analytics Engine retains three months, so this output — pasted into
 * metrics.md — is the durable record, not the dataset.
 *
 * Requires, in the local environment only (never in CI):
 *   CLOUDFLARE_ACCOUNT_ID
 *   CLOUDFLARE_ANALYTICS_TOKEN   (Account > Account Analytics > Read)
 */

const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID
const TOKEN = process.env.CLOUDFLARE_ANALYTICS_TOKEN

if (!ACCOUNT || !TOKEN) {
  console.error('Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_ANALYTICS_TOKEN, then re-run.')
  process.exit(1)
}

const ENDPOINT = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/analytics_engine/sql`

/** @param {string} sql @returns {Promise<Array<Record<string, string|number>>>} */
async function query(sql) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}` },
    body: sql,
  })
  if (!res.ok) {
    console.error(`Query failed (${res.status}): ${await res.text()}`)
    process.exit(1)
  }
  const json = await res.json()
  return json.data ?? []
}

const WEEK = "timestamp > NOW() - INTERVAL '7' DAY"

const counts = await query(`
  SELECT index1 AS event, sum(_sample_interval) AS n
  FROM alfavit_events
  WHERE ${WEEK}
  GROUP BY event
  ORDER BY n DESC
`)

const sources = await query(`
  SELECT blob3 AS referrer, blob4 AS source, blob5 AS medium, blob6 AS campaign,
         sum(_sample_interval) AS n
  FROM alfavit_events
  WHERE ${WEEK} AND index1 = 'pageview'
  GROUP BY referrer, source, medium, campaign
  ORDER BY n DESC
  LIMIT 10
`)

const paths = await query(`
  SELECT blob1 AS path, sum(_sample_interval) AS n
  FROM alfavit_events
  WHERE ${WEEK} AND index1 = 'pageview'
  GROUP BY path
  ORDER BY n DESC
  LIMIT 10
`)

const downloads = await query(`
  SELECT blob10 AS platform, sum(_sample_interval) AS n
  FROM alfavit_events
  WHERE ${WEEK} AND index1 = 'download'
  GROUP BY platform
  ORDER BY n DESC
`)

const devices = await query(`
  SELECT blob8 AS device, sum(_sample_interval) AS n
  FROM alfavit_events
  WHERE ${WEEK} AND index1 = 'pageview'
  GROUP BY device
  ORDER BY n DESC
`)

const countries = await query(`
  SELECT blob7 AS country, sum(_sample_interval) AS n
  FROM alfavit_events
  WHERE ${WEEK} AND index1 = 'pageview'
  GROUP BY country
  ORDER BY n DESC
  LIMIT 8
`)

// Unique sessions: group, then count rows in JS rather than COUNT(DISTINCT),
// whose Analytics Engine support was not verified. At a few hundred visits a
// week the row count is trivial; collapse this if COUNT(DISTINCT) is confirmed.
const sessionRows = await query(`
  SELECT blob9 AS session
  FROM alfavit_events
  WHERE ${WEEK} AND index1 = 'pageview'
  GROUP BY session
`)

/** @param {string} event */
const n = (event) => Number(counts.find((r) => r.event === event)?.n ?? 0)

/** @param {Array<Record<string, string|number>>} rows @param {string} key */
const line = (rows, key) =>
  rows.length ? rows.map((r) => `${r[key] || '(none)'} ${r.n}`).join(' · ') : '—'

const visits = sessionRows.length
const converted = n('transliterate')
const rate = visits ? ((converted / visits) * 100).toFixed(1) : '0.0'
const today = new Date().toISOString().slice(0, 10)

console.log(`
### Week of ${today}

Visits (7d): ${visits}   Pageviews: ${n('pageview')}
Transliterations: ${converted}   → ${rate}% of visits used the converter
File conversions: ${n('file_convert')}   Copies: ${n('copy')}
Downloads: ${line(downloads, 'platform')}
Outbound clicks: ${n('outbound')}
Devices: ${line(devices, 'device')}
Countries: ${line(countries, 'country')}

Top sources:
${sources.map((r) => `  ${r.referrer} | ${r.source || '—'}/${r.medium || '—'}/${r.campaign || '—'} — ${r.n}`).join('\n') || '  —'}

Top paths:
${paths.map((r) => `  ${r.path} — ${r.n}`).join('\n') || '  —'}

What moved and why (2 sentences):

One thing to try next week:

Bugs / feedback worth fixing (link issues):
`)
