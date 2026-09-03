import React from 'react';
import LabourRateChart from './LabourRateChart';
import { series } from './chartTheme';
import { labourForceFallback } from '../../data/economy/labourForceApi';

// Employment and participation share an axis because they are the same kind of
// number on the same scale: the share of everyone 15 and over who is working,
// and the share who are working or looking. Unemployment is a share of the
// labour force rather than the population and runs near 7%, so it gets its own
// figure instead of being flattened against these two.
const EmploymentChart = () => (
  <LabourRateChart
    lines={[
      { key: 'employmentRate', name: 'Employment rate', colour: series[1] },
      { key: 'participationRate', name: 'Participation rate', colour: series[2] },
    ]}
  />
);

export const employmentTable = {
  caption: 'Annual averages of the monthly Labour Force Survey, Alberta',
  columns: [
    { key: 'year', label: 'Year' },
    { key: 'employmentRate', label: 'Employment rate (%)' },
    { key: 'participationRate', label: 'Participation rate (%)' },
  ],
  rows: labourForceFallback,
};

export default EmploymentChart;
