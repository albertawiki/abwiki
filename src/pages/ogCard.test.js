import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import OgCard from './OgCard';
import { catalogue, socialImage } from '../figures/catalogue.mjs';
import { figures, sourceAttribution } from '../figures';

/**
 * The social card, and the tags that point at it.
 *
 * `scripts/render-og-images.mjs` checks what the browser did — that a card
 * drew, that it fitted, that the file is not a blank rectangle. These check
 * what it was asked to draw, which is the part that runs without a browser.
 */

const renderCard = (id) =>
  render(
    <MemoryRouter initialEntries={[`/og/${id}`]}>
      <Routes>
        <Route path="/og/:figureId" element={<OgCard />} />
      </Routes>
    </MemoryRouter>,
  );

describe('a social card', () => {
  it('carries the question, the unit and the publisher', () => {
    const figure = figures[0];
    const { container } = renderCard(figure.id);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(figure.title);
    expect(container.querySelector('.og-card-subtitle').textContent)
      .toContain(figure.meta.unit);
    expect(screen.getByText(`Source: ${sourceAttribution(figure.meta)}`)).toBeInTheDocument();
  });

  // The renderer waits for this attribute before it takes the picture, so a
  // card that stopped carrying it would hang the build rather than quietly
  // photograph the wrong thing. Worth a test either way.
  it('announces which figure it is, for the renderer to wait on', () => {
    const { container } = renderCard('pisa-alberta');
    expect(container.querySelector('.og-card')).toHaveAttribute('data-og-ready', 'pisa-alberta');
  });

  it('says so rather than rendering an empty card for an unknown figure', () => {
    renderCard('no-such-figure');
    expect(screen.getByText(/No figure at/)).toBeInTheDocument();
  });
});

/**
 * A card has room for the publisher and nothing else, so the citation is cut
 * at its first sentence break, dash or colon. That rule is a reading of the
 * citations that exist today, and a new source could break it — which is what
 * this is for.
 */
describe('the source line on every card', () => {
  it('names a publisher without running off the card', () => {
    const bad = figures
      .map((f) => ({ id: f.id, attribution: sourceAttribution(f.meta) }))
      .filter(({ attribution }) => attribution.length === 0 || attribution.length > 70)
      .map(({ id, attribution }) => `${id}: "${attribution}" (${attribution.length})`);

    expect(bad).toEqual([]);
  });

  it('stops before the citation starts describing the document', () => {
    expect(sourceAttribution({
      sources: [{ text: 'Statistics Canada. Table 14-10-0064-01 Employee wages by industry.' }],
    })).toBe('Statistics Canada');

    expect(sourceAttribution({
      sources: [{ text: 'OECD (2023), PISA 2022 Results (Volume I): The State of Learning.' }],
    })).toBe('OECD (2023), PISA 2022 Results (Volume I)');
  });

  it('is empty rather than wrong when a dataset cites nothing', () => {
    expect(sourceAttribution({ sources: [] })).toBe('');
    expect(sourceAttribution({})).toBe('');
  });
});

describe('the link preview', () => {
  it('offers a figure its own chart, on a large card', () => {
    catalogue.forEach((figure) => {
      const image = socialImage(figure);

      expect(image.url).toBe(`https://alberta.wiki/og/${figure.id}.png`);
      expect(image.card).toBe('summary_large_image');
      expect(image.alt).toBe(`Chart: ${figure.title}`);
      expect([image.width, image.height]).toEqual([2400, 1260]);
    });
  });

  // A 512px logo stretched across a 1200-wide card looks worse than a small
  // one shown small, so only figures claim the large card.
  it('offers everything else the logo, on a small one', () => {
    expect(socialImage(null)).toEqual({
      url: 'https://alberta.wiki/logo512.png',
      card: 'summary',
    });
  });

  // usePageMeta takes this as an effect dependency, so a fresh object each
  // call would rewrite four meta tags on every render.
  it('returns the same object for the same figure', () => {
    expect(socialImage(catalogue[0])).toBe(socialImage(catalogue[0]));
    expect(socialImage(null)).toBe(socialImage(null));
  });
});
