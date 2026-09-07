import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import DataTable from './DataTable';

const PANELS = {
  sources: 'Sources',
  notes: 'How to read this',
  data: 'Data table',
};

/**
 * One indicator: a headline, a figure, and everything a reader needs to
 * check it.
 *
 * The three drawers are the point of the site rather than an extra. A number
 * with no visible source, no stated caveat and no underlying table is exactly
 * the kind of number this project exists to replace.
 *
 * `headingLevel` exists because the same card appears under a different depth
 * of heading on each page: the dashboard nests it two levels down, a topic
 * page one. Hard-coding h3 would leave one of them with a gap in its heading
 * outline, which is what a screen reader navigates by.
 */
const StatCard = ({
  meta,
  title,
  description,
  table,
  children,
  id,
  permalink = false,
  headingLevel = 3,
  defaultPanel = null,
}) => {
  // A figure's own page opens the caveats by default: someone who followed a
  // permalink came for this figure specifically, and the drawer that matters
  // most is the one saying what the number does not cover.
  const [openPanel, setOpenPanel] = useState(defaultPanel);
  const toggle = (panel) => setOpenPanel((current) => (current === panel ? null : panel));

  const { unit, geography, lastChecked, cadence, sources = [], notes = [] } = meta;
  // Two figures can share one dataset (and so one `meta`); `title` lets the
  // second one name what it actually shows.
  const heading = title || meta.title;
  const Heading = `h${headingLevel}`;
  const PanelHeading = `h${Math.min(headingLevel + 1, 6)}`;

  return (
    <figure className="stat-card" id={id}>
      <figcaption>
        <Heading className="stat-card-title">
          {permalink && id
            ? <Link to={`/f/${id}`} className="stat-card-permalink">{heading}</Link>
            : heading}
        </Heading>
        <p className="stat-card-subtitle">
          {unit}
          {geography ? ` · ${geography}` : ''}
        </p>
        {description && <p className="stat-description">{description}</p>}
      </figcaption>

      <div className="stat-card-figure">{children}</div>

      <div className="stat-card-footer">
        <p className="stat-card-provenance">
          Checked against source {lastChecked}
          {cadence ? ` · updated ${cadence}` : ''}
        </p>
        <div className="stat-card-actions">
          {Object.entries(PANELS).map(([key, label]) => {
            if (key === 'notes' && notes.length === 0) return null;
            if (key === 'data' && !table) return null;
            return (
              <button
                key={key}
                type="button"
                className="source-button"
                aria-expanded={openPanel === key}
                onClick={() => toggle(key)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {openPanel === 'sources' && (
        <div className="stat-card-panel">
          <PanelHeading>Sources</PanelHeading>
          <ul>
            {sources.map((source, i) => (
              <li key={i}>
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                  {source.text}
                </a>
                {source.retrieved && (
                  <span className="retrieved"> (retrieved {source.retrieved})</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {openPanel === 'notes' && (
        <div className="stat-card-panel">
          <PanelHeading>How to read this</PanelHeading>
          <ul>
            {notes.map((note, i) => <li key={i}>{note}</li>)}
          </ul>
        </div>
      )}

      {openPanel === 'data' && table && (
        <div className="stat-card-panel">
          <PanelHeading>Data table</PanelHeading>
          <DataTable {...table} />
        </div>
      )}
    </figure>
  );
};

export default StatCard;
