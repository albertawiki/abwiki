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
    for (const topic of ['Affordability', 'Healthcare', 'Economy', 'Education']) {
      expect(await screen.findByRole('heading', { name: topic })).toBeInTheDocument();
    }
  });

  it('states when each figure was last checked against its source', () => {
    render(<App />);
    const provenance = screen.getAllByText(/Checked against source \d{4}-\d{2}-\d{2}/);
    expect(provenance.length).toBeGreaterThanOrEqual(8);
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

describe('employment chart', () => {
  it('falls back to verified annual averages when the live API is down', async () => {
    render(<App />);
    expect(
      await screen.findByText(/Live data from the Alberta Economic Dashboard is unavailable/),
    ).toBeInTheDocument();
  });
});
