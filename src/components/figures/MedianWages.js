import React from 'react';
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Label,
} from 'recharts';
import { getAdjustedWageData, BASE_YEAR } from '../../data/affordability/WageData';
import { series, ink, axisProps, gridProps, tooltipProps, lineProps, paddedDomain, CHART_HEIGHT } from './chartTheme';

const data = getAdjustedWageData();
const peak = data.reduce((a, b) => (b.wage > a.wage ? b : a));

// One series, so no legend: the title names it. The peak is direct-labelled
// because "the high point was five years ago" is the whole story here.
const MedianWagesChart = () => (
  <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
    <LineChart data={data} margin={{ top: 24, right: 16, bottom: 4, left: 4 }}>
      <CartesianGrid {...gridProps} />
      <XAxis dataKey="year" {...axisProps} />
      <YAxis
        {...axisProps}
        width={56}
        domain={paddedDomain(0.2)}
        tickFormatter={(v) => `$${Math.round(v)}`}
      />
      <Tooltip
        {...tooltipProps}
        formatter={(v) => [`$${v.toFixed(2)}`, `${BASE_YEAR} dollars`]}
      />
      <ReferenceLine x={peak.year} stroke={ink.axis} strokeWidth={1}>
        <Label
          value={`Peak $${Math.round(peak.wage)}`}
          position="top"
          fill={ink.secondary}
          fontSize={12}
        />
      </ReferenceLine>
      <Line {...lineProps} dataKey="wage" name={`Median weekly wage (${BASE_YEAR} $)`} stroke={series[1]} />
    </LineChart>
  </ResponsiveContainer>
);

export const wageTable = {
  caption: `Median weekly wage, Alberta, in constant ${BASE_YEAR} dollars`,
  columns: [
    { key: 'year', label: 'Year' },
    { key: 'nominalWage', label: 'Nominal ($/week)' },
    { key: 'wage', label: `Real (${BASE_YEAR} $/week)` },
  ],
  rows: data,
};

export default MedianWagesChart;
