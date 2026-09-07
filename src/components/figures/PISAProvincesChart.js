import React from 'react';
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { pisaProvincesBySubject, pisaProvincesData } from '../../data/education/PISAProvinces';
import { series, axisProps, gridProps, tooltipProps, barProps, barCursor, legendProps, CHART_HEIGHT } from './chartTheme';

// Alberta, Canada and Ontario are drawn; every province is in the data table.
// The palette is validated for colour-vision deficiency at three series, and
// eleven bars per subject would be a league table rather than a comparison.
//
// The axis starts at 400 rather than zero. PISA is a constructed scale with no
// meaningful zero, and its standard deviation is about 100, so a zero-based
// axis would compress every real difference into nothing. Departing from zero
// is a deliberate exception to the house rule, noted here because it is one.
const PISAProvincesChart = () => (
  <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
    <BarChart data={pisaProvincesBySubject} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
      <CartesianGrid {...gridProps} />
      <XAxis dataKey="subject" {...axisProps} interval={0} />
      <YAxis {...axisProps} width={44} domain={[400, 560]} ticks={[400, 440, 480, 520, 560]} />
      <Tooltip {...tooltipProps} cursor={barCursor} formatter={(v, name) => [`${v}`, name]} />
      <Legend {...legendProps} />
      <Bar dataKey="alberta" name="Alberta" fill={series[1]} {...barProps} />
      <Bar dataKey="canada" name="Canada" fill={series[2]} {...barProps} />
      <Bar dataKey="ontario" name="Ontario" fill={series[3]} {...barProps} />
    </BarChart>
  </ResponsiveContainer>
);

export const pisaProvincesTable = {
  caption: 'PISA 2022 mean scores by jurisdiction, with standard errors',
  columns: [
    { key: 'jurisdiction', label: 'Jurisdiction' },
    { key: 'mathematics', label: 'Mathematics' },
    { key: 'mathematicsSe', label: 'SE' },
    { key: 'reading', label: 'Reading' },
    { key: 'readingSe', label: 'SE' },
    { key: 'science', label: 'Science' },
    { key: 'scienceSe', label: 'SE' },
  ],
  rows: pisaProvincesData,
};

export default PISAProvincesChart;
