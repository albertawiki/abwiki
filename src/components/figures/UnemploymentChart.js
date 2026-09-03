import React from 'react';
import LabourRateChart from './LabourRateChart';
import { series } from './chartTheme';
import { labourForceFallback } from '../../data/economy/labourForceApi';

const UnemploymentChart = () => (
  <LabourRateChart
    lines={[{ key: 'unemploymentRate', name: 'Unemployment rate', colour: series[1] }]}
  />
);

export const unemploymentTable = {
  caption: 'Annual averages of the monthly Labour Force Survey, Alberta',
  columns: [
    { key: 'year', label: 'Year' },
    { key: 'unemploymentRate', label: 'Unemployment rate (%)' },
  ],
  rows: labourForceFallback,
};

export default UnemploymentChart;
