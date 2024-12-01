import React from "react";
import { combinedData } from "../../data/education/PISA";
import { ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, Bar, ResponsiveContainer } from "recharts";

const PISAGapChart = () => {
  return (
    <ResponsiveContainer width="100%" height={300}>
    <ComposedChart data={combinedData} margin={{ top: 20, right: 30, bottom: 20, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" />
        <YAxis 
        />
        <Tooltip />
        <Legend />
        {/* Bars for gap */}
        <Bar dataKey="gapMath" name="Math Gap" fill="#ff7300" />
        <Bar dataKey="gapReading" name="Reading Gap" fill="#387908" />
        <Bar dataKey="gapScience" name="Science Gap" fill="#413ea0" />
    </ComposedChart>
    </ResponsiveContainer>
  );
};

export default PISAGapChart;