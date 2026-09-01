import React from 'react';
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { combinedData } from '../../data/education/PISA';
import { series, axisProps, gridProps, tooltipProps, legendProps, barProps, CHART_HEIGHT } from './chartTheme';

// Grouped, not stacked: these three gaps are separate measurements of the same
// students, so adding them together would mean nothing.
const PISAGapChart = () => (
  <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
    <BarChart data={combinedData} margin={{ top: 8, right: 16, bottom: 4, left: 4 }} barGap={2}>
      <CartesianGrid {...gridProps} />
      <XAxis dataKey="year" {...axisProps} />
      <YAxis {...axisProps} width={44} domain={[0, 180]} />
      <Tooltip {...tooltipProps} cursor={{ fill: 'rgba(11,11,11,0.04)' }} formatter={(v) => [`${v} points`, null]} />
      <Legend {...legendProps} iconType="square" />
      <Bar dataKey="gapReading" name="Reading" fill={series[1]} {...barProps} maxBarSize={40} />
      <Bar dataKey="gapScience" name="Science" fill={series[2]} {...barProps} maxBarSize={40} />
      <Bar dataKey="gapMath" name="Mathematics" fill={series[3]} {...barProps} maxBarSize={40} />
    </BarChart>
  </ResponsiveContainer>
);

export const pisaGapTable = {
  caption: 'Points between the 75th and 25th percentile of Alberta students',
  columns: [
    { key: 'year', label: 'Round' },
    { key: 'gapReading', label: 'Reading' },
    { key: 'gapScience', label: 'Science' },
    { key: 'gapMath', label: 'Mathematics' },
  ],
  rows: combinedData,
};

export default PISAGapChart;
