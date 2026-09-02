import React from 'react';
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { diversificationData } from '../../data/diversification/Diversification';
import { series, axisProps, gridProps, tooltipProps, lineProps, CHART_HEIGHT } from './chartTheme';

// The axis is deliberately wide relative to the movement. This series has
// drifted about a point and a half in forty years, and a tight domain would
// turn a slow structural change into a dramatic-looking collapse. Nineteen is
// marked implicitly by the ceiling: it is the score Alberta would get if every
// industry employed the same number of people.
const IndustryConcentrationChart = () => (
  <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
    <LineChart data={diversificationData} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
      <CartesianGrid {...gridProps} />
      <XAxis dataKey="year" {...axisProps} minTickGap={30} />
      <YAxis {...axisProps} width={40} domain={[10, 19]} />
      <Tooltip
        {...tooltipProps}
        formatter={(v) => [`${v} industries`, 'Effective number']}
      />
      <Line
        {...lineProps}
        dot={false}
        dataKey="effectiveIndustriesJobs"
        name="Effective number of industries"
        stroke={series[1]}
      />
    </LineChart>
  </ResponsiveContainer>
);

export const concentrationTable = {
  caption: 'Effective number of industries in Alberta employment, and oil and gas share',
  columns: [
    { key: 'year', label: 'Year' },
    { key: 'effectiveIndustriesJobs', label: 'Effective industries (jobs)' },
    { key: 'oilShareOfJobs', label: 'Oil and gas, % of jobs' },
  ],
  rows: diversificationData,
};

export default IndustryConcentrationChart;
