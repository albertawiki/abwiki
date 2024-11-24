// src/components/ERWaitTimesChart.js
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { erWaitTimesData } from "../../data/healthcare/ERData";

const ERWaitTimesChart = () => {

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={erWaitTimesData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" />
        <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="time" strokeWidth={3} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default ERWaitTimesChart;
