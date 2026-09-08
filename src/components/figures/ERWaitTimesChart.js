import React from 'react';
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList,
} from 'recharts';
import { erWaitTimesData } from '../../data/healthcare/ERData';
import { series, ink, axisProps, gridProps, tooltipProps, lineProps, CHART_HEIGHT } from './chartTheme';

// A line, because the x axis is time. Bars encode magnitude by length from a
// baseline and read as separate categories; when the categories are
// consecutive years, what a reader wants is the trend, and a line shows it.
// The other annual series on this site are lines, so this one being bars was
// an inconsistency rather than a decision.
//
// Zero-based: hours are a real quantity with a real zero, and the whole story
// here is that the wait has doubled.
const ERWaitTimesChart = () => (
  <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
    <LineChart data={erWaitTimesData} margin={{ top: 24, right: 24, bottom: 4, left: 20 }}>
      <CartesianGrid {...gridProps} />
      {/* Inset the end points so their value labels do not sit on top of the
          y axis or run off the right edge. */}
      <XAxis dataKey="year" {...axisProps} padding={{ left: 24, right: 24 }} />
      <YAxis {...axisProps} width={44} domain={[0, 8]} tickFormatter={(v) => `${v}h`} />
      <Tooltip {...tooltipProps} formatter={(v) => [`${v.toFixed(1)} hours`, '90th percentile wait']} />
      <Line {...lineProps} dataKey="hours" name="90th percentile wait" stroke={series[1]}>
        <LabelList
          dataKey="hours"
          position="top"
          offset={10}
          fill={ink.secondary}
          fontSize={12}
          formatter={(v) => `${v.toFixed(1)}h`}
        />
      </Line>
    </LineChart>
  </ResponsiveContainer>
);

export const erTable = {
  caption: '90th percentile time to initial physician assessment, 16 largest Alberta emergency departments',
  columns: [
    { key: 'year', label: 'Fiscal year' },
    { key: 'hours', label: 'Hours' },
  ],
  rows: erWaitTimesData,
};

export default ERWaitTimesChart;
