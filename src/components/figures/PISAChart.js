import React from 'react';
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { pisaData } from '../../data/education/PISA';
import { series, axisProps, gridProps, tooltipProps, legendProps, lineProps, CHART_HEIGHT } from './chartTheme';

// A narrow band, deliberately. PISA scores move by single points between
// rounds; a zero-based axis would flatten every real change to nothing, and a
// tight auto-domain would magnify sampling noise. 480–560 covers the range
// Alberta has actually occupied.
const PISAChart = () => (
  <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
    <LineChart data={pisaData} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
      <CartesianGrid {...gridProps} />
      <XAxis dataKey="year" {...axisProps} />
      <YAxis {...axisProps} width={44} domain={[480, 560]} />
      <Tooltip {...tooltipProps} />
      <Legend {...legendProps} />
      <Line {...lineProps} dataKey="reading" name="Reading" stroke={series[1]} />
      <Line {...lineProps} dataKey="science" name="Science" stroke={series[2]} />
      <Line {...lineProps} dataKey="math" name="Mathematics" stroke={series[3]} />
    </LineChart>
  </ResponsiveContainer>
);

export const pisaTable = {
  caption: 'Alberta mean PISA scores',
  columns: [
    { key: 'year', label: 'Round' },
    { key: 'reading', label: 'Reading' },
    { key: 'science', label: 'Science' },
    { key: 'math', label: 'Mathematics' },
  ],
  rows: pisaData,
};

export default PISAChart;
