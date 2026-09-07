import React from 'react';
import { Link, useParams } from 'react-router-dom';
import usePageMeta from '../hooks/usePageMeta';
import Footer from '../components/Footer';
import StatCard from '../components/StatCard';
import NotFound from './NotFound';
import {
  SITE_ORIGIN,
  figureById,
  figureTitle,
  figuresForTopic,
  topicBySlug,
} from '../figures';

/**
 * A single figure at its own permanent URL.
 *
 * People share charts, not dashboards. A chart that travels without its source
 * and its caveats becomes exactly the kind of context-free number this site
 * exists to replace, so a figure's own page carries both, and opens the
 * caveats rather than hiding them behind a button.
 */
const Figure = () => {
  const { figureId } = useParams();
  const figure = figureById(figureId);

  // Hooks cannot be called conditionally, so the lookup failure is handled
  // after them. The miss case has to declare `noindex` here as well as in
  // NotFound: child effects run before parent ones, so leaving it off would
  // have this effect strip the tag NotFound had just set.
  const title = figure ? figureTitle(figure) : '';
  usePageMeta(
    figure
      ? {
        title,
        description: figure.description,
        canonical: `${SITE_ORIGIN}/f/${figure.id}`,
      }
      : { title: 'Page not found', noindex: true },
  );

  if (!figure) return <NotFound what={`No figure is published at /f/${figureId}.`} />;

  const topic = topicBySlug(figure.topic);
  const siblings = figuresForTopic(figure.topic).filter((f) => f.id !== figure.id);
  const { Chart } = figure;

  return (
    <div className="figure-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Dashboard</Link>
        <span aria-hidden="true"> › </span>
        <Link to={`/${topic.slug}`}>{topic.label}</Link>
        <span aria-hidden="true"> › </span>
        <span aria-current="page">{title}</span>
      </nav>

      <main className="main-content figure-main">
        <StatCard
          id={figure.id}
          meta={figure.meta}
          title={figure.title}
          description={figure.description}
          table={figure.table}
          headingLevel={1}
          defaultPanel="notes"
        >
          <Chart />
        </StatCard>

        {siblings.length > 0 && (
          <section className="figure-siblings">
            <h2>Other figures in {topic.label}</h2>
            <ul>
              {siblings.map((sibling) => (
                <li key={sibling.id}>
                  <Link to={`/f/${sibling.id}`}>{figureTitle(sibling)}</Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <div className="footer-spacing" />
      <Footer />
    </div>
  );
};

export default Figure;
