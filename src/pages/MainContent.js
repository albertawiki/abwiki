import React from 'react';
import { Link } from 'react-router-dom';
import FigureGrid from '../components/FigureGrid';
import { topics, topicLayout } from '../figures';

/**
 * Every figure on the site, grouped by topic.
 *
 * The dashboard shows all of them; each topic heading links to that topic's
 * own page, which carries the same figures with more context. The figures
 * themselves come from the registry, so a figure added there appears here, on
 * its topic page and at its permalink without being listed three times.
 */
const MainContent = () => (
  <main className="main-content">
    {topics.map((topic) => {
      const { ungrouped, sections } = topicLayout(topic);

      return (
        <section className="topic" id={topic.slug} key={topic.slug}>
          <h2 className="topic-heading">
            <Link to={`/${topic.slug}`}>{topic.label}</Link>
          </h2>

          {/* The same lede the topic's own page opens with, rather than a
              second one written here. Two descriptions of the same figures
              drift apart, and the one nobody is looking at drifts first. */}
          <p className="topic-note">{topic.lede}</p>

          {ungrouped.length > 0 && <FigureGrid figures={ungrouped} headingLevel={3} />}

          {sections.map((section) => (
            <section className="topic-section" id={section.id} key={section.id}>
              <h3 className="topic-subheading">{section.heading}</h3>
              {section.note && <p className="topic-note">{section.note}</p>}
              <FigureGrid figures={section.figures} headingLevel={4} />
            </section>
          ))}
        </section>
      );
    })}
  </main>
);

export default MainContent;
