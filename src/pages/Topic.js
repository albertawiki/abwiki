import React from 'react';
import { Link } from 'react-router-dom';
import usePageMeta from '../hooks/usePageMeta';
import Footer from '../components/Footer';
import FigureGrid from '../components/FigureGrid';
import { SITE_ORIGIN, topicLayout, figuresForTopic } from '../figures';

/** Every source cited by a topic's figures, once each, in the order first cited. */
const sourcesFor = (slug) => {
  const seen = new Map();
  figuresForTopic(slug).forEach(({ meta }) => {
    (meta.sources || []).forEach((source) => {
      if (!seen.has(source.url)) seen.set(source.url, source);
    });
  });
  return [...seen.values()];
};

/**
 * One topic's figures, with the context the dashboard has no room for.
 *
 * These pages exist for two reasons. A reader who came for healthcare should
 * not have to scroll past eleven other charts, and a link shared in an
 * argument about healthcare should land on healthcare rather than on
 * everything at once.
 */
const Topic = ({ topic }) => {
  const { ungrouped, sections } = topicLayout(topic);
  const sources = sourcesFor(topic.slug);

  usePageMeta({
    title: `${topic.label} in Alberta`,
    description: topic.lede,
    canonical: `${SITE_ORIGIN}/${topic.slug}`,
  });

  return (
    <div className="topic-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Dashboard</Link>
        <span aria-hidden="true"> › </span>
        <span aria-current="page">{topic.label}</span>
      </nav>

      <header className="header">
        <h1>{topic.label}</h1>
        <p className="intro-text">{topic.lede}</p>
      </header>

      <main className="main-content">
        {ungrouped.length > 0 && <FigureGrid figures={ungrouped} headingLevel={2} />}

        {sections.map((section) => (
          <section className="topic-section" id={section.id} key={section.id}>
            <h2 className="topic-heading">{section.heading}</h2>
            {section.note && <p className="topic-note">{section.note}</p>}
            <FigureGrid figures={section.figures} headingLevel={3} />
          </section>
        ))}

        <section className="topic-sources">
          <h2 className="topic-heading">Where these figures come from</h2>
          <p className="topic-note">
            Every number on this page traces to one of these documents. Each figure
            names the ones it uses under its own Sources button.
          </p>
          <ul>
            {sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                  {source.text}
                </a>
                {source.retrieved && (
                  <span className="retrieved"> (retrieved {source.retrieved})</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      </main>

      <div className="footer-spacing" />
      <Footer />
    </div>
  );
};

export default Topic;
