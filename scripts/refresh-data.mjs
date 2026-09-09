#!/usr/bin/env node
/**
 * Bring the machine-readable series up to date, and say what moved.
 *
 * Two consumer debt quarters sat unfilled for months, not because the work was
 * hard but because nobody re-checked. This is the re-checking. It reads the
 * sources through `lib/compare.mjs`, which is the same code `check-sources.mjs`
 * reads them through, so the two cannot come to different views of what
 * Statistics Canada says.
 *
 *   node scripts/refresh-data.mjs            # report, change nothing
 *   node scripts/refresh-data.mjs --write    # apply the changes
 *   node scripts/refresh-data.mjs --json     # machine-readable, for the workflow
 *
 * What it will not do:
 *
 *   - **Merge anything.** `main` is protected and the point is that a person
 *     reads the diff. This writes files; the workflow opens a pull request.
 *   - **Touch a series that comes from a document.** RBC, MNP, Alberta Health,
 *     the OECD and Alberta Education publish PDFs. Nothing here can read one,
 *     so those are reported as due and left alone.
 *   - **Move `nextExpected`.** That is a claim about a publisher's calendar,
 *     which this job has no way to verify. A person moves it when they have
 *     seen the publisher say something.
 *   - **Confuse a revision with a new period.** An added year is routine. A
 *     changed value for a year already published is a correction owed to
 *     readers, and it is reported and titled as one.
 *   - **Reformat a file.** See lib/json-series.mjs: a re-serialised data file
 *     turns a one-value correction into a seventy-line diff, and the whole
 *     design here is that a person reads the diff.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { inspectAll } from './lib/compare.mjs';
import {
  rowsOf, decimalsOf, render, setValue, spliceRow, appendRow, cloneRow,
} from './lib/json-series.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const write = process.argv.includes('--write');
const asJSON = process.argv.includes('--json');

/** Every column either kind of change touches. */
const columnsTouched = (revisions, additions) => new Set([
  ...revisions.map((r) => r.column),
  ...additions.flatMap((a) => Object.keys(a.values)),
]);

/**
 * Apply one dataset's revisions and additions to its file.
 *
 * Revisions go in back to front so that the offsets of the rows still to be
 * edited are not moved by the edits already made.
 */
function apply({ entry, revisions, additions }) {
  if (revisions.length === 0 && additions.length === 0) return false;

  const path = join(root, entry.file);
  let text = readFileSync(path, 'utf8');

  const decimals = {};
  for (const column of columnsTouched(revisions, additions)) {
    decimals[column] = decimalsOf(rowsOf(text), column);
  }

  for (const revision of [...revisions].reverse()) {
    const row = rowsOf(text).find((r) => r.year === revision.year);
    const rendered = render(revision.source, decimals[revision.column]);
    text = spliceRow(text, row, setValue(row.text, revision.column, rendered));
  }

  for (const addition of additions) {
    const rows = rowsOf(text);
    const template = rows[rows.length - 1].text;
    text = appendRow(text, rows, cloneRow(template, addition.year, addition.values, decimals));
  }

  writeFileSync(path, text, 'utf8');
  return true;
}

/**
 * Record that this dataset was held against its source today.
 *
 * `lastChecked` is not the day the data changed; it is the day someone, or
 * something, confirmed the published number still matches the document it
 * cites. A run that found nothing has confirmed exactly that, so the date
 * moves either way.
 *
 * It is also the only edit most runs make, which is the point: GitHub switches
 * a scheduled workflow off after sixty days with no repository activity, and
 * sixty quiet days is precisely the stretch this job exists to cover.
 */
function stampChecked(entry, today) {
  const path = join(root, entry.module);
  const source = readFileSync(path, 'utf8');
  const pattern = /(lastChecked:\s*')(\d{4}-\d{2}-\d{2})(')/;

  const match = source.match(pattern);
  if (!match) throw new Error(`${entry.module} has no lastChecked to update`);
  if (match[2] === today) return false;

  writeFileSync(path, source.replace(pattern, `$1${today}$3`), 'utf8');
  return true;
}

const { today, results, revisions, additions, due } = await inspectAll();

const changed = [];
const stamped = [];

if (write) {
  for (const result of results) {
    if (apply(result)) changed.push(result.entry.file);
    if (stampChecked(result.entry, today)) stamped.push(result.entry.module);
  }
}

if (asJSON) {
  console.log(JSON.stringify({ today, revisions, additions, due, changed, stamped }, null, 2));
} else {
  console.log(`\nChecked ${results.length} machine-readable series against Statistics Canada.\n`);

  if (revisions.length === 0 && additions.length === 0) {
    console.log('  Nothing has moved. Every published value still matches its source.');
  }

  for (const r of revisions) {
    console.log(`  REVISED  ${r.label} · ${r.column} ${r.year}: ${r.published} is now ${r.source}`);
  }
  for (const a of additions) {
    console.log(`  NEW      ${a.label} · ${a.year}: ${JSON.stringify(a.values)}`);
  }

  if (due.length > 0) {
    console.log('\nSeries behind a document, past their expected release date:');
    for (const d of due) {
      console.log(`  DUE      ${d.label} — expected ${d.nextExpected}, last checked ${d.lastChecked}`);
    }
  }

  console.log(
    write
      ? `\n${changed.length} data file(s) rewritten; lastChecked moved to ${today} on ${stamped.length}.\n`
      : '\nNothing written. Pass --write to apply.\n',
  );
}
