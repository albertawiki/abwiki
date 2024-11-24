// // Median weekly wage data (in current dollars)
// const wageData = {
//     2019: 1042.50,
//     2020: 1116.00,
//     2021: 1099.27,
//     2022: 1116.00,
//     2023: 1153.92,
// };

// // CPI data for Alberta (hypothetical values, replace with actual data from Statistics Canada)
// // https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1810000501
// const cpiData = {
//     2019: 136,  // CPI for 2019
//     2020: 137,  // CPI for 2020
//     2021: 141.6,  // CPI for 2021
//     2022: 151.2,  // CPI for 2022
//     2023: 157.1,  // CPI for 2023 (base year)
// };

// // Adjust wages for inflation using the CPI values for 2023
// const adjustedWages = Object.keys(wageData).map(year => {
// const inflationFactor = cpiData[2023] / cpiData[year]; // Adjust to 2023 dollars
// return {
//     year: year,
//     adjustedWage: wageData[year] * inflationFactor,
// };
// });

// // Data format for the line chart
// const chartData = adjustedWages.map(item => ({
// year: item.year,
// wage: item.adjustedWage.toFixed(2), // Round to 2 decimal places for display
// }));

// const maxWage = Math.max(...adjustedWages.map(item => item.adjustedWage));
// const roundedMaxWage = Math.ceil(maxWage*1.1 / 10) * 10;


// Base CPI year for adjustments
const BASE_YEAR = 2023;
const BASE_CPI = 157.1;

// Data for wages and CPI
const wageCPIData = [
  { year: 2019, wage: 1042.50, cpi: 136 },
  { year: 2020, wage: 1116.00, cpi: 137 },
  { year: 2021, wage: 1099.27, cpi: 141.6 },
  { year: 2022, wage: 1116.00, cpi: 151.2 },
  { year: 2023, wage: 1153.92, cpi: 157.1 },
];

// Function to adjust wages for inflation
export const getAdjustedWageData = () => {
  return wageCPIData.map(({ year, wage, cpi }) => {
    const inflationFactor = BASE_CPI / cpi; // Adjust to 2023 dollars
    const adjustedWage = wage * inflationFactor;
    return { year, wage: parseFloat(adjustedWage.toFixed(2)) }; // Keep only 2 decimal places
  });
};

// Function to calculate max wage for chart scaling
export const getMaxAdjustedWage = (adjustedData) => {
  const maxWage = Math.max(...adjustedData.map((item) => item.wage));
  return Math.ceil(maxWage * 1.1 / 10) * 10; // Extend max by 10% and round up
};

// Exporting raw data for potential use
export const rawWageData = wageCPIData;
