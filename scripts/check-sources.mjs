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
 *      error, it is a to-do, and it is reported as one. `refresh-data.mjs` is
 *      the thing that acts on it.
 *
 * The comparison itself lives in `lib/compare.mjs`, shared with the refresh
 * job. Two jobs with their own copies of it would eventually disagree, and a
 * refresh proposing changes that the check then rejects is worse than either
 * of them alone.
 *
 * Only sources with a machine-readable API are checked here. Series that come
 * from PDFs (RBC, MNP, Alberta Health, Alberta Find a Doctor, the OECD, CMEC,
 * Alberta Education) are listed at the end with the date a maintainer last
 * verified them, so nothing quietly goes stale.
 *
 *   node scripts/check-sources.mjs           # human-readable report
 *   node scripts/check-sources.mjs --json    # machine-readable, for CI
 */

import { inspectAll } from './lib/compare.mjs';

async function main() {
  const asJSON = process.argv.includes('--json');
  const { results, revisions, additions, due } = await inspectAll();

  // The published field names are `changed` and `missing`; the workflows read
  // them and there is no reason to make them read something else today.
  const changed = revisions;
  const missing = additions;

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
      for (const m of missing) {
        console.log(`  NEW  ${m.label} · ${m.year} = ${JSON.stringify(m.values)}`);
      }
    }

    if (due.length > 0) {
      console.log('\nManually maintained series past their expected release date:');
      for (const d of due) {
        console.log(`  DUE  ${d.label} — expected ${d.nextExpected}, last checked ${d.lastChecked}`);
      }
    }

    console.log(`\n${results.length} series checked.\n`);
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
