/**
 * Talking to the Statistics Canada web data service.
 *
 * Extracted from check-sources.mjs so that the refresh job reads the sources
 * exactly the way the check does. Two jobs that fetch the same numbers by
 * slightly different rules is how a refresh comes to disagree with the check
 * that is supposed to police it.
 */

const WDS = 'https://www150.statcan.gc.ca/t1/wds/rest/getDataFromVectorsAndLatestNPeriods';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch the latest N observations for a set of vectors.
 *
 * WDS rate-limits, and a scheduled job that reports "could not verify" as
 * though it were "a figure is wrong" is worse than no job at all — it teaches
 * people to ignore the alert. Back off and retry; if it still will not answer,
 * throw something marked as a transport failure so the caller can exit with a
 * code that means "nothing was checked" rather than "something is wrong".
 */
export async function fetchVectors(vectorIds, latestN = 20) {
  const unique = [...new Set(vectorIds)];
  const body = unique.map((v) => ({ vectorId: Number(String(v).replace('v', '')), latestN }));

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
    // Keep every reference period. A quarterly or monthly vector used at annual
    // frequency has to be read at the right month: the per-capita denominator
    // takes 1 July, not whichever quarter happens to be published last.
    byVector[`v${vectorId}`] = vectorDataPoint.map((p) => ({
      year: Number(p.refPer.slice(0, 4)),
      month: p.refPer.slice(5, 7),
      value: p.value,
    }));
  }

  // A vector that came back empty is not the same as one that came back with
  // nothing new, and only the caller can tell which vectors it asked for.
  const absent = unique.filter((v) => !byVector[v]);
  if (absent.length > 0) throw new Error(`WDS returned nothing for: ${absent.join(', ')}`);

  return byVector;
}

/**
 * Collapse a vector's observations to one value per year.
 *
 * `month` selects which reference period represents the year, for a source
 * published more often than we show it. Every series sampled from a
 * higher-frequency vector declares one, because without it the last period in
 * the year wins — which is right for a series read at year end, wrong for one
 * read mid-year, and quietly wrong for either in the middle of a year, where
 * "last period" is whatever happens to have been released.
 */
export function byYear(points, month) {
  const out = {};
  for (const p of points) {
    if (month && p.month !== month) continue;
    out[p.year] = p.value;
  }
  return out;
}
