import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion';
import { featuredFigures, figureTitle, topicBySlug } from '../figures';

const INTERVAL_MS = 8000;

/**
 * The rotating figure at the top of the home page.
 *
 * A dashboard of fifteen charts gives a first-time reader nothing to look at
 * first. This puts one figure forward, and rotates so that the front page is
 * not the same page every visit.
 *
 * What it must not do is move while someone is reading. It stops on hover, on
 * keyboard focus, when the reader presses pause, and entirely when the
 * operating system asks for reduced motion — in that last case the timer never
 * starts, and the arrows are the only way it advances.
 */
const FeaturedCarousel = () => {
  const figures = featuredFigures;
  const reducedMotion = usePrefersReducedMotion();

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const region = useRef(null);

  const count = figures.length;
  const go = useCallback((next) => setIndex((i) => (next + count) % count), [count]);

  // Autoplay runs only when nobody is reading and nobody has asked it not to.
  const playing = !reducedMotion && !paused && !held && count > 1;

  useEffect(() => {
    if (!playing) return undefined;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL_MS);
    return () => clearInterval(timer);
  }, [playing, count]);

  if (count === 0) return null;

  const figure = figures[index];
  const topic = topicBySlug(figure.topic);
  const { Chart } = figure;
  const title = figureTitle(figure);

  const hold = () => setHeld(true);
  // Focus moving between two controls inside the carousel fires blur on the
  // region, so without this check tabbing along the dots would restart the
  // timer under the reader's hands.
  const release = (event) => {
    // relatedTarget is not always an element: it is null when the pointer
    // leaves the window entirely, and contains() throws on anything that is
    // not a Node.
    const movingTo = event?.relatedTarget;
    if (movingTo instanceof Node && region.current?.contains(movingTo)) return;
    setHeld(false);
  };

  return (
    <section
      className="featured"
      aria-label="Featured figures"
      aria-roledescription="carousel"
      ref={region}
      onMouseEnter={hold}
      onMouseLeave={release}
      onFocus={hold}
      onBlur={release}
    >
      <div
        className="featured-slide"
        role="group"
        aria-roledescription="slide"
        aria-label={`${index + 1} of ${count}: ${title}`}
        // Announcing every automatic change would talk over a screen reader
        // user continuously. It announces only once the rotation has stopped,
        // which is when a change is something the reader asked for.
        aria-live={playing ? 'off' : 'polite'}
      >
        <p className="featured-eyebrow">
          Featured · <Link to={`/${topic.slug}`}>{topic.label}</Link>
        </p>

        <h2 className="featured-title">
          <Link to={`/f/${figure.id}`}>{title}</Link>
        </h2>

        <p className="featured-unit">
          {figure.meta.unit}
          {figure.meta.geography ? ` · ${figure.meta.geography}` : ''}
        </p>

        <p className="featured-description">{figure.description}</p>

        <div className="featured-figure">
          {/* Keyed so React replaces the chart rather than trying to reconcile
              one chart's series into another's. */}
          <Chart key={figure.id} />
        </div>

        <p className="featured-more">
          <Link to={`/f/${figure.id}`}>
            See this figure, its sources and its caveats
          </Link>
        </p>
      </div>

      {count > 1 && (
        <div className="featured-controls">
          <button
            type="button"
            className="featured-arrow"
            onClick={() => go(index - 1)}
            aria-label="Previous featured figure"
          >
            ‹
          </button>

          <ul className="featured-dots">
            {figures.map((f, i) => (
              <li key={f.id}>
                <button
                  type="button"
                  className={`featured-dot ${i === index ? 'is-current' : ''}`}
                  aria-label={`Show ${figureTitle(f)}`}
                  aria-current={i === index ? 'true' : undefined}
                  onClick={() => setIndex(i)}
                />
              </li>
            ))}
          </ul>

          {!reducedMotion && (
            <button
              type="button"
              className="featured-pause"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? 'Resume rotating figures' : 'Stop rotating figures'}
            >
              {paused ? '▶' : '❚❚'}
            </button>
          )}

          <button
            type="button"
            className="featured-arrow"
            onClick={() => go(index + 1)}
            aria-label="Next featured figure"
          >
            ›
          </button>
        </div>
      )}
    </section>
  );
};

export default FeaturedCarousel;
