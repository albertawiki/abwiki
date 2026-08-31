import React, { useState } from 'react';
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
 */
const StatCard = ({ meta, title, description, table, children }) => {
  const [openPanel, setOpenPanel] = useState(null);
  const toggle = (panel) => setOpenPanel((current) => (current === panel ? null : panel));

  const { unit, geography, lastChecked, cadence, sources = [], notes = [] } = meta;
  // Two figures can share one dataset (and so one `meta`); `title` lets the
  // second one name what it actually shows.
  const heading = title || meta.title;

  return (
    <figure className="stat-card">
      <figcaption>
        <h3 className="stat-card-title">{heading}</h3>
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
          <h4>Sources</h4>
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
          <h4>How to read this</h4>
          <ul>
            {notes.map((note, i) => <li key={i}>{note}</li>)}
          </ul>
        </div>
      )}

      {openPanel === 'data' && table && (
        <div className="stat-card-panel">
          <h4>Data table</h4>
          <DataTable {...table} />
        </div>
      )}
    </figure>
  );
};

export default StatCard;
