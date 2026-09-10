import labourForce from './labourForce.json';

/**
 * The monthly Labour Force Survey, fetched from Statistics Canada.
 *
 * All three labour charts read from here, so they always show the same months
 * from the same release. Earlier the employment chart went through the Alberta
 * Economic Dashboard, which republishes this survey — that endpoint was
 * retired without notice and the chart rendered blank for months. Going to the
 * source removes the middle layer and the failure mode with it.
 *
 * Statistics Canada's web data service sends `Access-Control-Allow-Origin: *`,
 * so the browser can call it directly with no proxy.
 */
const WDS = 'https://www150.statcan.gc.ca/t1/wds/rest/getDataFromVectorsAndLatestNPeriods';

/**
 * How long a reader waits before the chart gives up on live data.
 *
 * `fetch` has no default timeout, so without one a slow Statistics Canada
 * leaves the promise neither resolved nor rejected — the "Loading current
 * data…" placeholder never advances, because the `.catch()` that would trigger
 * the fallback never runs. A reader gets a chart that looks broken rather than
 * the honest, sourced annual averages this fallback exists to show.
 *
 * Ten seconds, not the much longer tolerance the build's card renderer allows
 * (see scripts/render-og-images.mjs). That one runs unattended in CI, where a
 * slower answer just costs a slower build; this one runs in front of a person
 * looking at the page. The fallback is a legitimate honest answer, not a
 * degraded one, so making a live reader wait for the best case is the wrong
 * trade.
 */
const TIMEOUT_MS = 10_000;

export const VECTORS = labourForce.statcan;

/** Annual averages, used when the live call fails. */
export const labourForceFallback = labourForce.series;

const monthOf = (iso) => iso.slice(0, 7);

/**
 * Fetch the latest `months` of one or more series.
 *
 * @param {string[]} keys  Which series to fetch, e.g. ['unemploymentRate'].
 * @returns {Promise<Array<{ period: string, [key: string]: number }>>}
 *          One row per month, oldest first.
 */
export async function fetchLabourForce(keys, months = 72) {
  const wanted = keys.map((key) => ({ key, vector: VECTORS[key] }));
  const missing = wanted.filter((w) => !w.vector);
  if (missing.length) throw new Error(`No vector for ${missing.map((m) => m.key).join(', ')}`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response;
  try {
    response = await fetch(WDS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        wanted.map(({ vector }) => ({ vectorId: Number(vector.replace('v', '')), latestN: months })),
      ),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) throw new Error(`Statistics Canada returned HTTP ${response.status}`);

  const payload = await response.json();
  if (!Array.isArray(payload) || payload.length !== wanted.length) {
    throw new Error('Unexpected response shape from Statistics Canada');
  }

  // Merge the vectors on their reference month rather than by position, since
  // a series can be shorter than the others after a revision.
  const byMonth = new Map();
  payload.forEach((entry, i) => {
    if (entry.status !== 'SUCCESS') throw new Error(`Series error: ${entry.status}`);
    const { key } = wanted[i];
    entry.object.vectorDataPoint.forEach((point) => {
      if (point.value === null) return;
      const period = monthOf(point.refPer);
      if (!byMonth.has(period)) byMonth.set(period, { period });
      byMonth.get(period)[key] = point.value;
    });
  });

  const rows = [...byMonth.values()].sort((a, b) => a.period.localeCompare(b.period));
  if (rows.length === 0) throw new Error('Statistics Canada returned no observations');
  return rows;
}

/** The fallback reshaped to match what fetchLabourForce returns. */
export function fallbackRows(keys) {
  return labourForceFallback.map((row) => {
    const out = { period: String(row.year) };
    keys.forEach((key) => { out[key] = row[key]; });
    return out;
  });
}
