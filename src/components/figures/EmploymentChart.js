import React, { useEffect, useState } from "react";
import { employmentData } from "../../data/economy/Employment";
import { LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, ResponsiveContainer } from "recharts";

const EmploymentChart = () => {
  const [employmentData, setEmploymentData] = useState([]);

  // TODO: Externalize URL and cleanup
  // Fetch and process data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "https://api.economicdata.alberta.ca/api/data?code=cc63aded-d078-46be-a033-f3b5b81b97ab"
        );
        const rawData = await response.json();

        const currentYear = new Date().getFullYear();
        const lastFiveYears = currentYear - 5;

        // Filter and aggregate data by year
        const filteredData = rawData
          .filter(
            (item) =>
              new Date(item.Date).getFullYear() >= lastFiveYears &&
              item.Characteristic === "Employment rate" // Ensure we're looking at the correct metric
          )
          .reduce((acc, item) => {
            const year = new Date(item.Date).getFullYear();
            if (!acc[year]) {
              acc[year] = { year, total: 0, count: 0 };
            }
            acc[year].total += item.Value;
            acc[year].count += 1;
            return acc;
          }, {});

        // Calculate yearly averages
        const transformedData = Object.values(filteredData).map((item) => ({
          year: item.year,
          employmentRate: Math.round((item.total / item.count) * 100) / 100,
        }));

        setEmploymentData(transformedData);
        //console.log("Fetched Alberta employment data.");
      } catch (error) {
        console.error("Error fetching employment data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <ResponsiveContainer width="100%" height={300}>
    <LineChart data={employmentData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" />
        <YAxis 
          domain={([dataMin, dataMax]) => { const dataRange = (dataMax - dataMin)*0.1; return [Math.round(dataMin - dataRange), Math.round(dataMax + dataRange)]; }}
        />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="employmentRate"
          name="Employment Rate"
          strokeWidth="3"
        />
    </LineChart>
    </ResponsiveContainer>
  );
};

export default EmploymentChart;