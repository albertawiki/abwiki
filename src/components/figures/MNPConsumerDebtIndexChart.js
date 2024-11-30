import React from "react";
import { consumerDebtIndex } from "../../data/affordability/ConsumerDebt";
import { LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, ResponsiveContainer } from "recharts";

// Get the adjusted wage data
const consumerDebt = consumerDebtIndex;

const ConsumerDebtChart = () => {
  return (
    <ResponsiveContainer width="100%" height={300}>
    <LineChart data={consumerDebt}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" />
        <YAxis 
          domain={([dataMin, dataMax]) => { const dataRange = (dataMax - dataMin)*0.1; return [Math.round(dataMin - dataRange), Math.round(dataMax + dataRange)]; }}
        />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="percentage" strokeWidth={3} activeDot={{ r: 8 }} />
    </LineChart>
    </ResponsiveContainer>
  );
};

export default ConsumerDebtChart;