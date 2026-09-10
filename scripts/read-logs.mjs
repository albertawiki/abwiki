#!/usr/bin/env node
/**
 * Read the CloudFront access logs and say what people actually looked at.
 *
 * Ninety days of logs nobody reads is the same as no logs at all. This is the
 * other half of the decision to measure server-side rather than with a script
 * in the reader's browser: something has to turn the files into an answer.
 *
 *   node scripts/read-logs.mjs                       # the last 7 days
 *   node scripts/read-logs.mjs --days 30
 *   node scripts/read-logs.mjs --exclude-ip 1.2.3.4   # repeatable
 *   node scripts/read-logs.mjs --json
 *
 * It reports in aggregate and nothing else. Client addresses are counted and
 * never printed — the count of distinct addresses is a useful number, and the
 * addresses themselves are not this project's business. Nothing here writes a
 * profile of anybody, and it should stay that way.
 *
 * `--exclude-ip` is how a maintainer's own testing traffic comes out of the
 * "real visitor" count without that property being broken. It never prints an
 * address, including the ones it is told to exclude: it hashes each value the
 * same way visitor traffic is hashed and matches on the digest, so the tool
 * gains no capability to identify anyone it was not explicitly handed the
 * address of.
 *
 * Requires the AWS CLI and credentials that can read the log bucket.
 */

import { register } from 'node:module';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { readFileSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

register('./lib/app-modules.mjs', import.meta.url);
const { routes } = await import('../src/figures/catalogue.mjs');

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

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

/** Every value passed to a repeatable flag. */
function multiOption(name) {
  const values = [];
  argv.forEach((arg, i) => { if (arg === name) values.push(argv[i + 1]); });
  return values.filter(Boolean);
}

const days = option('--days', 7);
const top = option('--top', 15);

/** Same hash, same salt, as the one visitor counting uses below. */
const clientHash = (ip) => createHash('sha256').update(`abwiki:${ip}`).digest('hex').slice(0, 16);

const excludedHashes = new Set(multiOption('--exclude-ip').map(clientHash));

const aws = (...args) => execFileSync('aws', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });

/**
 * Requests that are not a person looking at a chart.
 *
 * Reported separately rather than dropped. A crawl is not noise — it is how
 * the site gets indexed, and watching for a social scraper is the only way to
 * tell whether a shared link previewed properly. It is just not readership.
 */
const ROBOT = /bot|crawler|spider|slurp|facebookexternalhit|embedly|preview|curl|wget|python-requests|node-fetch|headless|monitor|uptime|scan/i;

/**
 * Every path this site actually serves.
 *
 * A user-agent regex misses a scanner that spoofs a normal browser string,
 * which is common — the site gets probed for `/wp-login.php`, `/.git/config`
 * and the like by requests a keyword match never catches. Nothing on a static
 * React build lives at those paths, so a page that isn't one of these is
 * automated traffic regardless of what it claims to be, and gets reported as
 * such rather than counted as a reader.
 */
const STATIC_FILES = new Set([
  '/', '/index.html', '/manifest.json', '/robots.txt', '/sitemap.xml',
  '/asset-manifest.json', '/logo.svg', '/logo2.svg', '/logo192.png',
  '/logo512.png', '/tall_logo.png',
]);

const knownRoutes = new Set(routes());
const isKnownPath = (path) => STATIC_FILES.has(path)
  || knownRoutes.has(path)
  || path.startsWith('/static/')
  || (path.startsWith('/og/') && path.endsWith('.png'));

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
const noisePaths = new Map();
const visitors = new Set();

let requests = 0;
let bytes = 0;
let robotRequests = 0;
let noiseRequests = 0;
let excludedRequests = 0;

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

      // Checked before path-noise: a maintainer's own testing traffic to a
      // real figure page must not be reported as a scanner, and must not be
      // reported as a reader either.
      if (excludedHashes.has(clientHash(row['c-ip']))) {
        excludedRequests += 1;
        continue;
      }

      if (!isKnownPath(path)) {
        noiseRequests += 1;
        bump(noisePaths, path, sent);
        continue;
      }

      requests += 1;
      bytes += sent;

      bump(paths, path, sent);
      bump(statuses, status);
      bump(edgeResults, row['x-edge-result-type'] || '-');

      // Counted, never kept. A salted digest is enough to count distinct
      // people without this script ever holding an address it could print.
      visitors.add(clientHash(row['c-ip']));

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
    noiseRequests,
    excludedRequests,
    paths: ranked(paths),
    figures,
    referrers: ranked(referrers),
    statuses: ranked(statuses),
    edgeResults: ranked(edgeResults),
    robots: ranked(robots, 8),
    noisePaths: ranked(noisePaths, 8),
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
  console.log(`  ${String(requests).padStart(7)}  requests from people, on a real page`);
  console.log(`  ${String(visitors.size).padStart(7)}  distinct clients`);
  console.log(`  ${mib(bytes).padStart(7)}  sent`);
  console.log(`  ${String(robotRequests).padStart(7)}  requests from crawlers and scrapers (by user-agent), excluded below`);
  console.log(`  ${String(noiseRequests).padStart(7)}  requests to a path this site does not serve, excluded below`);
  if (excludedHashes.size > 0) {
    console.log(`  ${String(excludedRequests).padStart(7)}  requests from an excluded IP, left out entirely`);
  }

  table('Figures, most read first', figures);
  table('Every path', ranked(paths));
  table('Where readers came from', ranked(referrers));
  table('Status codes', ranked(statuses, 8), false);
  table('Cache', ranked(edgeResults, 8), false);
  table('Crawlers (by user-agent)', ranked(robots, 8));
  table('Scanners (by path — no route on the site matches)', ranked(noisePaths, 8));

  console.log('\nClient addresses are counted, never printed. See the header of this file.\n');
}
