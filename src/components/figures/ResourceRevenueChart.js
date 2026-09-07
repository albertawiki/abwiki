import React from 'react';
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { resourceRevenueData } from '../../data/economy/ResourceRevenue';
import { series, axisProps, gridProps, tooltipProps, barProps, barCursor, CHART_HEIGHT } from './chartTheme';

// Bars rather than a line: these are seventeen discrete fiscal years, and
// there is no continuous path between one year's budget and the next.
//
// The y-axis runs to 35 and starts at zero. The whole content of this figure
// is how far the share swings, and a truncated axis would exaggerate that
// while a padded one would flatten it.
const ResourceRevenueChart = () => (
  <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
    <BarChart data={resourceRevenueData} margin={{ top: 12, right: 16, bottom: 4, left: 4 }}>
      <CartesianGrid {...gridProps} />
      <XAxis dataKey="fiscalYear" {...axisProps} minTickGap={12} />
      <YAxis
        {...axisProps}
        width={44}
        domain={[0, 35]}
        ticks={[0, 10, 20, 30]}
        tickFormatter={(v) => `${v}%`}
      />
      <Tooltip
        {...tooltipProps}
        cursor={barCursor}
        formatter={(v) => [`${v.toFixed(1)}% of provincial revenue`, 'Oil and gas royalties']}
      />
      <Bar dataKey="share" name="Oil and gas royalties" fill={series[1]} {...barProps} />
    </BarChart>
  </ResponsiveContainer>
);

export const resourceRevenueTable = {
  caption: 'Alberta oil and gas royalties and total provincial revenue, by fiscal year',
  columns: [
    { key: 'fiscalYear', label: 'Fiscal year' },
    { key: 'royaltiesMillions', label: 'Royalties ($M)' },
    { key: 'totalRevenueMillions', label: 'Total revenue ($M)' },
    { key: 'share', label: 'Share (%)' },
  ],
  rows: resourceRevenueData,
};

export default ResourceRevenueChart;
