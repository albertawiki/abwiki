// src/components/ERWaitTimesChart.js
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ERWaitTimesChart = () => {
  // Data: 90th percentile times for physician assessment (in hours)
  const data = [
    { year: '2020-21', time: 3.4 },
    { year: '2021-22', time: 4.5 },
    { year: '2022-23', time: 6.2 },
    { year: '2023-24', time: 6.7 },
  ];

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" />
        <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="time" stroke="#8884d8" strokeWidth={3} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default ERWaitTimesChart;
