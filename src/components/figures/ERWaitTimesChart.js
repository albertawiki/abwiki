import React from 'react';
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList,
} from 'recharts';
import { erWaitTimesData } from '../../data/healthcare/ERData';
import { series, ink, axisProps, gridProps, tooltipProps, CHART_HEIGHT } from './chartTheme';

// Five discrete fiscal years, so bars rather than a line: there is no
// continuous path between two annual summary statistics.
const ERWaitTimesChart = () => (
  <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
    <BarChart data={erWaitTimesData} margin={{ top: 20, right: 16, bottom: 4, left: 4 }}>
      <CartesianGrid {...gridProps} />
      <XAxis dataKey="year" {...axisProps} />
      <YAxis {...axisProps} width={44} domain={[0, 8]} tickFormatter={(v) => `${v}h`} />
      <Tooltip {...tooltipProps} cursor={{ fill: 'rgba(11,11,11,0.04)' }} formatter={(v) => [`${v.toFixed(1)} hours`, '90th percentile wait']} />
      <Bar dataKey="hours" name="90th percentile wait" fill={series[1]} radius={[4, 4, 0, 0]} maxBarSize={56}>
        <LabelList dataKey="hours" position="top" fill={ink.secondary} fontSize={12} formatter={(v) => `${v.toFixed(1)}h`} />
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);

export const erTable = {
  caption: '90th percentile time to initial physician assessment, 16 largest Alberta emergency departments',
  columns: [
    { key: 'year', label: 'Fiscal year' },
    { key: 'hours', label: 'Hours' },
  ],
  rows: erWaitTimesData,
};

export default ERWaitTimesChart;
