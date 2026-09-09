/**
 * What the sources say, held against what the site publishes.
 *
 * One implementation, used by both `check-sources.mjs` and `refresh-data.mjs`.
 * They ask different questions of the answer — the check fails the build on a
 * revision, the refresh writes one — but they must not come to different views
 * of what Statistics Canada currently says. Two jobs with their own copies of
 * this comparison would eventually disagree, and the refresh would spend its
 * life proposing changes the check rejected.
 *
 * Three kinds of finding, and the difference between them is the whole point:
 *
 *   - **A revision** is a value we already published that the source has since
 *     changed. That is a correction owed to readers.
 *   - **An addition** is a reference period newer than anything we carry. That
 *     is routine.
 *   - **A due document** is a series behind a PDF whose expected release date
 *     has passed. Nothing here can read it; a person has to.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { fetchVectors, byYear } from './statcan.mjs';
import { machineReadable, documentSeries, sourceRows, vectorsFor } from './series.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// Enough history for the slowest-moving input. The per-capita denominator is a
// quarterly vector read once a year, so forty periods is ten years of it —
// deep enough to catch a revision to a year still on a chart, shallow enough
// to stay a single request.
const PERIODS = 40;

// Floating point, not tolerance for disagreement. A source value further from
// ours than this is a revision, however small the gap.
const EPSILON = 1e-9;

export function differs(ours, theirs) {
  if (ours === null || theirs === null || ours === undefined || theirs === undefined) {
    return (ours ?? null) !== (theirs ?? null);
  }
  if (typeof ours === 'number' && typeof theirs === 'number') {
    return Math.abs(ours - theirs) > EPSILON;
  }
  return ours !== theirs;
}

/** `lastChecked` and `nextExpected` from a data module, without running it. */
export function metaDates(modulePath) {
  const source = readFileSync(join(root, modulePath), 'utf8');
  const grab = (key) => (source.match(new RegExp(`${key}:\\s*'([^']+)'`)) || [])[1] || null;
  return { lastChecked: grab('lastChecked'), nextExpected: grab('nextExpected') };
}

/** Compare one dataset against the vectors it cites. */
export async function inspect(entry) {
  const data = JSON.parse(readFileSync(join(root, entry.file), 'utf8'));
  const byVector = await fetchVectors(vectorsFor(entry, data), PERIODS);
  const fromSource = sourceRows(entry, data, byVector, byYear);

  const latest = Math.max(...data.series.map((row) => row.year));
  const revisions = [];
  const additions = [];

  for (const row of data.series) {
    const source = fromSource[row.year];
    if (!source) continue;

    for (const [column, value] of Object.entries(source)) {
      if (differs(row[column], value)) {
        revisions.push({
          label: entry.label,
          id: entry.id,
          file: entry.file,
          year: row.year,
          column,
          published: row[column] ?? null,
          source: value,
        });
      }
    }
  }

  for (const [year, values] of Object.entries(fromSource)) {
    if (Number(year) <= latest) continue;
    additions.push({ label: entry.label, id: entry.id, file: entry.file, year: Number(year), values });
  }

  additions.sort((a, b) => a.year - b.year);

  return { entry, revisions, additions };
}

/** Every machine-readable dataset, plus the documents whose date has passed. */
export async function inspectAll(today = new Date().toISOString().slice(0, 10)) {
  const results = [];
  for (const entry of machineReadable) {
    // Sequential on purpose: the web data service rate-limits, and six
    // requests in a row is not worth being throttled for.
    results.push(await inspect(entry));
  }

  const due = documentSeries
    .map((series) => ({ ...series, ...metaDates(series.module) }))
    .filter((series) => series.nextExpected && `${series.nextExpected}-01` <= today);

  return {
    today,
    results,
    revisions: results.flatMap((r) => r.revisions),
    additions: results.flatMap((r) => r.additions),
    due,
  };
}
