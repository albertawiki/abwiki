import React from 'react';
import { useParams } from 'react-router-dom';
import usePageMeta from '../hooks/usePageMeta';
import AlbertaMark from '../components/AlbertaMark';
import { figureById, figureTitle, sourceAttribution } from '../figures';

/**
 * A figure drawn at social-card proportions, for `scripts/render-og-images.mjs`
 * to photograph.
 *
 * People share charts, not dashboards, and a shared link that previews as a
 * bare title is a chart that arrived without its chart. This page exists only
 * to be turned into a 1200x630 PNG at build time: it is not linked from
 * anywhere, not in the sitemap, and not in `routes()`.
 *
 * It is a separate page rather than a screenshot of the real card because the
 * real card is built for a reader — it carries buttons that open drawers, a
 * link to itself, and a column width set by the page around it. None of that
 * survives being flattened into an image, and all of it would be in the
 * picture.
 *
 * Three things it must carry, because an image that travels alone has to say
 * where it came from: the question, the chart, and who published the numbers.
 */
const OgCard = () => {
  const { figureId } = useParams();
  const figure = figureById(figureId);

  // It duplicates a page that does exist and nothing links to it, so it is not
  // for indexing. robots.txt says the same thing; this is the half that
  // survives someone arriving at the URL directly.
  usePageMeta({ noindex: true });

  if (!figure) return <div className="og-card og-card-missing">No figure at /f/{figureId}</div>;

  const { Chart, meta } = figure;

  return (
    <div className="og-card" data-og-ready={figureId}>
      <div className="og-card-brand">
        <AlbertaMark className="og-card-mark" />
        <span>alberta.wiki</span>
      </div>

      <h1 className="og-card-title">{figureTitle(figure)}</h1>
      <p className="og-card-subtitle">
        {meta.unit}
        {meta.geography ? ` · ${meta.geography}` : ''}
      </p>

      <div className="og-card-figure">
        <Chart />
      </div>

      <p className="og-card-source">Source: {sourceAttribution(meta)}</p>
    </div>
  );
};

export default OgCard;
