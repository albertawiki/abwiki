import React, { useState } from 'react';
import StatCard from '../components/StatCard';
import ERWaitTimesChart from '../components/figures/ERWaitTimesChart';
import MedianWagesChart from '../components/figures/MedianWages';
import HousingAffordabilityChart from '../components/figures/HousingAffordability';
import FamilyDoctorsChart from '../components/figures/FamilyDoctorsChart';
import MNPConsumerDebtIndexChart from '../components/figures/MNPConsumerDebtIndexChart';
import PovertyChart from '../components/figures/PovertyChart';
import PISAChart from '../components/figures/PISAChart';
import PISAGapChart from '../components/figures/PISAGapChart';
import EmploymentChart from '../components/figures/EmploymentChart';

const MainContent = ({ erWaitTimesData, wageData, roundedMaxWage }) => {
  return (
    <main className="main-content">
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
        <StatCard
          title="Housing Expenses"
          description="Ownership costs as % of median household income"
            sources={[
                { text: "RBC Housing Affordability Reports", url: "https://thoughtleadership.rbc.com/economics-articles/canadian-housing/house-affordability/" },
            ]}
        >
            <HousingAffordabilityChart />
        </StatCard>
        <StatCard
          title="Consumer Debt"
          description="% of Albertans reporting being less than $200 from failing to meet financial obligations each month"
            sources={[
                { text: "MNP Consumer Debt Index", url: "https://mnpdebt.ca/en/resources/mnp-consumer-debt-index" },
                { text: "Ipsos Polling", url: "https://www.ipsos.com/en-ca/mnp-consumer-debt-index-improves-89-points-amidst-interest-rate-declines" },
            ]}
        >
            <MNPConsumerDebtIndexChart />
        </StatCard>
        <StatCard
          title="Poverty"
          description="% of Albertans living in poverty or food insecurity by data collection year"
            sources={[
                { text: "Canadian Income Survey", url: "https://www23.statcan.gc.ca/imdb/p2SV.pl?Function=getSurvey&amp;SDDS=5200" },
                { text: "Statistics Canada. Table 11-10-0093-01  Poverty and low-income statistics by selected demographic characteristics", url: "https://www150.statcan.gc.ca/t1/tbl1/en/cv.action?pid=1110009301" },
                { text: " Statistics Canada. Table 13-10-0835-01  Food insecurity by selected demographic characteristics", url: "https://www150.statcan.gc.ca/t1/tbl1/en/cv.action?pid=1310083501" },
            ]}
        >
            <PovertyChart />
        </StatCard>
      </section>
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
          <ERWaitTimesChart />
        </StatCard>
        <StatCard
          title="Family Doctors Taking New Patients"
          description="Alberta family doctors taking new patients"
            sources={[
                { text: "'By the numbers' annual report from albertafindadoctor.ca", url: "https://albertafindadoctor.ca/news/visits-to-website-top-1-million-as-albertans-struggle-to-find-family-doctors" }
            ]}
        >
          <FamilyDoctorsChart />
        </StatCard>
      </section>

      <header className="header">
        <h2>Economy</h2>
      </header>
      <section className="stats-section">
        <StatCard
          title="Employment Rate"
          description="Average Annual Employment Rate in Alberta (`'% of population 15 years of age and over who are employed, or performed unpaid family work, or had a job but were not at work due to legitimate absence')"
            sources={[
                { text: "Alberta Economic Dashboard", url: "https://economicdashboard.alberta.ca/dashboard/employment-rate/" }
            ]}
        >
          <EmploymentChart />
        </StatCard>
      </section>

      <header className="header">
        <h2>Education</h2>
      </header>
      <section className="stats-section">
        <StatCard
          title="Alberta International Standardized Test Scores"
          description="International Standardized Test Scores from OECD PISA Publications"
            sources={[
                { text: "OECD (2023), PISA 2022 Results (Volume I): The State of Learning and Equity in Education, PISA, OECD Publishing, Paris", url: "https://www.oecd.org/en/about/programmes/pisa.html" }
            ]}
        >
          <PISAChart />
        </StatCard>
        <StatCard
          title="Gap Between Top-25% and Bottom-25%"
          description="Gap between 25th percentile and 75th percentile of Alberta students based on International Standardized Test Scores from OECD PISA Publications"
            sources={[
                { text: "OECD (2023), PISA 2022 Results (Volume I): The State of Learning and Equity in Education, PISA, OECD Publishing, Paris", url: "https://www.oecd.org/en/about/programmes/pisa.html" }
            ]}
        >
          <PISAGapChart />
        </StatCard>
      </section>

    </main>
  );
};

export default MainContent;
