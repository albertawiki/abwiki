import React from 'react';
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { povertyData } from '../../data/affordability/Poverty';
import { series, axisProps, gridProps, tooltipProps, legendProps, lineProps, CHART_HEIGHT } from './chartTheme';

// The two Market Basket Measure bases are drawn as separate lines rather than
// spliced: they are different measures, and joining them would invent a step
// at the changeover.
const PovertyChart = () => (
  <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
    <LineChart data={povertyData} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
      <CartesianGrid {...gridProps} />
      <XAxis dataKey="year" {...axisProps} />
      <YAxis {...axisProps} width={44} domain={[0, 35]} tickFormatter={(v) => `${v}%`} />
      <Tooltip {...tooltipProps} formatter={(v) => (v === null ? '—' : `${v}%`)} />
      <Legend {...legendProps} />
      <Line {...lineProps} dataKey="foodInsecurity" name="Food insecurity" stroke={series[2]} />
      <Line {...lineProps} dataKey="povertyMBM2018" name="Poverty (MBM, 2018 base)" stroke={series[1]} />
      <Line
        {...lineProps}
        dataKey="povertyMBM2023"
        name="Poverty (MBM, 2023 base)"
        stroke={series[3]}
        strokeDasharray="5 3"
      />
    </LineChart>
  </ResponsiveContainer>
);

export const povertyTable = {
  caption: 'Poverty and food insecurity, Alberta, by reference year',
  columns: [
    { key: 'year', label: 'Reference year' },
    { key: 'povertyMBM2018', label: 'Poverty, MBM 2018 base (%)' },
    { key: 'povertyMBM2023', label: 'Poverty, MBM 2023 base (%)' },
    { key: 'foodInsecurity', label: 'Food insecurity (%)' },
  ],
  rows: povertyData,
};

export default PovertyChart;
