import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  rowsOf, decimalsOf, render, setValue, spliceRow, appendRow, cloneRow,
} from './json-series.mjs';
import { machineReadable } from './series.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (file) => readFileSync(join(root, file), 'utf8');

/**
 * The writer that keeps a data file looking like itself.
 *
 * The refresh job's whole design is that a person reads the diff before a
 * number changes on the site. A writer that reflows the file turns a one-value
 * correction into a seventy-line diff, and that is the diff nobody reads
 * properly — so this is load-bearing rather than cosmetic.
 */

const COMPACT = `{
  "series": [
    { "year": 2023, "wage": 1153.90, "cpi": 164.1 },
    { "year": 2024, "wage": 1192.50, "cpi": 168.9 }
  ]
}
`;

const EXPANDED = `{
  "series": [
    {
      "year": 2023,
      "royaltiesMillions": 19045,
      "share": 25.0
    },
    {
      "year": 2024,
      "royaltiesMillions": 21808,
      "share": 26.8
    }
  ]
}
`;

test('rows are found whether they are on one line or several', () => {
  assert.deepEqual(rowsOf(COMPACT).map((r) => r.year), [2023, 2024]);
  assert.deepEqual(rowsOf(EXPANDED).map((r) => r.year), [2023, 2024]);
});

test('a brace inside a string is not a row', () => {
  const text = `{ "series": [ { "year": 2024, "note": "a { brace }" } ] }`;
  assert.equal(rowsOf(text).length, 1);
  assert.equal(rowsOf(text)[0].year, 2024);
});

test('a column padded throughout keeps its padding', () => {
  const rows = rowsOf(COMPACT);
  assert.equal(decimalsOf(rows, 'wage'), 2);
  assert.equal(render(1215.2, 2), '1215.20');
});

// The effective-industries file writes 12.86 and 13.0 side by side: one place
// always, more where the number has more. Padding to the widest would write
// 12.80 in a file that never does that; stopping at the narrowest would write
// 13 in a file that never does that either.
test('a column with a minimum width keeps the minimum, not the maximum', () => {
  const text = `{ "series": [
    { "year": 2023, "v": 12.86 },
    { "year": 2024, "v": 13.0 },
    { "year": 2025, "v": 12.8 }
  ] }`;
  const decimals = decimalsOf(rowsOf(text), 'v');

  assert.equal(decimals, 1);
  assert.equal(render(13, decimals), '13.0');
  assert.equal(render(12.8, decimals), '12.8');
  assert.equal(render(12.86, decimals), '12.86');
});

test('a null stays a null rather than becoming a zero', () => {
  assert.equal(render(null, 2), 'null');
  assert.equal(render(undefined, 2), 'null');
});

test('a string value is quoted, not rounded', () => {
  assert.equal(render('2024-25', 1), '"2024-25"');
});

test('replacing a value leaves the rest of the row alone', () => {
  const row = rowsOf(COMPACT)[1];
  assert.equal(
    setValue(row.text, 'cpi', '170.0'),
    '{ "year": 2024, "wage": 1192.50, "cpi": 170.0 }',
  );
});

test('replacing a column the row does not have is an error, not a silent miss', () => {
  assert.throws(() => setValue(rowsOf(COMPACT)[0].text, 'nope', '1'), /no "nope"/);
});

test('a spliced row changes only itself', () => {
  const rows = rowsOf(COMPACT);
  const updated = spliceRow(COMPACT, rows[0], setValue(rows[0].text, 'cpi', '164.5'));

  assert.match(updated, /"year": 2023, "wage": 1153\.90, "cpi": 164\.5/);
  assert.match(updated, /"year": 2024, "wage": 1192\.50, "cpi": 168\.9/);
  assert.equal(updated.split('\n').length, COMPACT.split('\n').length);
});

test('an appended row copies the shape and separator of the one above it', () => {
  const rows = rowsOf(EXPANDED);
  const added = cloneRow(
    rows[rows.length - 1].text,
    2025,
    { royaltiesMillions: 20000, share: 24 },
    { royaltiesMillions: 0, share: 1 },
  );
  const updated = appendRow(EXPANDED, rows, added);

  assert.equal(rowsOf(updated).length, 3);
  assert.deepEqual(
    JSON.parse(rowsOf(updated)[2].text),
    { year: 2025, royaltiesMillions: 20000, share: 24 },
  );
  // Same indentation, same expanded shape, and 24 written as this file writes
  // a whole number in that column.
  assert.match(updated, /\n      "share": 24\.0\n/);
});

test('a column the file has never carried is refused rather than invented', () => {
  assert.throws(
    () => cloneRow(rowsOf(COMPACT)[0].text, 2025, { wage: 1, surprise: 2 }, {}),
    /"surprise" column this file does not carry/,
  );
});

/**
 * The strongest check available: rebuild every row of every real data file
 * from its own parsed values and require the text to come back identical. If
 * the writer would reformat anything, it fails here rather than in a pull
 * request nobody can read.
 */
test('every committed row of every data file round-trips byte for byte', () => {
  for (const entry of machineReadable) {
    const text = read(entry.file);
    const rows = rowsOf(text);
    const columns = Object.keys(JSON.parse(rows[0].text));
    const decimals = Object.fromEntries(columns.map((c) => [c, decimalsOf(rows, c)]));
    const template = rows[rows.length - 1].text;

    for (const row of rows) {
      const { year, ...values } = JSON.parse(row.text);
      assert.equal(
        cloneRow(template, year, values, decimals),
        row.text,
        `${entry.file} row ${year} would be rewritten`,
      );
    }
  }
});
