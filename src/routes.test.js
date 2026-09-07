import React from 'react';
import { render, screen, within } from '@testing-library/react';
import App from './App';
import { figures, topics, figureTitle } from './figures';

// Charts render empty in jsdom, which is fine here: these tests are about
// which figures a route shows and what it tells a search engine, not about
// the charts themselves.
beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  global.fetch = jest.fn(() => Promise.reject(new Error('offline in tests')));
});

afterAll(() => jest.restoreAllMocks());

/** Render the app as though the browser had been pointed at `path`. */
const renderAt = (path) => {
  window.history.pushState({}, '', path);
  return render(<App />);
};

const canonical = () => document.head.querySelector('link[rel="canonical"]')?.getAttribute('href');
const cardTitles = () =>
  [...document.querySelectorAll('.stat-card-title')].map((el) => el.textContent.trim());

describe.each(topics.map((t) => [t.slug, t]))('the /%s page', (slug, topic) => {
  it('names itself in the heading, the title and the canonical URL', () => {
    renderAt(`/${slug}`);

    expect(screen.getByRole('heading', { level: 1, name: topic.label })).toBeInTheDocument();
    expect(document.title).toContain(topic.label);
    expect(canonical()).toBe(`https://alberta.wiki/${slug}`);
  });

  it('shows its own figures and no others', () => {
    renderAt(`/${slug}`);

    const mine = figures.filter((f) => f.topic === slug).map(figureTitle);
    const shown = cardTitles();

    expect(shown.sort()).toEqual([...mine].sort());
  });

  it('lists the sources behind the figures on it', () => {
    renderAt(`/${slug}`);

    const section = screen
      .getByRole('heading', { name: 'Where these figures come from' })
      .closest('section');
    const links = within(section).getAllByRole('link');

    expect(links.length).toBeGreaterThan(0);
    links.forEach((link) => expect(link.getAttribute('href')).toMatch(/^https:\/\//));
  });
});

describe('a figure permalink', () => {
  it.each(figures.map((f) => [f.id, f]))('/f/%s renders that figure alone', (id, figure) => {
    renderAt(`/f/${id}`);

    expect(cardTitles()).toEqual([figureTitle(figure)]);
    expect(canonical()).toBe(`https://alberta.wiki/f/${id}`);
  });

  it('makes the figure the page heading', () => {
    const [figure] = figures;
    renderAt(`/f/${figure.id}`);

    expect(
      screen.getByRole('heading', { level: 1, name: figureTitle(figure) }),
    ).toBeInTheDocument();
  });

  it('opens the caveats rather than hiding them behind a button', () => {
    // Someone arriving from a shared link came for this figure specifically.
    // What the number does not cover should not need a click.
    const figure = figures.find((f) => f.meta.notes.length > 0);
    renderAt(`/f/${figure.id}`);

    expect(screen.getByRole('heading', { name: 'How to read this' })).toBeInTheDocument();
    expect(screen.getByText(figure.meta.notes[0])).toBeInTheDocument();
  });

  it('links to the rest of its topic', () => {
    const figure = figures.find((f) => f.topic === 'economy');
    renderAt(`/f/${figure.id}`);

    const others = screen.getByRole('heading', { name: /Other figures in/ }).closest('section');
    const links = within(others).getAllByRole('link');

    expect(links.length).toBeGreaterThan(0);
    links.forEach((link) => expect(link.getAttribute('href')).toMatch(/^\/f\//));
  });
});

describe('an address with nothing at it', () => {
  it('says so for an unknown figure rather than rendering a blank frame', () => {
    renderAt('/f/no-such-figure');

    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByText(/No figure is published at \/f\/no-such-figure/)).toBeInTheDocument();
  });

  it('says so for an unknown page', () => {
    renderAt('/nothing-here');
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
  });

  it('offers every topic as a way out', () => {
    renderAt('/nothing-here');
    // Scoped to the page body: the header nav links to the topics from every
    // route, so an unscoped query matches twice and proves nothing.
    const main = document.querySelector('.not-found-page .main-content');
    topics.forEach(({ slug, label }) => {
      expect(within(main).getByRole('link', { name: label }).getAttribute('href'))
        .toBe(`/${slug}`);
    });
  });
});

describe('the dashboard', () => {
  it('still carries every figure', () => {
    renderAt('/');
    expect(cardTitles().sort()).toEqual(figures.map(figureTitle).sort());
  });

  it('links each topic heading to that topic page', () => {
    renderAt('/');
    topics.forEach(({ slug, label }) => {
      const heading = screen.getByRole('heading', { name: label });
      const link = within(heading).getByRole('link');
      expect(link.getAttribute('href')).toBe(`/${slug}`);
    });
  });

  it('gives every card a permalink to its own page', () => {
    renderAt('/');
    figures.forEach((figure) => {
      const card = document.getElementById(figure.id);
      expect(card).not.toBeNull();
      expect(
        within(card).getByRole('link', { name: figureTitle(figure) }).getAttribute('href'),
      ).toBe(`/f/${figure.id}`);
    });
  });
});
