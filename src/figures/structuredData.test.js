import { catalogue } from './catalogue.mjs';
import { figures, figureJsonLd } from './index';
import { datasetJsonLd, temporalCoverage } from './structuredData.mjs';
import { datasets } from '../data';

/**
 * The `Dataset` markup on each figure page.
 *
 * Structured data is a machine-readable claim about where a number came from,
 * made to an audience that will never see the page. It is the one part of the
 * site nobody proofreads by looking at it, so it gets checked here instead.
 */

const rowsFor = (id) => datasets.find((d) => d.meta.id === id)?.rows ?? [];

describe('every figure', () => {
  it('names a dataset that is registered', () => {
    const registered = new Set(datasets.map((d) => d.meta.id));
    const dangling = catalogue
      .filter((f) => !registered.has(f.dataset ?? f.id))
      .map((f) => `${f.id} → ${f.dataset ?? f.id}`);

    expect(dangling).toEqual([]);
  });

  // The catalogue's `dataset` field exists so a build script can find a
  // figure's provenance without loading this registry, which imports React.
  // It is only useful while it says the same thing the registry does.
  it('declares the dataset the registry actually binds to it', () => {
    const disagreeing = figures
      .filter((f) => (f.dataset ?? f.id) !== f.meta.id)
      .map((f) => `${f.id}: catalogue says ${f.dataset ?? f.id}, registry binds ${f.meta.id}`);

    expect(disagreeing).toEqual([]);
  });

  it('produces markup with every field a dataset search needs', () => {
    figures.forEach((figure) => {
      const node = figureJsonLd(figure);

      expect(node['@type']).toBe('Dataset');
      expect(node.name).toBe(figure.title);
      expect(node.url).toBe(`https://alberta.wiki/f/${figure.id}`);
      expect(node.dateModified).toBe(figure.meta.lastChecked);
      expect(node.temporalCoverage).toBeTruthy();
      expect(node.spatialCoverage.name).toBe(figure.meta.geography);
      expect(node.citation.length).toBe(figure.meta.sources.length);
    });
  });

  // Google rejects a Dataset description under 50 characters, and one over
  // 5000. Both limits are far outside the house style, so this only fires if
  // someone writes a stub.
  it('has a description a dataset search will accept', () => {
    const bad = figures
      .filter((f) => f.description.length < 50 || f.description.length > 5000)
      .map((f) => `${f.id} (${f.description.length})`);

    expect(bad).toEqual([]);
  });

  it('cites the same documents the sources drawer shows', () => {
    figures.forEach((figure) => {
      const node = figureJsonLd(figure);
      expect(node.isBasedOn).toEqual(figure.meta.sources.map((s) => s.url));
      expect(node.citation.map((c) => c.name)).toEqual(figure.meta.sources.map((s) => s.text));
    });
  });

  // The site licenses its own charts and calculations, not the numbers
  // underneath them, and the markup must not say otherwise. This is the
  // footer's claim in machine-readable form and has to keep matching it.
  it('licenses the compilation without claiming the underlying data', () => {
    const node = figureJsonLd(figures[0]);
    expect(node.license).toBe('https://creativecommons.org/licenses/by/4.0/');
    expect(node.usageInfo).toMatch(/remain the property of their respective publishers/);
  });

  it('memoises its markup, so applying it does not rewrite on every render', () => {
    expect(figureJsonLd(figures[0])).toBe(figureJsonLd(figures[0]));
  });
});

/**
 * Reference periods are not interchangeable on this site. A fiscal year
 * labelled 2020-21 runs April to March; a quarter labelled 2019-Q4 covers
 * three months of 2019, not twelve. Flattening either into a bare year is how
 * a series gets silently shifted, which has happened here before.
 */
describe('temporal coverage', () => {
  it('reads a calendar year as a year', () => {
    expect(temporalCoverage({}, [{ year: 2014 }, { year: 2025 }])).toBe('2014/2025');
  });

  it('opens a fiscal year in April and closes it in March', () => {
    expect(temporalCoverage({}, [{ year: '2020-21' }, { year: '2024-25' }]))
      .toBe('2020-04/2025-03');
  });

  it('crosses a century without inventing one', () => {
    expect(temporalCoverage({}, [{ year: '1999-00' }])).toBe('1999-04/2000-03');
  });

  it('refuses a two-part label whose halves are not consecutive years', () => {
    expect(temporalCoverage({}, [{ year: '2020-25' }])).toBeNull();
  });

  it('reads a quarter as its three months', () => {
    expect(temporalCoverage({}, [{ quarter: '2019-Q4' }, { quarter: '2026-Q2' }]))
      .toBe('2019-10/2026-06');
  });

  it('prefers a declared fiscal year to the calendar year beside it', () => {
    expect(temporalCoverage({}, [{ year: 2008, fiscalYear: '2008-09' }]))
      .toBe('2008-04/2009-03');
  });

  it('takes what the dataset declares when the rows carry no period', () => {
    expect(temporalCoverage({ temporalCoverage: '2022' }, [{ jurisdiction: 'Alberta' }]))
      .toBe('2022');
  });

  // An absent field is honest; an invented one is not.
  it('says nothing rather than guessing', () => {
    expect(temporalCoverage({}, [{ cohort: 'Grades 10-12' }])).toBeNull();
  });
});

describe('the markup', () => {
  it('is the same whether the page or the build step writes it', () => {
    figures.forEach((figure) => {
      const catalogueEntry = catalogue.find((f) => f.id === figure.id);
      const built = datasetJsonLd(
        catalogueEntry,
        datasets.find((d) => d.meta.id === (catalogueEntry.dataset ?? catalogueEntry.id)).meta,
        rowsFor(catalogueEntry.dataset ?? catalogueEntry.id),
      );

      expect(built).toEqual(figureJsonLd(figure));
    });
  });

  it('survives being embedded in a script element', () => {
    figures.forEach((figure) => {
      // `</` ends a script element wherever it appears, so the prerender
      // escapes it. Nothing should need escaping today; this is here to fail
      // loudly if a source title ever arrives carrying one.
      const text = JSON.stringify(figureJsonLd(figure));
      expect(text.includes('</')).toBe(false);
    });
  });
});
