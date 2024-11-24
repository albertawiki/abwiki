import React from "react";
import { getAdjustedWageData, getMaxAdjustedWage } from "../../data/affordability/WageData";
import { LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, ResponsiveContainer } from "recharts";

// Get the adjusted wage data
const adjustedWageData = getAdjustedWageData();
const roundedMaxWage = getMaxAdjustedWage(adjustedWageData);

const MedianWagesChart = () => {
  return (
    <ResponsiveContainer width="100%" height={300}>
    <LineChart data={adjustedWageData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" />
        <YAxis domain={[0, roundedMaxWage]} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="wage" strokeWidth={3} activeDot={{ r: 8 }} />
    </LineChart>
    </ResponsiveContainer>
  );
};

export default MedianWagesChart;