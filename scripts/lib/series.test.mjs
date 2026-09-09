import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { byYear } from './statcan.mjs';
import {
  machineReadable, documentSeries, sourceRows, derive, effectiveIndustries, vectorsFor,
} from './series.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (file) => JSON.parse(readFileSync(join(root, file), 'utf8'));

/**
 * How the refresh job reads a source.
 *
 * Nothing here touches the network. What is worth testing is the arithmetic
 * and the judgement — which reference period represents a year, when a year is
 * complete enough to publish, and how a derived column is worked out — because
 * those are the parts that go wrong quietly. A wrong number that came from the
 * right vector still looks like data.
 */

const points = (pairs) => pairs.map(([refPer, value]) => ({
  year: Number(refPer.slice(0, 4)),
  month: refPer.slice(5, 7),
  value,
}));

test('every registered dataset points at files that exist', () => {
  for (const entry of [...machineReadable, ...documentSeries]) {
    if (entry.file) assert.ok(existsSync(join(root, entry.file)), `${entry.file} is missing`);
    assert.ok(existsSync(join(root, entry.module)), `${entry.module} is missing`);
  }
});

// Every dataset on the site is either checkable against an API or behind a
// document a person has to read. A dataset in neither list is one nothing is
// watching, which is the failure this whole job exists to prevent.
test('every dataset on the site is in one list or the other', () => {
  const registry = readFileSync(join(root, 'src/data/index.js'), 'utf8');
  const modules = [...registry.matchAll(/from '\.\/([^']+)'/g)]
    .map((m) => `src/data/${m[1]}.js`)
    // The labour force figures come live from the API on every page load, so
    // there is no committed series for anything to refresh.
    .filter((path) => !path.endsWith('labourForceApi.js'));

  const watched = new Set([...machineReadable, ...documentSeries].map((e) => e.module));
  const unwatched = modules.filter((path) => !watched.has(path));

  // Employment and Unemployment read the live API; the diversification module
  // is registered once and carries two datasets.
  const known = new Set([
    'src/data/economy/Employment.js',
    'src/data/economy/Unemployment.js',
  ]);

  assert.deepEqual(unwatched.filter((path) => !known.has(path)), []);
});

test('a quarterly vector read annually is read at the quarter the file declares', () => {
  const entry = { recipe: 'vector-per-column', required: ['debt'], file: 'x.json' };
  const data = { statcan: { debt: 'v1' }, statcanPeriod: { debt: '10' } };
  const byVector = {
    v1: points([['2025-01', 166.8], ['2025-04', 167.0], ['2025-07', 154.3], ['2025-10', 157.5]]),
  };

  assert.deepEqual(sourceRows(entry, data, byVector, byYear), { 2025: { debt: 157.5 } });
});

// Without a declared period the last observation in the year wins. For an
// annual vector that is the only observation and therefore right; for a
// quarterly one read in the middle of a year it is whichever quarter happened
// to be released, which is how a run in June comes to publish Q2 as the year.
//
// Two files read a vector published more often than they show it, and both
// have to say which period they mean.
test('a file reading a higher-frequency vector pins the period it means', () => {
  for (const file of ['src/data/economy/householdDebt.json', 'src/data/economy/gdpPerCapita.json']) {
    const data = read(file);
    const declared = Object.keys(data.statcanPeriod || {});
    const unpinned = Object.keys(data.statcan).filter((column) => !declared.includes(column));

    assert.deepEqual(unpinned, [], `${file} leaves a column's reference period to chance`);
  }
});

test('a year missing a required column is left out rather than written with a hole', () => {
  const entry = { recipe: 'vector-per-column', required: ['a', 'b'], file: 'x.json' };
  const data = { statcan: { a: 'v1', b: 'v2' } };
  const byVector = {
    v1: points([['2024-01', 1], ['2025-01', 2]]),
    v2: points([['2024-01', 10]]),
  };

  assert.deepEqual(sourceRows(entry, data, byVector, byYear), { 2024: { a: 1, b: 10 } });
});

// The 2018-base poverty line was discontinued and is legitimately null from
// 2024. Requiring every column would mean no poverty year is ever added again.
test('a discontinued column is a null in the row, not a reason to drop the year', () => {
  const entry = { recipe: 'vector-per-column', required: ['current'], file: 'x.json' };
  const data = { statcan: { retired: 'v1', current: 'v2' } };
  const byVector = {
    v1: points([['2024-01', null]]),
    v2: points([['2024-01', 11]]),
  };

  assert.deepEqual(sourceRows(entry, data, byVector, byYear), {
    2024: { retired: null, current: 11 },
  });
});

test('per-person figures are recomputed from their inputs, not carried over', () => {
  const row = { realGdpMillions: 367719, population: 4909030 };
  assert.equal(derive('src/data/economy/gdpPerCapita.json', row, 2024).perCapita, 74907);
});

test('the revenue share is recomputed, and its fiscal year label is derived', () => {
  const row = { royaltiesMillions: 21808, totalRevenueMillions: 81235 };
  const derived = derive('src/data/economy/resourceRevenue.json', row, 2024);

  assert.equal(derived.share, 26.8);
  assert.equal(derived.fiscalYear, '2024-25');
});

// Pasting the label's suffix onto the first year's century turns 1999-00 into
// 1900. The second year is the first plus one.
test('a fiscal label crossing a century names the right second year', () => {
  const row = { royaltiesMillions: 1, totalRevenueMillions: 2 };
  assert.equal(derive('src/data/economy/resourceRevenue.json', row, 1999).fiscalYear, '1999-00');
  assert.equal(derive('src/data/economy/resourceRevenue.json', row, 2008).fiscalYear, '2008-09');
});

test('nineteen equal industries score nineteen', () => {
  assert.equal(effectiveIndustries(Array(19).fill(100)), 19);
});

test('one industry employing everyone scores one', () => {
  assert.equal(effectiveIndustries([500, 0, 0, 0]), 1);
});

test('the effective-industries recipe asks for every province and industry', () => {
  const entry = machineReadable.find((e) => e.recipe === 'effective-industries');
  const data = read(entry.file);

  assert.equal(vectorsFor(entry, data).length, 95);
  assert.equal(new Set(vectorsFor(entry, data)).size, 95);
});

// One missing industry does not make the index slightly small, it makes it
// wrong: it changes the denominator every share is taken over. A part year is
// a different question, not a smaller answer.
test('a province missing one industry drops the whole year', () => {
  const entry = { recipe: 'effective-industries', file: 'x.json' };
  const data = { statcan: { alberta: { a: 'v1', b: 'v2' }, ontario: { a: 'v3', b: 'v4' } } };
  const byVector = {
    v1: points([['2024-01', 100], ['2025-01', 100]]),
    v2: points([['2024-01', 100], ['2025-01', 100]]),
    v3: points([['2024-01', 100], ['2025-01', 100]]),
    v4: points([['2024-01', 100]]),
  };

  assert.deepEqual(Object.keys(sourceRows(entry, data, byVector, byYear)), ['2024']);
});
