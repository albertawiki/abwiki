import { datasets } from './index';

// These tests are the automated half of the review checklist on the Contribute
// page. They cannot tell whether a number is right — only a human opening the
// cited document can do that — but they can refuse anything that arrives
// without the provenance a human would need to check it.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_MONTH = /^\d{4}-\d{2}$/;

describe('every published dataset', () => {
  it('has a unique id', () => {
    const ids = datasets.map((d) => d.meta.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  describe.each(datasets.map((d) => [d.meta.id, d]))('%s', (_id, { meta, rows }) => {
    it('says what it measures and where', () => {
      expect(meta.title).toBeTruthy();
      expect(meta.unit).toBeTruthy();
      expect(meta.geography).toBeTruthy();
      expect(meta.cadence).toBeTruthy();
    });

    it('cites at least one source, each with a link', () => {
      expect(meta.sources.length).toBeGreaterThan(0);
      meta.sources.forEach((source) => {
        expect(source.text).toBeTruthy();
        expect(source.url).toMatch(/^https:\/\//);
        expect(source.retrieved).toMatch(ISO_DATE);
      });
    });

    it('records when a maintainer last checked it against the source', () => {
      expect(meta.lastChecked).toMatch(ISO_DATE);
      expect(new Date(meta.lastChecked).getTime()).not.toBeNaN();
    });

    it('declares a next expected release, or explains why it has none', () => {
      if (meta.nextExpected !== null) expect(meta.nextExpected).toMatch(ISO_MONTH);
      else expect(meta.cadence).toMatch(/monthly/);
    });

    it('tells the reader how to read it', () => {
      expect(meta.notes.length).toBeGreaterThan(0);
      meta.notes.forEach((note) => expect(note.length).toBeGreaterThan(20));
    });

    it('has rows', () => {
      expect(Array.isArray(rows)).toBe(true);
      expect(rows.length).toBeGreaterThan(0);
    });

    it('uses null, never zero, for a missing observation', () => {
      // A silent zero is the most dangerous value in a chart: it draws a line
      // to the floor and reads as a collapse rather than as "not measured".
      rows.forEach((row) => {
        Object.entries(row).forEach(([key, value]) => {
          if (typeof value === 'number' && key !== 'year' && key !== 'wave') {
            expect(Number.isFinite(value)).toBe(true);
          }
        });
      });
    });
  });
});

describe('shares of a population', () => {
  // Only a share *of a group of people* is bounded at 100. A ratio that
  // happens to be expressed in percent is not: household debt runs at 188% of
  // disposable income, and RBC's ownership-cost measure has exceeded 100% in
  // some markets. An earlier version of this test bounded everything with a
  // "%" unit and wrongly flagged the debt series.
  const isShareOfPeople = (unit) =>
    /% of (persons|population|Alberta respondents|respondents|households)/i.test(unit);

  it('stay within 0 and 100', () => {
    const shares = datasets.filter((d) => isShareOfPeople(d.meta.unit));
    expect(shares.length).toBeGreaterThan(0);

    const offenders = [];
    shares.forEach(({ meta, rows }) => {
      rows.forEach((row) => {
        Object.entries(row).forEach(([key, value]) => {
          if (typeof value !== 'number' || key === 'year' || key === 'wave') return;
          if (value < 0 || value > 100) offenders.push(`${meta.id} ${key}=${value}`);
        });
      });
    });
    expect(offenders).toEqual([]);
  });
});

describe('every numeric observation', () => {
  it('is finite and not negative', () => {
    // None of the indicators published here can meaningfully go below zero.
    // A negative would mean a parsing error rather than a measurement.
    const offenders = [];
    datasets.forEach(({ meta, rows }) => {
      rows.forEach((row) => {
        Object.entries(row).forEach(([key, value]) => {
          if (typeof value !== 'number') return;
          if (!Number.isFinite(value) || value < 0) offenders.push(`${meta.id} ${key}=${value}`);
        });
      });
    });
    expect(offenders).toEqual([]);
  });
});


