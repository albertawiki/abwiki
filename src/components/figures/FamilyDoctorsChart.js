import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { familyDoctorData } from "../../data/healthcare/FamilyDoctorData";

const FamilyDoctorsChart = () => {

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={familyDoctorData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" />
        <YAxis 
          label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} 
          domain={([dataMin, dataMax]) => { const dataRange = (dataMax - dataMin)*0.1; return [Math.round(dataMin - dataRange), Math.round(dataMax + dataRange)]; }}
        />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="time" strokeWidth={3} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default FamilyDoctorsChart;
