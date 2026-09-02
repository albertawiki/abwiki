#!/usr/bin/env node
/**
 * Check the numbers we publish against the sources they came from.
 *
 * This is the automation that keeps a curated data site honest. It answers
 * two questions on every run:
 *
 *   1. Has a published figure changed at the source? Statistics Canada revises
 *      series. If a number we show no longer matches the table it cites, that
 *      is a correction we owe readers, and this exits non-zero.
 *
 *   2. Is there a newer observation we have not picked up yet? That is not an
 *      error, it is a to-do, and it is reported as one.
 *
 * Only sources with a machine-readable API are checked here. Series that come
 * from PDFs (RBC, MNP, Alberta Health, OECD) are listed at the end with the
 * date a maintainer last verified them, so nothing quietly goes stale.
 *
 *   node scripts/check-sources.mjs           # human-readable report
 *   node scripts/check-sources.mjs --json    # machine-readable, for CI
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJSON = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

const WDS = 'https://www150.statcan.gc.ca/t1/wds/rest/getDataFromVectorsAndLatestNPeriods';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch the latest N annual observations for a set of StatCan vectors.
 *
 * WDS rate-limits, and a weekly job that reports "could not verify" as though
 * it were "a figure is wrong" is worse than no job at all — it teaches people
 * to ignore the alert. Back off and retry; if it still will not answer, say so
 * as a transport problem rather than a data problem.
 */
async function fetchVectors(vectorIds, latestN = 20) {
  const body = vectorIds.map((v) => ({ vectorId: Number(v.replace('v', '')), latestN }));

  let response;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    response = await fetch(WDS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (response.ok) break;
    if (response.status !== 429 && response.status < 500) break;
    if (attempt < 3) await sleep(2 ** attempt * 2000);
  }

  if (!response.ok) {
    const error = new Error(`Statistics Canada WDS returned HTTP ${response.status}`);
    error.transport = true;
    throw error;
  }

  const payload = await response.json();
  const byVector = {};
  for (const entry of payload) {
    if (entry.status !== 'SUCCESS') throw new Error(`WDS error for a vector: ${entry.status}`);
    const { vectorId, vectorDataPoint } = entry.object;
    byVector[`v${vectorId}`] = Object.fromEntries(
      vectorDataPoint.map((p) => [Number(p.refPer.slice(0, 4)), p.value]),
    );
  }
  return byVector;
}

/**
 * Compare one committed column against the source vector it cites.
 * Returns { changed, missing } — changed is a correction, missing is a to-do.
 */
function compare({ label, committed, source, column, tolerance = 0.001 }) {
  const changed = [];
  for (const row of committed) {
    const ours = row[column];
    if (ours === null || ours === undefined) continue;
    const theirs = source[row.year];
    if (theirs === undefined) continue;
    if (Math.abs(ours - theirs) > tolerance) {
      changed.push({ label, column, year: row.year, published: ours, source: theirs });
    }
  }

  // A vector can carry a null for a year the agency did not publish (a rebased
  // measure has no back series). That is not a new observation for us to add.
  const ourYears = new Set(committed.filter((r) => r[column] !== null).map((r) => r.year));
  const latestOurs = Math.max(...ourYears);
  const missing = Object.entries(source)
    .filter(([year, value]) => value !== null && Number(year) > latestOurs)
    .map(([year, value]) => ({ label, column, year: Number(year), source: value }));

  return { changed, missing };
}

/** Series we can check automatically, and the column each vector backs. */
const checks = [
  { file: 'src/data/affordability/wages.json', label: 'Median weekly wage' },
  { file: 'src/data/affordability/poverty.json', label: 'Poverty and food insecurity' },
  { file: 'src/data/economy/householdDebt.json', label: 'Household debt to income' },
];

/** Series behind PDFs. Not checkable — reported so they are not forgotten. */
const manualSeries = [
  { label: 'Housing affordability (RBC)', module: 'src/data/affordability/HousingAffordabilityData.js' },
  { label: 'Consumer debt (MNP/Ipsos)', module: 'src/data/affordability/ConsumerDebt.js' },
  { label: 'ER wait times (Alberta Health)', module: 'src/data/healthcare/ERData.js' },
  { label: 'Accepting providers (Alberta Find a Doctor)', module: 'src/data/healthcare/FamilyDoctorData.js' },
  { label: 'PISA (OECD)', module: 'src/data/education/PISA.js' },
];

/** Pull lastChecked / nextExpected out of a data module without executing it. */
function readMetaDates(modulePath) {
  const source = readFileSync(join(root, modulePath), 'utf8');
  const grab = (key) => (source.match(new RegExp(`${key}:\s*'([^']+)'`)) || [])[1] || null;
  return { lastChecked: grab('lastChecked'), nextExpected: grab('nextExpected') };
}

async function main() {
  const asJSON = process.argv.includes('--json');
  const changed = [];
  const missing = [];

  for (const { file, label } of checks) {
    const data = readJSON(file);
    const vectors = Object.entries(data.statcan);
    const source = await fetchVectors(vectors.map(([, v]) => v));

    for (const [column, vector] of vectors) {
      const result = compare({ label, committed: data.series, source: source[vector], column });
      changed.push(...result.changed);
      missing.push(...result.missing);
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const due = manualSeries
    .map((s) => ({ ...s, ...readMetaDates(s.module) }))
    .filter((s) => s.nextExpected && `${s.nextExpected}-01` <= today);

  if (asJSON) {
    console.log(JSON.stringify({ changed, missing, due }, null, 2));
  } else {
    console.log('\nChecked published figures against Statistics Canada.\n');

    if (changed.length === 0) console.log('  OK   Every checkable figure still matches its source.');
    for (const c of changed) {
      console.log(`  DIFF ${c.label} · ${c.column} ${c.year}: we publish ${c.published}, source now says ${c.source}`);
    }

    if (missing.length > 0) {
      console.log('\nNew observations available:');
      for (const m of missing) console.log(`  NEW  ${m.label} · ${m.column} ${m.year} = ${m.source}`);
    }

    if (due.length > 0) {
      console.log('\nManually maintained series past their expected release date:');
      for (const d of due) {
        console.log(`  DUE  ${d.label} — expected ${d.nextExpected}, last checked ${d.lastChecked}`);
      }
    }
    console.log('');
  }

  // A revision is a correction we owe readers, so it fails. A new observation
  // or an overdue PDF is work to schedule, not a broken build.
  process.exit(changed.length > 0 ? 1 : 0);
}

main().catch((error) => {
  // Exit codes are meaningful to the workflows: 1 means a published figure no
  // longer matches its source and we owe readers a correction; 2 means we could
  // not reach the source and nothing was checked. Do not conflate them.
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ error: error.message, changed: [], missing: [], due: [] }, null, 2));
  }
  console.error(
    error.transport
      ? `Could not reach the source, so nothing was checked: ${error.message}`
      : `check-sources failed: ${error.message}`,
  );
  process.exit(2);
});
