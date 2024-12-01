import React from "react";
import { povertyData } from "../../data/affordability/Poverty";
import { LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, ResponsiveContainer } from "recharts";

const PovertyChart = () => {
  return (
    <ResponsiveContainer width="100%" height={300}>
    <LineChart data={povertyData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" />
        <YAxis 
          domain={([dataMin, dataMax]) => { const dataRange = (dataMax - dataMin)*0.1; return [Math.round(dataMin - dataRange), Math.round(dataMax + dataRange)]; }}
        />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="poverty"
          name="Poverty"
          stroke="red"
          strokeWidth="3"
          activeDot={{ r: 8 }}
        />
        <Line
          type="monotone"
          dataKey="food_insecurity"
          name="Food Insecurity"
          stroke="blue"
          strokeWidth="3"
          activeDot={{ r: 8 }}
        />
    </LineChart>
    </ResponsiveContainer>
  );
};

export default PovertyChart;