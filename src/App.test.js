import React from 'react';
import { render, screen, within, fireEvent } from '@testing-library/react';
import App from './App';

// Recharts measures its container, which jsdom reports as 0x0, so charts
// render empty here. That is fine: these tests are about the scaffolding
// around the charts — headings, provenance, sources and the data tables —
// which is the part a reader relies on to check us.
beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  global.fetch = jest.fn(() => Promise.reject(new Error('offline in tests')));
});

afterAll(() => jest.restoreAllMocks());

describe('dashboard', () => {
  it('shows every topic section', async () => {
    render(<App />);
    for (const topic of ['Affordability', 'Healthcare', 'Economy', 'Economic diversification', 'Education']) {
      expect(await screen.findByRole('heading', { name: topic })).toBeInTheDocument();
    }
  });

  it('states when each figure was last checked against its source', () => {
    render(<App />);
    const provenance = screen.getAllByText(/Checked against source \d{4}-\d{2}-\d{2}/);
    expect(provenance.length).toBeGreaterThanOrEqual(14);
  });

  it('reveals sources with working links when asked', () => {
    render(<App />);

    const card = screen.getByText(/Median weekly wage, adjusted for inflation/).closest('figure');
    fireEvent.click(within(card).getByRole('button', { name: 'Sources' }));

    const links = within(card).getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
    links.forEach((link) => expect(link.getAttribute('href')).toMatch(/^https:\/\//));
  });

  it('reveals the numbers behind a figure', () => {
    render(<App />);

    const card = screen.getByText(/Emergency department wait to see a doctor/).closest('figure');
    fireEvent.click(within(card).getByRole('button', { name: 'Data table' }));

    const table = within(card).getByRole('table');
    expect(within(table).getByText('2024-25')).toBeInTheDocument();
    expect(within(table).getByText('7')).toBeInTheDocument();
  });
});

describe('labour force charts', () => {
  it('fall back to verified annual averages when the live API is down', async () => {
    render(<App />);
    // Both the employment and unemployment figures read the same live source,
    // so a failure has to be visible on each of them rather than just one.
    const warnings = await screen.findAllByText(
      /Live data from Statistics Canada is unavailable/,
    );
    expect(warnings.length).toBeGreaterThanOrEqual(2);
  });
});

describe('theme toggle', () => {
  afterEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  const toggle = () => screen.getAllByRole('group', { name: 'Colour theme' })[0];

  it('follows the system by default, stamping no attribute', () => {
    render(<App />);
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(
      within(toggle()).getByRole('button', { name: 'Match system theme' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('stamps the root element when a theme is chosen', () => {
    render(<App />);
    fireEvent.click(within(toggle()).getByRole('button', { name: 'Dark theme' }));

    // The stylesheet and the chart colours both read data-theme off the root,
    // so this attribute is the whole mechanism.
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(window.localStorage.getItem('alberta-wiki-theme')).toBe('dark');
  });

  it('goes back to following the system, forgetting the choice', () => {
    render(<App />);
    fireEvent.click(within(toggle()).getByRole('button', { name: 'Light theme' }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    fireEvent.click(within(toggle()).getByRole('button', { name: 'Match system theme' }));
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(window.localStorage.getItem('alberta-wiki-theme')).toBeNull();
  });

  it('restores a saved choice on load', () => {
    window.localStorage.setItem('alberta-wiki-theme', 'dark');
    render(<App />);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
