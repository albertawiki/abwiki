import React from "react";
import { combinedData } from "../../data/education/PISA";
import { LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, Bar, ResponsiveContainer } from "recharts";

const PISAChart = () => {
  return (
    <ResponsiveContainer width="100%" height={300}>
    <LineChart data={combinedData} margin={{ top: 20, right: 30, bottom: 20, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" />
        <YAxis domain={([dataMin, dataMax]) => { const dataRange = (dataMax - dataMin)*0.1; return [Math.round(dataMin - dataRange), Math.round(dataMax + dataRange)]; }}
        />
        <Tooltip />
        <Legend />
        {/* Line for average scores */}
        <Line type="monotone" dataKey="math" name="Avg Math" stroke="#8884d8" />
        <Line type="monotone" dataKey="reading" name="Avg Reading" stroke="#82ca9d" />
        <Line type="monotone" dataKey="science" name="Avg Science" stroke="#ffc658" />
    </LineChart>
    </ResponsiveContainer>
  );
};

export default PISAChart;