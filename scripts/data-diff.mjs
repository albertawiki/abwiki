#!/usr/bin/env node
/**
 * Show every published number this branch changes.
 *
 * A reviewer cannot check a data change they cannot see. A pull request that
 * touches a series shows up in `git diff` as a wall of JSON, and the one value
 * that actually moved is easy to miss among reformatting, added rows and
 * comment edits. This reads the same files on both sides and reports the
 * differences as values: what was added, what was removed, and what changed
 * from what to what.
 *
 * It also flags changes worth a second look — a value that moved much more
 * than that series ever has before, or a row whose scope or source vintage
 * changed. These are not errors. They are the places where a reviewer should
 * open the cited document rather than take the diff on trust.
 *
 *   node scripts/data-diff.mjs                 # against origin/main
 *   node scripts/data-diff.mjs --base HEAD~1
 *   node scripts/data-diff.mjs --markdown      # for a PR comment
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = join(root, 'src', 'data');

/** How far a value must move, relative to that series' own history, to be flagged. */
const OUTLIER_MULTIPLE = 3;

const argv = process.argv.slice(2);
const asMarkdown = argv.includes('--markdown');
const baseRef = argv.includes('--base') ? argv[argv.indexOf('--base') + 1] : 'origin/main';

/** Every data JSON file, as repo-relative posix paths (what git wants). */
function dataFiles(dir = DATA_DIR) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...dataFiles(full));
    else if (entry.name.endsWith('.json')) out.push(relative(root, full).replace(/\\/g, '/'));
  }
  return out.sort();
}

/** Read a file at a git ref. Returns null when it did not exist there. */
function readAtRef(ref, file) {
  try {
    return execFileSync('git', ['show', `${ref}:${file}`], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return null;
  }
}

/**
 * The key that identifies a row within a series — whichever of these it has.
 * Every dataset here is a time series, so one of them always applies.
 */
const KEY_FIELDS = ['quarter', 'year', 'date', 'period'];

const rowKey = (row) => {
  const field = KEY_FIELDS.find((f) => row[f] !== undefined);
  return field ? String(row[field]) : null;
};

/** Pull every named array-of-rows out of a parsed data file. */
function seriesOf(parsed) {
  const out = {};
  for (const [name, value] of Object.entries(parsed)) {
    if (Array.isArray(value) && value.length > 0 && rowKey(value[0]) !== null) {
      out[name] = value;
    }
  }
  return out;
}

/**
 * The largest step this series has historically taken for a column.
 * Used as the yardstick for "this change is unusually large" — a series that
 * normally moves by 0.2 and suddenly moves by 4 is worth opening the source
 * for, while one that routinely swings by 13 is not.
 */
function typicalStep(rows, column) {
  const steps = [];
  let previous = null;
  for (const row of rows) {
    const value = row[column];
    if (typeof value !== 'number') continue;
    if (previous !== null) steps.push(Math.abs(value - previous));
    previous = value;
  }
  if (steps.length === 0) return null;
  return Math.max(...steps);
}

function compareFile(file) {
  const baseText = readAtRef(baseRef, file);
  const headText = (() => {
    try {
      return readFileSync(join(root, file), 'utf8');
    } catch {
      return null;
    }
  })();

  if (baseText === null && headText === null) return null;
  if (baseText === null) return { file, added: true, changes: [], notes: ['New dataset.'] };
  if (headText === null) return { file, removed: true, changes: [], notes: ['Dataset removed.'] };

  const base = seriesOf(JSON.parse(baseText));
  const head = seriesOf(JSON.parse(headText));

  const changes = [];
  const notes = [];

  for (const [name, headRows] of Object.entries(head)) {
    const baseRows = base[name];
    if (!baseRows) {
      notes.push(`New series "${name}" with ${headRows.length} rows.`);
      continue;
    }

    const baseByKey = new Map(baseRows.map((r) => [rowKey(r), r]));
    const headByKey = new Map(headRows.map((r) => [rowKey(r), r]));
    const columns = [...new Set(headRows.flatMap((r) => Object.keys(r)))];

    for (const [key, headRow] of headByKey) {
      const baseRow = baseByKey.get(key);

      if (!baseRow) {
        changes.push({ series: name, key, kind: 'added', row: headRow });
        continue;
      }

      for (const column of columns) {
        if (KEY_FIELDS.includes(column)) continue;
        const before = baseRow[column];
        const after = headRow[column];
        if (before === after) continue;
        if (before === undefined && after === undefined) continue;

        const change = { series: name, key, kind: 'changed', column, before, after };

        if (typeof before === 'number' && typeof after === 'number') {
          const step = typicalStep(baseRows, column);
          const moved = Math.abs(after - before);
          if (step !== null && step > 0 && moved > step * OUTLIER_MULTIPLE) {
            change.flag = `moved ${moved.toFixed(2)}, more than ${OUTLIER_MULTIPLE}× the largest step this series has ever taken (${step.toFixed(2)})`;
          }
        } else if (before === null && after !== null) {
          change.flag = 'a value we previously withheld is now published — check it against the source';
        } else if (before !== null && after === null) {
          change.flag = 'a published value is being withdrawn';
        } else if (typeof before === 'string' || typeof after === 'string') {
          change.flag = 'a non-numeric field changed (scope, vintage or label) — comparability may have changed';
        }

        changes.push(change);
      }
    }

    for (const [key, baseRow] of baseByKey) {
      if (!headByKey.has(key)) changes.push({ series: name, key, kind: 'removed', row: baseRow });
    }
  }

  return changes.length || notes.length ? { file, changes, notes } : null;
}

function render(results) {
  const flagged = results.flatMap((r) => r.changes.filter((c) => c.flag));
  const total = results.reduce((n, r) => n + r.changes.length, 0);

  if (asMarkdown) {
    if (results.length === 0) {
      return `### Data diff vs \`${baseRef}\`\n\nNo published figures changed.\n`;
    }

    const lines = [
      `### Data diff vs \`${baseRef}\``,
      '',
      `${total} value${total === 1 ? '' : 's'} changed across ${results.length} dataset${results.length === 1 ? '' : 's'}.`,
      '',
    ];

    for (const result of results) {
      lines.push(`<details open><summary><code>${result.file}</code></summary>`, '');
      for (const note of result.notes) lines.push(`- ${note}`);
      if (result.changes.length) {
        lines.push('', '| Series | Row | Field | Before | After | |', '|---|---|---|---|---|---|');
        for (const c of result.changes) {
          if (c.kind === 'changed') {
            lines.push(
              `| ${c.series} | ${c.key} | ${c.column} | ${fmt(c.before)} | ${fmt(c.after)} | ${c.flag ? '⚠️' : ''} |`,
            );
          } else {
            lines.push(`| ${c.series} | ${c.key} | — | ${c.kind === 'added' ? '—' : 'row'} | ${c.kind === 'added' ? 'row added' : 'removed'} | |`);
          }
        }
      }
      lines.push('', '</details>', '');
    }

    if (flagged.length) {
      lines.push('#### Worth opening the source for', '');
      for (const c of flagged) {
        lines.push(`- **${c.series} ${c.key} · ${c.column}**: ${fmt(c.before)} → ${fmt(c.after)} — ${c.flag}`);
      }
      lines.push('');
    }

    lines.push(
      '',
      '_A flag is not an error. It marks a change large or unusual enough that a reviewer should check it against the cited document rather than take the diff on trust._',
    );
    return lines.join('\n');
  }

  if (results.length === 0) return `\nNo published figures changed vs ${baseRef}.\n`;

  const lines = [`\nData diff vs ${baseRef}: ${total} value(s) changed.\n`];
  for (const result of results) {
    lines.push(`  ${result.file}`);
    for (const note of result.notes) lines.push(`    note: ${note}`);
    for (const c of result.changes) {
      if (c.kind === 'changed') {
        lines.push(`    ${c.flag ? 'FLAG' : '    '} ${c.series} ${c.key} ${c.column}: ${fmt(c.before)} -> ${fmt(c.after)}`);
        if (c.flag) lines.push(`           ${c.flag}`);
      } else {
        lines.push(`         ${c.series} ${c.key}: row ${c.kind}`);
      }
    }
    lines.push('');
  }
  return lines.join('\n');
}

const fmt = (v) => (v === null ? '—' : v === undefined ? '(absent)' : String(v));

function main() {
  const results = dataFiles().map(compareFile).filter(Boolean);
  console.log(render(results));
}

main();
