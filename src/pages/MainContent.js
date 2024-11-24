import React, { useState } from 'react';
import StatCard from '../components/StatCard';
import ERWaitTimesChart from '../components/figures/ERWaitTimesChart';
import MedianWagesChart from '../components/figures/MedianWages';

const MainContent = ({ erWaitTimesData, wageData, roundedMaxWage }) => {
  return (
    <main className="main-content">
      <header className="header">
        <h2>Healthcare</h2>
      </header>
      <section className="stats-section">
        <StatCard
          title="90th Percentile ER Wait Times"
          description="This chart visualizes the time to initial physician assessment at the 90th percentile across Alberta's largest ER sites."
            sources={[
                { text: "Alberta Health Services. Health annual report, June 2024", url: "https://open.alberta.ca/publications/2367-9824" }
            ]}
        >
          <ERWaitTimesChart data={erWaitTimesData} />
        </StatCard>
      </section>

      <header className="header">
        <h2>Affordability</h2>
      </header>
      <section className="stats-section">
        <StatCard
          title="Median Weekly Wage in Alberta (2019–2023, Adjusted for Inflation)"
          description="This line chart visualizes the median weekly wage for all employees in Alberta across various years, adjusted for inflation to 2023 dollars."
            sources={[
                { text: "Statistics Canada. Table 14-10-0064-01 Employee wages by industry, annual.", url: "https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1410006401" },
                { text: "Statistics Canada. Table 18-10-0005-01 Consumer Price Index, annual average, not seasonally adjusted.", url: "https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1810000501" },
            ]}
        >
            <MedianWagesChart />
        </StatCard>
      </section>

      <header className="header">
        <h2>Economy</h2>
      </header>
      <section className="stats-section">
      </section>
    </main>
  );
};

export default MainContent;
