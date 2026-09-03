import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { fetchLabourForce, fallbackRows } from '../../data/economy/labourForceApi';
import { axisProps, gridProps, tooltipProps, legendProps, lineProps, paddedDomain, CHART_HEIGHT } from './chartTheme';

/**
 * One or more Labour Force Survey rates, fetched live with a committed fallback.
 *
 * A live chart that renders an empty frame when its source breaks is worse
 * than no chart, because nothing about the page says anything is wrong. When
 * the fetch fails this falls back to annual averages and says so on the figure.
 */
const LabourRateChart = ({ lines, domainPad = 0.25 }) => {
  const keys = lines.map((l) => l.key);
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;

    fetchLabourForce(keys)
      .then((rows) => {
        if (cancelled) return;
        setData(rows);
        setStatus('live');
      })
      .catch((error) => {
        console.error('Labour Force Survey fetch failed, using annual averages:', error);
        if (cancelled) return;
        setData(fallbackRows(keys));
        setStatus('fallback');
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys.join(',')]);

  if (status === 'loading') {
    return <div className="chart-placeholder" style={{ height: CHART_HEIGHT }}>Loading current data…</div>;
  }

  return (
    <>
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="period" {...axisProps} minTickGap={40} />
          <YAxis
            {...axisProps}
            width={48}
            domain={paddedDomain(domainPad)}
            tickFormatter={(v) => `${v.toFixed(1)}%`}
          />
          <Tooltip {...tooltipProps} formatter={(v, name) => [`${v}%`, name]} />
          {lines.length > 1 && <Legend {...legendProps} />}
          {lines.map(({ key, name, colour }) => (
            <Line {...lineProps} key={key} dot={false} dataKey={key} name={name} stroke={colour} />
          ))}
        </LineChart>
      </ResponsiveContainer>
      {status === 'fallback' && (
        <p className="chart-warning" role="status">
          Live data from Statistics Canada is unavailable right now. Showing annual
          averages last verified 2026-09-02.
        </p>
      )}
    </>
  );
};

export default LabourRateChart;
