import React from 'react';
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { oilShareData } from '../../data/diversification/Diversification';
import { series, axisProps, gridProps, tooltipProps, legendProps, lineProps, CHART_HEIGHT } from './chartTheme';

// Zero-based, because both lines are shares of a whole and the distance
// between them is the entire point of the figure. Truncating the axis would
// exaggerate a gap that is already large enough to make the argument.
const OilShareChart = () => (
  <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
    <LineChart data={oilShareData} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
      <CartesianGrid {...gridProps} />
      <XAxis dataKey="year" {...axisProps} minTickGap={30} />
      <YAxis {...axisProps} width={44} domain={[0, 40]} tickFormatter={(v) => `${v}%`} />
      <Tooltip {...tooltipProps} formatter={(v, name) => [`${v}%`, name]} />
      <Legend {...legendProps} />
      <Line {...lineProps} dataKey="oilShareOfGdp" name="Share of output" stroke={series[2]} />
      <Line {...lineProps} dataKey="oilShareOfJobs" name="Share of jobs" stroke={series[1]} />
    </LineChart>
  </ResponsiveContainer>
);

export const oilShareTable = {
  caption: 'Oil and gas extraction as a share of Alberta output and of Alberta employment',
  columns: [
    { key: 'year', label: 'Year' },
    { key: 'oilShareOfGdp', label: '% of output' },
    { key: 'oilShareOfJobs', label: '% of jobs' },
  ],
  rows: oilShareData,
};

export default OilShareChart;
