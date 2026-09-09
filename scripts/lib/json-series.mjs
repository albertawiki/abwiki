/**
 * Editing a data file's `series` without reformatting the rest of it.
 *
 * The obvious implementation — parse, change, `JSON.stringify` — turns a
 * one-value correction into a seventy-line diff, because these files are laid
 * out by hand: rows on one line where they fit, expanded where they do not,
 * and trailing zeros kept so a column of figures lines up. Reformatting all of
 * that produces exactly the diff nobody reads properly, which matters more
 * here than usual: the whole design of the refresh job is that a person reads
 * the diff and decides.
 *
 * So this edits the text. A revision replaces one value in place. A new row is
 * cloned from the row above it, so it arrives in the same shape, the same key
 * order and the same indentation as its neighbours.
 */

/** The `series` array's contents, as offsets into the file text. */
function locateSeries(text) {
  const key = text.indexOf('"series"');
  if (key === -1) throw new Error('no "series" key in this file');

  const open = text.indexOf('[', key);
  if (open === -1) throw new Error('"series" is not an array');

  let depth = 0;
  for (let i = open; i < text.length; i += 1) {
    if (text[i] === '[') depth += 1;
    else if (text[i] === ']') {
      depth -= 1;
      if (depth === 0) return { open, close: i };
    }
  }

  throw new Error('"series" is never closed');
}

/**
 * Each row of the series, as `{ year, text, start, end }`.
 *
 * Found by brace depth rather than by line, so the same code handles a file
 * whose rows are one line each and one whose rows are expanded over several.
 */
export function rowsOf(text) {
  const { open, close } = locateSeries(text);
  const rows = [];

  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for (let i = open + 1; i < close; i += 1) {
    const char = text[i];

    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }

    if (char === '"') inString = true;
    else if (char === '{') {
      if (depth === 0) start = i;
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        const body = text.slice(start, i + 1);
        rows.push({ year: JSON.parse(body).year, text: body, start, end: i + 1 });
      }
    }
  }

  return rows;
}

/**
 * The fewest decimal places a column is ever written with, or null if it holds
 * no numbers.
 *
 * Read from the text rather than the parsed value, because the text is the
 * only place the distinction survives: `1000.00` and `1000` parse identically,
 * and `13.0` and `13` do too.
 *
 * A minimum rather than a fixed width, because the two conventions in these
 * files are both minima. The wages column is written to two places throughout
 * so that a column of dollar figures lines up, and a new `1215.2` belongs there
 * as `1215.20`. The effective-industries column carries `12.86` and `13.0` side
 * by side: one place always, more where the number has more. Taking the widest
 * width instead would pad `12.8` out to `12.80` in a file that never does that;
 * taking the narrowest and stopping there would write `13` in a file that never
 * does that either.
 */
export function decimalsOf(rows, column) {
  const pattern = new RegExp(`"${column}"\\s*:\\s*(-?\\d+(?:\\.(\\d+))?)`);
  let minimum = null;

  for (const row of rows) {
    const match = row.text.match(pattern);
    if (!match) continue;
    const places = match[2] ? match[2].length : 0;
    minimum = minimum === null ? places : Math.min(minimum, places);
  }

  return minimum;
}

/** Decimal places a number needs to be written exactly. */
function naturalDecimals(value) {
  const text = String(value);
  if (text.includes('e') || text.includes('E')) return 0;
  const point = text.indexOf('.');
  return point === -1 ? 0 : text.length - point - 1;
}

/**
 * A value as this file would write it: at least `decimals` places, and more if
 * the number needs them to be itself.
 */
export function render(value, decimals) {
  if (value === null || value === undefined) return 'null';
  if (typeof value !== 'number') return JSON.stringify(value);
  if (decimals === null || decimals === undefined) return JSON.stringify(value);

  return value.toFixed(Math.max(decimals, naturalDecimals(value)));
}

const valuePattern = (column) =>
  new RegExp(`("${column}"\\s*:\\s*)(null|true|false|-?\\d+(?:\\.\\d+)?(?:[eE][-+]?\\d+)?|"(?:[^"\\\\]|\\\\.)*")`);

/** One column's value replaced inside a row's text. */
export function setValue(rowText, column, rendered) {
  const pattern = valuePattern(column);
  if (!pattern.test(rowText)) throw new Error(`no "${column}" in this row to replace`);
  return rowText.replace(pattern, `$1${rendered}`);
}

/**
 * A new row, shaped like the one above it.
 *
 * Cloning the last row rather than building one from scratch is what keeps the
 * key order, the indentation and the one-line-or-expanded choice identical to
 * every row already in the file. A column the file has never carried is not
 * something to invent a place for: that is a schema change, and a person
 * should make it.
 */
export function cloneRow(templateText, year, values, decimals) {
  let text = setValue(templateText, 'year', String(year));

  for (const [column, value] of Object.entries(values)) {
    if (column === 'year') continue;
    if (!valuePattern(column).test(templateText)) {
      throw new Error(`the source has a "${column}" column this file does not carry`);
    }
    text = setValue(text, column, render(value, decimals[column]));
  }

  return text;
}

/** Replace a row's text in the file, by offset. */
export function spliceRow(text, row, replacement) {
  return text.slice(0, row.start) + replacement + text.slice(row.end);
}

/**
 * Append a row after the last one, copying the separator already in use.
 *
 * The text between the last two rows is the file's own answer to "comma,
 * newline, how much indentation" — reusing it beats guessing at it.
 */
export function appendRow(text, rows, rowText) {
  const last = rows[rows.length - 1];
  const separator = rows.length > 1
    ? text.slice(rows[rows.length - 2].end, last.start)
    : ',\n    ';

  return text.slice(0, last.end) + separator + rowText + text.slice(last.end);
}
