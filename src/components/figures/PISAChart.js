import React from 'react';
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { pisaData } from '../../data/education/PISA';
import { series, axisProps, gridProps, tooltipProps, legendProps, lineProps, CHART_HEIGHT } from './chartTheme';

// 450–570, which is roughly plus or minus two thirds of a standard deviation
// on a scale built with a mean of 500 and a standard deviation of 100.
//
// This was 480–560 and that was too tight. Alberta's reading score moved 532
// to 525 between 2018 and 2022, which CMEC does not mark as a significant
// change at all, and on an eighty-point axis it read as a cliff. A chart that
// makes a non-result look like a collapse is doing the same job as a
// truncated axis, which this project's own contributing guide forbids.
//
// Zero-based is not the alternative: PISA is a constructed scale with no
// meaningful zero, so a zero baseline would be arbitrary rather than honest.
const PISAChart = () => (
  <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
    <LineChart data={pisaData} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
      <CartesianGrid {...gridProps} />
      <XAxis dataKey="year" {...axisProps} />
      <YAxis {...axisProps} width={44} domain={[450, 570]} ticks={[450, 480, 510, 540, 570]} />
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
