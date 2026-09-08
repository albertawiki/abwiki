import React from 'react';
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { resourceRevenueData } from '../../data/economy/ResourceRevenue';
import { series, axisProps, gridProps, tooltipProps, lineProps, CHART_HEIGHT } from './chartTheme';

// A line, because the x axis is seventeen consecutive fiscal years. This was
// drawn as bars on the reasoning that each year's budget is a discrete
// outcome, which is true and beside the point: the question a reader brings is
// how the share moves, and seventeen bars answer it worse than one line does.
//
// The y axis runs to 35 from zero. The whole content of this figure is how far
// the share swings, and a truncated axis would exaggerate that while a padded
// one would flatten it.
const ResourceRevenueChart = () => (
  <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
    <LineChart data={resourceRevenueData} margin={{ top: 12, right: 16, bottom: 4, left: 4 }}>
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
        formatter={(v) => [`${v.toFixed(1)}% of provincial revenue`, 'Oil and gas royalties']}
      />
      <Line {...lineProps} dataKey="share" name="Oil and gas royalties" stroke={series[1]} />
    </LineChart>
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
