import React from 'react';
import StatCard from './StatCard';

/**
 * A responsive grid of figure cards, rendered from the figure registry.
 *
 * `headingLevel` is passed down rather than fixed, because the dashboard nests
 * these one level deeper than a topic page does.
 */
const FigureGrid = ({ figures, headingLevel = 3, permalink = true }) => (
  <div className="stats-section">
    {figures.map(({ id, meta, title, description, table, Chart }) => (
      <StatCard
        key={id}
        id={id}
        meta={meta}
        title={title}
        description={description}
        table={table}
        permalink={permalink}
        headingLevel={headingLevel}
      >
        <Chart />
      </StatCard>
    ))}
  </div>
);

export default FigureGrid;
