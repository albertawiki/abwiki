import React from 'react';
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { consumerDebtIndex } from '../../data/affordability/ConsumerDebt';
import { series, axisProps, gridProps, tooltipProps, lineProps, CHART_HEIGHT } from './chartTheme';

// Zero-based: this is a share of a population, and the swings between waves
// are inside the poll's margin of error. A tight auto-domain would turn survey
// noise into a dramatic-looking trend.
const ConsumerDebtChart = () => (
  <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
    <LineChart data={consumerDebtIndex} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
      <CartesianGrid {...gridProps} />
      <XAxis dataKey="quarter" {...axisProps} minTickGap={20} />
      <YAxis {...axisProps} width={44} domain={[0, 60]} tickFormatter={(v) => `${v}%`} />
      <Tooltip
        {...tooltipProps}
        formatter={(v) => [`${v}%`, 'Within $200 of insolvency']}
        labelFormatter={(q) => {
          const row = consumerDebtIndex.find((d) => d.quarter === q);
          return row ? `${q} (wave ${row.wave})` : q;
        }}
      />
      <Line {...lineProps} dataKey="percentage" name="Within $200 of insolvency" stroke={series[1]} />
    </LineChart>
  </ResponsiveContainer>
);

export const consumerDebtTable = {
  caption: 'Share of Alberta respondents $200 or less from insolvency each month',
  columns: [
    { key: 'quarter', label: 'Quarter fielded' },
    { key: 'wave', label: 'MNP wave' },
    { key: 'percentage', label: 'Share (%)' },
  ],
  rows: consumerDebtIndex,
};

export default ConsumerDebtChart;
