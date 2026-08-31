import React from 'react';
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { housingAffordability } from '../../data/affordability/HousingAffordabilityData';
import { series, axisProps, gridProps, tooltipProps, legendProps, lineProps, paddedDomain, CHART_HEIGHT } from './chartTheme';

// Calgary keeps blue and Edmonton keeps orange no matter which is higher —
// colour follows the city, never its rank.
const HousingAffordabilityChart = () => (
  <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
    <LineChart data={housingAffordability} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
      <CartesianGrid {...gridProps} />
      <XAxis
        dataKey="quarter"
        {...axisProps}
        interval="preserveStartEnd"
        minTickGap={28}
      />
      <YAxis {...axisProps} width={44} domain={paddedDomain(0.15)} tickFormatter={(v) => `${Math.round(v)}%`} />
      <Tooltip {...tooltipProps} formatter={(v) => (v === null ? '—' : `${v}%`)} />
      <Legend {...legendProps} />
      <Line {...lineProps} dataKey="calgary" name="Calgary" stroke={series[1]} />
      <Line {...lineProps} dataKey="edmonton" name="Edmonton" stroke={series[2]} />
    </LineChart>
  </ResponsiveContainer>
);

export const housingTable = {
  caption: 'Ownership costs as a share of median pre-tax household income',
  columns: [
    { key: 'quarter', label: 'Quarter' },
    { key: 'calgary', label: 'Calgary (%)' },
    { key: 'edmonton', label: 'Edmonton (%)' },
    { key: 'report', label: 'RBC report' },
  ],
  rows: housingAffordability,
};

export default HousingAffordabilityChart;
