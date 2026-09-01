import React from 'react';
import {
  BarChart, Bar, Cell, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList,
} from 'recharts';
import { familyDoctorData } from '../../data/healthcare/FamilyDoctorData';
import { series, ink, axisProps, gridProps, tooltipProps, barProps, CHART_HEIGHT } from './chartTheme';

// The 2025 bar counts nurse practitioners as well as physicians, so it is not
// comparable with the bars before it. It is drawn in a second colour and
// labelled rather than quietly joined to the same series.
const FamilyDoctorsChart = () => (
  <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
    <BarChart data={familyDoctorData} margin={{ top: 20, right: 16, bottom: 4, left: 4 }}>
      <CartesianGrid {...gridProps} />
      <XAxis dataKey="year" {...axisProps} />
      <YAxis {...axisProps} width={48} domain={[0, 1000]} />
      <Tooltip
        {...tooltipProps}
        cursor={{ fill: 'rgba(11,11,11,0.04)' }}
        formatter={(v, _n, item) => [`${v} (${item.payload.scope})`, 'Accepting new patients']}
      />
      <Bar dataKey="providers" name="Accepting new patients" {...barProps}>
        {familyDoctorData.map((d) => (
          <Cell key={d.year} fill={d.scope === 'physicians' ? series[1] : series[2]} />
        ))}
        <LabelList dataKey="providers" position="top" fill={ink.secondary} fontSize={12} />
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);

export const familyDoctorTable = {
  caption: 'Primary care providers listed as accepting new patients, at March 31',
  columns: [
    { key: 'year', label: 'Year' },
    { key: 'providers', label: 'Providers' },
    { key: 'scope', label: 'Counts' },
  ],
  rows: familyDoctorData,
};

export default FamilyDoctorsChart;
