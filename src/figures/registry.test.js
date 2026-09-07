import { figures, topics, topicLayout, figureTitle, unboundFigures, routes } from './index';
import { datasets } from '../data';

/**
 * Integrity of the figure registry.
 *
 * A figure's `id` is a public URL. Once someone has linked to it, changing it
 * breaks their link silently — the page still loads, it just says the figure
 * does not exist. These tests are what stands between a rename and that.
 */

describe('every figure', () => {
  it('has an id that is safe in a URL', () => {
    const bad = figures
      .filter(({ id }) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))
      .map(({ id }) => id);
    expect(bad).toEqual([]);
  });

  it('has an id nothing else claims', () => {
    const ids = figures.map(({ id }) => id);
    expect(ids).toEqual([...new Set(ids)]);
  });

  it('belongs to a topic that exists', () => {
    const slugs = topics.map(({ slug }) => slug);
    const orphans = figures
      .filter(({ topic }) => !slugs.includes(topic))
      .map(({ id, topic }) => `${id} → ${topic}`);
    expect(orphans).toEqual([]);
  });

  it('names a section its topic declares, if it names one at all', () => {
    const orphans = figures
      .filter(({ section }) => section)
      .filter(({ topic, section }) => {
        const declared = topics.find((t) => t.slug === topic)?.sections || [];
        return !declared.some((s) => s.id === section);
      })
      .map(({ id, section }) => `${id} → ${section}`);
    expect(orphans).toEqual([]);
  });

  it('has a chart, a description and a title', () => {
    const incomplete = figures
      .filter((f) => !f.Chart || !f.description || !figureTitle(f))
      .map(({ id }) => id);
    expect(incomplete).toEqual([]);
  });

  it('describes itself in one plain sentence', () => {
    const malformed = figures
      .filter(({ description }) => !/^[A-Z]/.test(description) || !/\.$/.test(description))
      .map(({ id }) => id);
    expect(malformed).toEqual([]);
  });
});

describe('the catalogue', () => {
  it('has a chart bound to every entry it lists', () => {
    // A catalogue entry with no binding renders a card with no chart in it,
    // which is the failure this whole site is least able to afford.
    expect(unboundFigures).toEqual([]);
  });

  it('publishes a route for every page and every figure', () => {
    const published = routes();
    expect(published).toContain('/');
    topics.forEach(({ slug }) => expect(published).toContain(`/${slug}`));
    figures.forEach(({ id }) => expect(published).toContain(`/f/${id}`));
    expect(published).toEqual([...new Set(published)]);
  });
});

describe('the registry and the dataset list', () => {
  // The dataset list is what the integrity, freshness and source-checking
  // tools walk. A dataset missing from the figure registry is checked but
  // never shown; a figure whose dataset is unregistered is shown but never
  // checked. Both are worth failing over.
  it('cover exactly the same datasets', () => {
    const published = new Set(figures.map(({ meta }) => meta.id));
    const registered = new Set(datasets.map(({ meta }) => meta.id));

    expect([...registered].filter((id) => !published.has(id))).toEqual([]);
    expect([...published].filter((id) => !registered.has(id))).toEqual([]);
  });
});

describe('every topic', () => {
  it('has at least one figure on it', () => {
    const empty = topics
      .filter(({ slug }) => !figures.some((f) => f.topic === slug))
      .map(({ slug }) => slug);
    expect(empty).toEqual([]);
  });

  it('has a slug that is safe in a URL', () => {
    const bad = topics
      .filter(({ slug }) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
      .map(({ slug }) => slug);
    expect(bad).toEqual([]);
  });

  it('lays out every one of its figures exactly once', () => {
    topics.forEach((topic) => {
      const { ungrouped, sections } = topicLayout(topic);
      const laidOut = [...ungrouped, ...sections.flatMap((s) => s.figures)].map((f) => f.id);
      const belonging = figures.filter((f) => f.topic === topic.slug).map((f) => f.id);

      expect([...laidOut].sort()).toEqual([...belonging].sort());
    });
  });

  it('declares no empty section', () => {
    const empty = topics.flatMap((topic) =>
      topicLayout(topic).sections
        .filter((s) => s.figures.length === 0)
        .map((s) => `${topic.slug}/${s.id}`));
    expect(empty).toEqual([]);
  });
});
