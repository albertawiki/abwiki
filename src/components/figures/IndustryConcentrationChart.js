import React from 'react';
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { concentrationData } from '../../data/diversification/Diversification';
import { series, axisProps, gridProps, tooltipProps, legendProps, lineProps, CHART_HEIGHT } from './chartTheme';

// Canada and Ontario are drawn because the number is meaningless alone: a
// reader shown "13.5 effective industries" has no way to know whether that is
// spread out or concentrated. Ontario is the most-cited provincial comparator
// and Canada is the natural benchmark. Quebec and British Columbia are in the
// data table rather than the chart, because five lines in a four-point range
// is unreadable and the palette is validated to three.
const IndustryConcentrationChart = () => (
  <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
    <LineChart data={concentrationData} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
      <CartesianGrid {...gridProps} />
      <XAxis dataKey="year" {...axisProps} minTickGap={30} />
      <YAxis {...axisProps} width={40} domain={[10, 16]} />
      <Tooltip {...tooltipProps} formatter={(v, name) => [`${v} industries`, name]} />
      <Legend {...legendProps} />
      <Line {...lineProps} dot={false} dataKey="alberta" name="Alberta" stroke={series[1]} />
      <Line {...lineProps} dot={false} dataKey="canada" name="Canada" stroke={series[2]} />
      <Line {...lineProps} dot={false} dataKey="ontario" name="Ontario" stroke={series[3]} />
    </LineChart>
  </ResponsiveContainer>
);

export const concentrationTable = {
  caption: 'Effective number of industries in employment, by province',
  columns: [
    { key: 'year', label: 'Year' },
    { key: 'alberta', label: 'Alberta' },
    { key: 'canada', label: 'Canada' },
    { key: 'ontario', label: 'Ontario' },
    { key: 'quebec', label: 'Quebec' },
    { key: 'britishColumbia', label: 'B.C.' },
  ],
  rows: concentrationData,
};

export default IndustryConcentrationChart;
