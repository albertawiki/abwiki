#!/usr/bin/env node
/**
 * Turn a refresh report into the words a person reads first.
 *
 * The subject line has one job: say whether this week's refresh is a routine
 * addition or a correction, before anybody opens it. Those are different
 * events. An added period is the site catching up; a changed value for a
 * period already published is a number that was wrong on the site, and burying
 * that under "update data" is how a correction goes out unreviewed.
 *
 *   node scripts/refresh-summary.mjs report.json --subject
 *   node scripts/refresh-summary.mjs report.json --body
 */

import { readFileSync } from 'node:fs';

const [, , file, mode] = process.argv;

if (!file) {
  console.error('Usage: refresh-summary.mjs <report.json> [--subject|--body]');
  process.exit(2);
}

const report = JSON.parse(readFileSync(file, 'utf8'));
const { revisions = [], additions = [], due = [], stamped = [] } = report;

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** One line, saying which of the two kinds of change this is. */
function subject() {
  if (revisions.length > 0 && additions.length > 0) {
    return `Correct ${plural(revisions.length, 'revised value')}`
      + ` and add ${plural(additions.length, 'new period')}`;
  }
  // Corrections lead. A pull request that mentions the additions first invites
  // being read as routine, and it is not.
  if (revisions.length > 0) {
    return `Correct ${plural(revisions.length, 'value')} a source has since revised`;
  }
  if (additions.length > 0) {
    return `Add ${plural(additions.length, 'new reference period')}`;
  }
  return 'Record that the sources were checked';
}

function body() {
  const lines = [];

  if (revisions.length > 0) {
    lines.push(
      '## Corrections',
      '',
      'A source has changed a value this site already published. Until this is',
      'merged, the site is showing a number its own citation no longer supports.',
      '',
      ...revisions.map((r) =>
        `- **${r.label}** · ${r.column} ${r.year}: \`${r.published}\` → \`${r.source}\``),
      '',
    );
  }

  if (additions.length > 0) {
    lines.push(
      '## New reference periods',
      '',
      ...additions.map((a) => {
        const values = Object.entries(a.values)
          .map(([column, value]) => `${column} ${value}`)
          .join(', ');
        return `- **${a.label}** · ${a.year}: ${values}`;
      }),
      '',
      'Derived columns are recomputed from their inputs rather than carried',
      'over, so a per-person figure moves when either its numerator or its',
      'denominator does.',
      '',
    );
  }

  if (revisions.length === 0 && additions.length === 0) {
    lines.push(
      'Every published value still matches its source. Nothing changed except',
      `\`lastChecked\`, on ${plural(stamped.length, 'dataset')}.`,
      '',
    );
  }

  if (due.length > 0) {
    lines.push(
      '## Not covered here',
      '',
      'These come from a published document and nothing automated can read one.',
      'They are tracked in the `data-refresh` issue.',
      '',
      ...due.map((d) => `- ${d.label} — expected ${d.nextExpected}`),
      '',
    );
  }

  return lines.join('\n').trimEnd();
}

if (mode === '--body') console.log(body());
else console.log(subject());
