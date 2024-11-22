// src/pages/Home.js
import React, { useState } from 'react';
import ERWaitTimesChart from '../components/ERWaitTimesChart';
import Footer from '../components/Footer';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Home = () => {
  // Median weekly wage data (in current dollars)
  const wageData = {
    2019: 1042.50,
    2020: 1116.00,
    2021: 1099.27,
    2022: 1116.00,
    2023: 1153.92,
  };

  // CPI data for Alberta (hypothetical values, replace with actual data from Statistics Canada)
  // https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1810000501
  const cpiData = {
    2019: 136,  // CPI for 2019
    2020: 137,  // CPI for 2020
    2021: 141.6,  // CPI for 2021
    2022: 151.2,  // CPI for 2022
    2023: 157.1,  // CPI for 2023 (base year)
  };

  // Adjust wages for inflation using the CPI values for 2023
  const adjustedWages = Object.keys(wageData).map(year => {
    const inflationFactor = cpiData[2023] / cpiData[year]; // Adjust to 2023 dollars
    return {
      year: year,
      adjustedWage: wageData[year] * inflationFactor,
    };
  });

  // Data format for the line chart
  const chartData = adjustedWages.map(item => ({
    year: item.year,
    wage: item.adjustedWage.toFixed(2), // Round to 2 decimal places for display
  }));

  const maxWage = Math.max(...adjustedWages.map(item => item.adjustedWage));
  const roundedMaxWage = Math.ceil(maxWage*1.1 / 10) * 10;

  return (
    <div className="home-page">
      {/* Header Section */}
      <header className="header">
        <h1>Alberta Health Care Dashboard</h1>
        <p className="intro-text">
          A comprehensive, data-driven overview of key issues affecting the healthcare system and economy in Alberta, Canada.
        </p>
      </header>

      {/* Main Content Section */}
      <main className="main-content">
        <section className="stats-section">
          {/* ER Wait Times Chart Section */}
          <div className="stat-card-container">
            <h2>90th Percentile ER Wait Times</h2>
            <p className="stat-description">
              This chart visualizes the time to initial physician assessment at the 90th percentile across Alberta's largest ER sites.
            </p>
            <ERWaitTimesChart />
          </div>

          {/* Median Weekly Wage Line Chart Section */}
          <div className="stat-card-container">
            <h2>Median Weekly Wage in Alberta (2019–2023, Adjusted for Inflation)</h2>
            <p className="stat-description">
              This line chart visualizes the median weekly wage for all employees in Alberta across various years, adjusted for inflation to 2023 dollars.
            </p>

            {/* Line chart for wages */}
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" stroke="#8884d8" />
              <YAxis
                stroke="#8884d8"
                domain={[0, roundedMaxWage]}  // Extend the Y-axis to 10% above the maximum wage
              />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="wage" stroke="#8884d8" activeDot={{ r: 8 }} />
            </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </main>

      {/* Footer Section */}
      <Footer />
    </div>
  );
};

export default Home;
