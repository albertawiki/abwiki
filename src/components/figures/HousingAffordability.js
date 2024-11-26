import React from "react";
import { formatHousingData } from "../../data/affordability/HousingAffordabilityData";
import { LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, ResponsiveContainer } from "recharts";

const HousingAffordabilityChart = () => {
  const data = formatHousingData();

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          type="category"
          allowDuplicatedCategory={false}
        />
        <YAxis 
          domain={([dataMin, dataMax]) => { const dataRange = (dataMax - dataMin)*0.1; return [Math.round(dataMin - dataRange), Math.round(dataMax + dataRange)]; }}
        />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="value"
          data={data.filter(d => d.city === 'calgary')}
          name="Calgary"
          stroke="red"
          strokeWidth="3"
          activeDot={{ r: 8 }}
        />
        <Line
          type="monotone"
          dataKey="value"
          data={data.filter(d => d.city === 'edmonton')}
          name="Edmonton"
          stroke="green"
          strokeWidth="3"
          activeDot={{ r: 8 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default HousingAffordabilityChart;
