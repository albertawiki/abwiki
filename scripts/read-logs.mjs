#!/usr/bin/env node
/**
 * Read the CloudFront access logs and say what people actually looked at.
 *
 * Ninety days of logs nobody reads is the same as no logs at all. This is the
 * other half of the decision to measure server-side rather than with a script
 * in the reader's browser: something has to turn the files into an answer.
 *
 *   node scripts/read-logs.mjs                 # the last 7 days
 *   node scripts/read-logs.mjs --days 30
 *   node scripts/read-logs.mjs --json
 *
 * It reports in aggregate and nothing else. Client addresses are counted and
 * never printed — the count of distinct addresses is a useful number, and the
 * addresses themselves are not this project's business. Nothing here writes a
 * profile of anybody, and it should stay that way.
 *
 * Requires the AWS CLI and credentials that can read the log bucket.
 */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { readFileSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const BUCKET = 'ab-wiki-access-logs';
const PREFIX = 'cloudfront/production/';
const REGION = 'ca-central-1';

const argv = process.argv.slice(2);
const asJSON = argv.includes('--json');

/** A numeric flag's value, or its default. Absent flags must not read argv[0]. */
function option(name, fallback) {
  const at = argv.indexOf(name);
  if (at === -1) return fallback;
  const value = Number(argv[at + 1]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

const days = option('--days', 7);
const top = option('--top', 15);

const aws = (...args) => execFileSync('aws', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });

/**
 * Requests that are not a person looking at a chart.
 *
 * Reported separately rather than dropped. A crawl is not noise — it is how
 * the site gets indexed, and watching for a social scraper is the only way to
 * tell whether a shared link previewed properly. It is just not readership.
 */
const ROBOT = /bot|crawler|spider|slurp|facebookexternalhit|embedly|preview|curl|wget|python-requests|node-fetch|headless|monitor|uptime|scan/i;

const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);

/** Log filenames carry the hour: EV8YWL5VFBSQE.2026-09-09-18.06dee929.gz */
function keysSince(from) {
  const listing = JSON.parse(
    aws('s3api', 'list-objects-v2', '--bucket', BUCKET, '--region', REGION,
      '--prefix', PREFIX, '--query', 'Contents[].Key', '--output', 'json') || 'null',
  );
  if (!listing) return [];

  return listing.filter((key) => {
    const stamp = key.match(/\.(\d{4}-\d{2}-\d{2})-\d{2}\./);
    return stamp && stamp[1] >= from;
  });
}

/** Parse one log file using its own #Fields header rather than a fixed order. */
function* records(text) {
  let fields = null;

  for (const line of text.split('\n')) {
    if (line.startsWith('#Fields:')) {
      fields = line.slice('#Fields:'.length).trim().split(/\s+/);
      continue;
    }
    if (!line || line.startsWith('#') || !fields) continue;

    const values = line.split('\t');
    if (values.length !== fields.length) continue;

    const row = {};
    fields.forEach((name, i) => { row[name] = values[i]; });
    yield row;
  }
}

const bump = (map, key, bytes = 0) => {
  const entry = map.get(key) || { requests: 0, bytes: 0 };
  entry.requests += 1;
  entry.bytes += bytes;
  map.set(key, entry);
};

const paths = new Map();
const referrers = new Map();
const statuses = new Map();
const edgeResults = new Map();
const robots = new Map();
const visitors = new Set();

let requests = 0;
let bytes = 0;
let robotRequests = 0;

const keys = keysSince(since);

if (keys.length === 0) {
  const message = `No log files since ${since}. CloudFront batches delivery, so a quiet`
    + ' site can take an hour or more to produce the first one.';
  console.log(asJSON ? JSON.stringify({ error: message }) : `\n${message}\n`);
  process.exit(0);
}

const work = mkdtempSync(join(tmpdir(), 'abwiki-logs-'));

try {
  // One sync rather than a copy per file: a week of logs is a few hundred
  // objects and the round trips dominate everything else.
  aws('s3', 'sync', `s3://${BUCKET}/${PREFIX}`, work, '--region', REGION,
    '--exclude', '*', ...keys.flatMap((k) => ['--include', k.slice(PREFIX.length)]),
    '--only-show-errors');

  for (const file of readdirSync(work).filter((f) => f.endsWith('.gz'))) {
    const text = gunzipSync(readFileSync(join(work, file))).toString('utf8');

    for (const row of records(text)) {
      const status = row['sc-status'];
      const sent = Number(row['sc-bytes']) || 0;
      const agent = decodeURIComponent(row['cs(User-Agent)'] || '');
      const path = row['cs-uri-stem'] || '';

      if (ROBOT.test(agent)) {
        robotRequests += 1;
        // The agent string's own version suffix is noise; the family is not.
        bump(robots, agent.replace(/[/;].*$/, '').slice(0, 60), sent);
        continue;
      }

      requests += 1;
      bytes += sent;

      bump(paths, path, sent);
      bump(statuses, status);
      bump(edgeResults, row['x-edge-result-type'] || '-');

      // Counted, never kept. A salted digest is enough to count distinct
      // people without this script ever holding an address it could print.
      visitors.add(createHash('sha256').update(`abwiki:${row['c-ip']}`).digest('hex').slice(0, 16));

      // Referrers are whatever a client chose to send, so they are not
      // necessarily URLs at all. One malformed value should not end the run.
      const referer = decodeURIComponent(row['cs(Referer)'] || '-');
      if (referer !== '-' && !referer.includes('alberta.wiki')) {
        try {
          bump(referrers, new URL(referer).hostname, sent);
        } catch {
          bump(referrers, '(unparseable)', sent);
        }
      }
    }
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

const ranked = (map, n = top) => [...map.entries()]
  .sort((a, b) => b[1].requests - a[1].requests)
  .slice(0, n)
  .map(([key, value]) => ({ key, ...value }));

const mib = (n) => `${(n / 1024 / 1024).toFixed(1)} MiB`;

const figures = ranked(
  new Map([...paths].filter(([path]) => path.startsWith('/f/'))),
);

if (asJSON) {
  console.log(JSON.stringify({
    since,
    days,
    files: keys.length,
    requests,
    bytes,
    visitors: visitors.size,
    robotRequests,
    paths: ranked(paths),
    figures,
    referrers: ranked(referrers),
    statuses: ranked(statuses),
    edgeResults: ranked(edgeResults),
    robots: ranked(robots, 8),
  }, null, 2));
} else {
  const table = (title, rows, withBytes = true) => {
    if (rows.length === 0) return;
    console.log(`\n${title}`);
    const width = Math.max(...rows.map((r) => r.key.length), 10);
    for (const row of rows) {
      const size = withBytes ? `  ${mib(row.bytes).padStart(10)}` : '';
      console.log(`  ${row.key.padEnd(width)}  ${String(row.requests).padStart(7)}${size}`);
    }
  };

  console.log(`\nalberta.wiki — ${days} days since ${since}, from ${keys.length} log files\n`);
  console.log(`  ${String(requests).padStart(7)}  requests from people`);
  console.log(`  ${String(visitors.size).padStart(7)}  distinct clients`);
  console.log(`  ${mib(bytes).padStart(7)}  sent`);
  console.log(`  ${String(robotRequests).padStart(7)}  requests from crawlers and scrapers, excluded below`);

  table('Figures, most read first', figures);
  table('Every path', ranked(paths));
  table('Where readers came from', ranked(referrers));
  table('Status codes', ranked(statuses, 8), false);
  table('Cache', ranked(edgeResults, 8), false);
  table('Crawlers', ranked(robots, 8));

  console.log('\nClient addresses are counted, never printed. See the header of this file.\n');
}
