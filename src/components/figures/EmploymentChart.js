import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { EMPLOYMENT_RATE_API, employmentRateFallback } from '../../data/economy/Employment';
import { series, axisProps, gridProps, tooltipProps, lineProps, paddedDomain, CHART_HEIGHT } from './chartTheme';

const MONTHS_SHOWN = 72;

const monthLabel = (iso) => iso.slice(0, 7);

/**
 * Employment rate, fetched live from the Government of Alberta's Economic
 * Dashboard.
 *
 * A live chart that silently renders an empty frame when its API breaks is
 * worse than no chart, so a failed fetch falls back to annual averages and
 * says so on the figure.
 */
const EmploymentChart = () => {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch(EMPLOYMENT_RATE_API);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const raw = await response.json();
        if (!Array.isArray(raw) || raw.length === 0) throw new Error('empty response');

        const monthly = raw
          .filter((row) => row.Date && typeof row.Value === 'number')
          .sort((a, b) => a.Date.localeCompare(b.Date))
          .slice(-MONTHS_SHOWN)
          .map((row) => ({ period: monthLabel(row.Date), employmentRate: row.Value }));

        if (!cancelled) {
          setData(monthly);
          setStatus('live');
        }
      } catch (error) {
        console.error('Employment rate fetch failed, using annual averages:', error);
        if (!cancelled) {
          setData(employmentRateFallback.map((d) => ({ period: String(d.year), employmentRate: d.employmentRate })));
          setStatus('fallback');
        }
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

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
            domain={paddedDomain(0.25)}
            tickFormatter={(v) => `${v.toFixed(1)}%`}
          />
          <Tooltip {...tooltipProps} formatter={(v) => [`${v}%`, 'Employment rate']} />
          <Line {...lineProps} dot={false} dataKey="employmentRate" name="Employment rate" stroke={series[1]} />
        </LineChart>
      </ResponsiveContainer>
      {status === 'fallback' && (
        <p className="chart-warning" role="status">
          Live data from the Alberta Economic Dashboard is unavailable right now.
          Showing annual averages last verified 2026-08-31.
        </p>
      )}
    </>
  );
};

export default EmploymentChart;
