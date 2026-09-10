import { fetchLabourForce, fallbackRows, VECTORS } from './labourForceApi';

/**
 * A slow Statistics Canada must become a rejected promise, not a promise that
 * never settles. `LabourRateChart` only falls back to the committed annual
 * averages when the fetch it awaits actually rejects — a hang that never
 * resolves or rejects leaves a reader staring at "Loading current data…"
 * forever, which is what happened here before this file existed.
 */

const wdsSuccess = (rows) => ({
  ok: true,
  json: () => Promise.resolve(rows.map(({ vector, points }) => ({
    status: 'SUCCESS',
    object: { vectorId: Number(vector.replace('v', '')), vectorDataPoint: points },
  }))),
});

beforeEach(() => {
  global.fetch = jest.fn();
});

test('a normal response still resolves with rows keyed by month', async () => {
  const [key, vector] = Object.entries(VECTORS)[0];
  global.fetch.mockResolvedValue(wdsSuccess([
    { vector, points: [{ refPer: '2025-06-01', value: 7.1 }, { refPer: '2025-07-01', value: 7.2 }] },
  ]));

  const rows = await fetchLabourForce([key]);

  expect(rows).toEqual([
    { period: '2025-06', [key]: 7.1 },
    { period: '2025-07', [key]: 7.2 },
  ]);
});

test('an HTTP error still rejects, same as before this change', async () => {
  global.fetch.mockResolvedValue({ ok: false, status: 503 });

  await expect(fetchLabourForce([Object.keys(VECTORS)[0]])).rejects.toThrow('503');
});

// The case this file exists to guard. A hung connection is simulated with a
// fetch that never resolves on its own, exactly like a real one that never
// answers — the only way out is the abort signal fetchLabourForce is supposed
// to pass in and act on.
test('a request that never answers is aborted rather than left pending', async () => {
  global.fetch.mockImplementation((url, { signal }) => {
    if (signal.aborted) return Promise.reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
    return new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => {
        reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
      });
      // No resolve call: this is the hang. If fetchLabourForce did not pass
      // a signal, or did not act on it, this promise — and the one under
      // test — would never settle, and the test itself would time out rather
      // than failing with a clear assertion.
    });
  });

  // Standing in for the real ten-second timer: it exists to fire the same
  // AbortController the production timer fires, immediately rather than
  // after a real wait, so this test does not spend ten real seconds proving
  // it. Whether ten seconds is the right duration is not what this test
  // checks — that the hang ends in a rejection, not silence, is.
  const realSetTimeout = global.setTimeout;
  global.setTimeout = (fn) => { fn(); return 0; };

  try {
    await expect(fetchLabourForce([Object.keys(VECTORS)[0]])).rejects.toMatchObject({ name: 'AbortError' });
  } finally {
    global.setTimeout = realSetTimeout;
  }
});

test('fallbackRows reshapes the committed annual averages to match fetchLabourForce', () => {
  const [key] = Object.keys(VECTORS);
  const rows = fallbackRows([key]);

  expect(rows.length).toBeGreaterThan(0);
  rows.forEach((row) => {
    expect(row).toHaveProperty('period');
    expect(row).toHaveProperty(key);
  });
});
