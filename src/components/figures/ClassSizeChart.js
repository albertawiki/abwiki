import React from 'react';
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { classSizeData } from '../../data/education/ClassSize';
import { series, axisProps, gridProps, tooltipProps, barProps, barCursor, legendProps, CHART_HEIGHT } from './chartTheme';

// Three bars per cohort: the guideline Alberta set, the first year it funded
// against that guideline, and the last year it measured. A line chart would
// imply a continuous path through years that are not all shown, and the middle
// years are in the data table.
//
// Zero-based, because these are counts of children and a truncated axis would
// turn a difference of three students into a visual chasm.
const ClassSizeChart = () => (
  <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
    <BarChart data={classSizeData} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
      <CartesianGrid {...gridProps} />
      <XAxis dataKey="cohort" {...axisProps} interval={0} tickFormatter={(v) => v.replace('Kindergarten to Grade 3', 'K to Grade 3')} />
      <YAxis {...axisProps} width={36} domain={[0, 28]} ticks={[0, 7, 14, 21, 28]} />
      <Tooltip {...tooltipProps} cursor={barCursor} formatter={(v, name) => [`${v} students`, name]} />
      <Legend {...legendProps} />
      <Bar dataKey="guideline" name="Guideline" fill={series[3]} {...barProps} />
      <Bar dataKey="y2004_05" name="2004/05" fill={series[2]} {...barProps} />
      <Bar dataKey="y2018_19" name="2018/19 (last measured)" fill={series[1]} {...barProps} />
    </BarChart>
  </ResponsiveContainer>
);

export const classSizeTable = {
  caption: 'Alberta average class size in core subjects, by grade cohort and school year',
  columns: [
    { key: 'cohort', label: 'Grade cohort' },
    { key: 'guideline', label: 'Guideline' },
    { key: 'y2003_04', label: '2003/04' },
    { key: 'y2004_05', label: '2004/05' },
    { key: 'y2016_17', label: '2016/17' },
    { key: 'y2017_18', label: '2017/18' },
    { key: 'y2018_19', label: '2018/19' },
  ],
  rows: classSizeData,
};

export default ClassSizeChart;
