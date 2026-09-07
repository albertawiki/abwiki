import React from 'react';
import { render, screen, within, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FeaturedCarousel from './FeaturedCarousel';
import { featuredFigures, unknownFeatured, figureTitle, topics } from '../figures';
import { featured } from '../figures/catalogue.mjs';

/**
 * The rotating figure on the home page.
 *
 * The interesting behaviour is not that it advances. It is that it stops:
 * a carousel that keeps moving while somebody is reading a chart is worse
 * than no carousel, and this is the only thing on the site that moves on its
 * own after the page has settled.
 */

let mediaMatches = false;

// Create React App sets `resetMocks: true`, which strips every mock
// implementation before each test. Anything installed in beforeAll is a bare
// jest.fn() returning undefined by the time a test runs, so these have to be
// re-installed here.
beforeEach(() => {
  mediaMatches = false;
  jest.useFakeTimers();

  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  global.fetch = jest.fn(() => Promise.reject(new Error('offline in tests')));

  window.matchMedia = jest.fn().mockImplementation((query) => ({
    matches: query.includes('reduced-motion') ? mediaMatches : false,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }));
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

const renderCarousel = () =>
  render(<MemoryRouter><FeaturedCarousel /></MemoryRouter>);

const shownTitle = () => document.querySelector('.featured-title').textContent.trim();
const advance = (ms) => act(() => { jest.advanceTimersByTime(ms); });

describe('the featured set', () => {
  it('names only figures that exist', () => {
    expect(unknownFeatured).toEqual([]);
  });

  it('carries exactly one figure per topic', () => {
    // The rule that keeps the front page from becoming a campaign. A rotation
    // filled from one topic would make the site's opening argument for it.
    const byTopic = featuredFigures.map((f) => f.topic);
    expect([...byTopic].sort()).toEqual(topics.map((t) => t.slug).sort());
  });

  it('lists each figure once', () => {
    expect(featured).toEqual([...new Set(featured)]);
  });
});

describe('rotation', () => {
  it('advances on its own', () => {
    renderCarousel();
    const first = shownTitle();

    advance(8000);
    expect(shownTitle()).not.toBe(first);
  });

  it('comes back round to the beginning', () => {
    renderCarousel();
    const first = shownTitle();

    advance(8000 * featuredFigures.length);
    expect(shownTitle()).toBe(first);
  });
});

describe('it stops when someone might be reading', () => {
  it('holds while the pointer is over it', () => {
    renderCarousel();
    const region = screen.getByRole('region', { name: 'Featured figures' });
    const first = shownTitle();

    fireEvent.mouseEnter(region);
    advance(8000 * 3);
    expect(shownTitle()).toBe(first);

    fireEvent.mouseLeave(region);
    advance(8000);
    expect(shownTitle()).not.toBe(first);
  });

  it('holds while a control inside it has keyboard focus', () => {
    renderCarousel();
    const next = screen.getByRole('button', { name: 'Next featured figure' });

    next.focus();
    fireEvent.focus(next);
    const held = shownTitle();

    advance(8000 * 3);
    expect(shownTitle()).toBe(held);
  });

  it('holds when the reader presses pause, and resumes when asked', () => {
    renderCarousel();
    const pause = screen.getByRole('button', { name: 'Stop rotating figures' });

    fireEvent.click(pause);
    const held = shownTitle();
    advance(8000 * 3);
    expect(shownTitle()).toBe(held);

    fireEvent.click(screen.getByRole('button', { name: 'Resume rotating figures' }));
    advance(8000);
    expect(shownTitle()).not.toBe(held);
  });

  it('never starts when the reader has asked for reduced motion', () => {
    mediaMatches = true;
    renderCarousel();
    const first = shownTitle();

    advance(8000 * 5);
    expect(shownTitle()).toBe(first);

    // And offers no pause button, because there is nothing to pause.
    expect(screen.queryByRole('button', { name: /rotating figures/ })).toBeNull();
  });
});

describe('the controls', () => {
  it('step forwards and backwards', () => {
    renderCarousel();
    const first = shownTitle();

    fireEvent.click(screen.getByRole('button', { name: 'Next featured figure' }));
    expect(shownTitle()).not.toBe(first);

    fireEvent.click(screen.getByRole('button', { name: 'Previous featured figure' }));
    expect(shownTitle()).toBe(first);
  });

  it('wrap backwards from the first to the last', () => {
    renderCarousel();
    fireEvent.click(screen.getByRole('button', { name: 'Previous featured figure' }));
    expect(shownTitle()).toBe(figureTitle(featuredFigures[featuredFigures.length - 1]));
  });

  it('offer a dot per figure, naming it', () => {
    renderCarousel();
    featuredFigures.forEach((figure) => {
      expect(
        screen.getByRole('button', { name: `Show ${figureTitle(figure)}` }),
      ).toBeInTheDocument();
    });
  });

  it('jump straight to a figure', () => {
    renderCarousel();
    const last = featuredFigures[featuredFigures.length - 1];

    fireEvent.click(screen.getByRole('button', { name: `Show ${figureTitle(last)}` }));
    expect(shownTitle()).toBe(figureTitle(last));
  });
});

describe('what it links to', () => {
  it('points at the figure and at its topic', () => {
    renderCarousel();
    const slide = document.querySelector('.featured-slide');
    const figure = featuredFigures[0];

    const links = within(slide).getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(links).toContain(`/f/${figure.id}`);
    expect(links).toContain(`/${figure.topic}`);
  });

  it('stays silent to screen readers while it is moving', () => {
    // Announcing every automatic change would talk over a screen reader user
    // continuously; announcing a change they asked for is useful.
    renderCarousel();
    const slide = document.querySelector('.featured-slide');
    expect(slide.getAttribute('aria-live')).toBe('off');

    fireEvent.click(screen.getByRole('button', { name: 'Stop rotating figures' }));
    expect(slide.getAttribute('aria-live')).toBe('polite');
  });
});
