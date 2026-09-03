import React from 'react';
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { householdDebtData } from '../../data/economy/HouseholdDebt';
import { series, axisProps, gridProps, tooltipProps, legendProps, lineProps, CHART_HEIGHT } from './chartTheme';

// The axis starts at 100 rather than 0. Below 100 a household would owe less
// than a single year of income, which no province has been near in this
// period, and a zero baseline would flatten the whole range into the top
// eighth of the chart. The floor is a round, meaningful number rather than one
// chosen to make the movement look bigger.
const HouseholdDebtChart = () => (
  <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
    <LineChart data={householdDebtData} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
      <CartesianGrid {...gridProps} />
      <XAxis dataKey="year" {...axisProps} minTickGap={20} />
      <YAxis
        {...axisProps}
        width={48}
        domain={[100, 230]}
        tickFormatter={(v) => `${v}%`}
      />
      <Tooltip {...tooltipProps} formatter={(v) => `${v}% of disposable income`} />
      <Legend {...legendProps} />
      <Line {...lineProps} dataKey="alberta" name="Alberta" stroke={series[1]} />
      <Line {...lineProps} dataKey="canada" name="Canada" stroke={series[2]} />
    </LineChart>
  </ResponsiveContainer>
);

export const householdDebtTable = {
  caption: 'Household debt as a share of disposable income, fourth quarter of each year',
  columns: [
    { key: 'year', label: 'Year' },
    { key: 'alberta', label: 'Alberta (%)' },
    { key: 'canada', label: 'Canada (%)' },
  ],
  rows: householdDebtData,
};

export default HouseholdDebtChart;
