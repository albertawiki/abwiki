import React from 'react';
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Label,
} from 'recharts';
import { gdpPerCapitaData } from '../../data/economy/GdpPerCapita';
import { series, ink, axisProps, gridProps, tooltipProps, lineProps, paddedDomain, CHART_HEIGHT } from './chartTheme';

const peak = gdpPerCapitaData.reduce((a, b) => (b.perCapita > a.perCapita ? b : a));

// One series, so no legend: the title names it. The 2014 peak is marked
// because the distance between it and today is the point of the figure.
const GdpPerCapitaChart = () => (
  <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
    <LineChart data={gdpPerCapitaData} margin={{ top: 24, right: 16, bottom: 4, left: 4 }}>
      <CartesianGrid {...gridProps} />
      <XAxis dataKey="year" {...axisProps} minTickGap={28} />
      <YAxis
        {...axisProps}
        width={60}
        domain={paddedDomain(0.15)}
        tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
      />
      <Tooltip
        {...tooltipProps}
        formatter={(v) => [`$${v.toLocaleString()}`, 'Per person (2017 dollars)']}
      />
      <ReferenceLine x={peak.year} stroke={ink.axis} strokeWidth={1}>
        <Label
          value={`Peak $${Math.round(peak.perCapita / 1000)}k`}
          position="top"
          fill={ink.secondary}
          fontSize={12}
        />
      </ReferenceLine>
      <Line {...lineProps} dataKey="perCapita" name="Real GDP per person" stroke={series[1]} />
    </LineChart>
  </ResponsiveContainer>
);

export const gdpPerCapitaTable = {
  caption: 'Alberta real GDP, population, and output per person',
  columns: [
    { key: 'year', label: 'Year' },
    { key: 'realGdpMillions', label: 'Real GDP ($M, 2017)' },
    { key: 'population', label: 'Population (July 1)' },
    { key: 'perCapita', label: 'Per person ($2017)' },
  ],
  rows: gdpPerCapitaData,
};

export default GdpPerCapitaChart;
