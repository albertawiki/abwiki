import test from 'node:test';
import assert from 'node:assert/strict';

import { fetchVectors, byYear } from './statcan.mjs';

/**
 * Reaching Statistics Canada, and telling the two kinds of failure apart.
 *
 * The exit codes exist to separate "a published figure no longer matches its
 * source", which is a correction owed to readers, from "the source did not
 * answer", which is a fact about the network and nothing to do with the data.
 * A run that conflates them teaches people to ignore the alert, so the
 * classification is worth testing rather than assuming.
 */

const withFetch = async (stub, body) => {
  const real = globalThis.fetch;
  globalThis.fetch = stub;
  try {
    return await body();
  } finally {
    globalThis.fetch = real;
  }
};

const caught = async (promise) => {
  try {
    await promise;
    return null;
  } catch (error) {
    return error;
  }
};

test('a refused connection is a transport failure, not a data finding', async () => {
  const error = await withFetch(
    () => Promise.reject(new TypeError('fetch failed')),
    () => caught(fetchVectors(['v1'], 1)),
  );

  assert.ok(error, 'expected it to throw');
  assert.equal(error.transport, true);
  // The message has to name the source rather than the script. A bare "fetch
  // failed" reads as a bug in here, which is exactly the wrong conclusion.
  assert.match(error.message, /Statistics Canada WDS did not answer/);
});

test('an HTTP error is also a transport failure', async () => {
  const error = await withFetch(
    () => Promise.resolve({ ok: false, status: 503 }),
    () => caught(fetchVectors(['v1'], 1)),
  );

  assert.equal(error.transport, true);
  assert.match(error.message, /503/);
});

// A vector the caller asked for and did not get back is a data problem: the
// series has been withdrawn or renumbered, and that is a correction to make.
test('a missing vector is a data problem, not a transport one', async () => {
  const error = await withFetch(
    () => Promise.resolve({
      ok: true,
      json: () => Promise.resolve([]),
    }),
    () => caught(fetchVectors(['v999'], 1)),
  );

  assert.ok(error);
  assert.notEqual(error.transport, true);
  assert.match(error.message, /v999/);
});

test('a recovered connection is not reported at all', async () => {
  let attempts = 0;
  const rows = await withFetch(
    () => {
      attempts += 1;
      if (attempts === 1) return Promise.reject(new TypeError('fetch failed'));
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{
          status: 'SUCCESS',
          object: {
            vectorId: 1,
            vectorDataPoint: [{ refPer: '2025-01-01', value: 42 }],
          },
        }]),
      });
    },
    () => fetchVectors(['v1'], 1),
  );

  assert.equal(attempts, 2, 'expected one retry');
  assert.deepEqual(rows.v1, [{ year: 2025, month: '01', value: 42 }]);
});

test('a year is read at the reference period the caller names', () => {
  const points = [
    { year: 2025, month: '01', value: 1 },
    { year: 2025, month: '07', value: 2 },
    { year: 2025, month: '10', value: 3 },
  ];

  assert.deepEqual(byYear(points, '07'), { 2025: 2 });
  assert.deepEqual(byYear(points, '10'), { 2025: 3 });
  // No period named: the last observation in the year wins, which is only
  // right for a vector published once a year.
  assert.deepEqual(byYear(points), { 2025: 3 });
});
