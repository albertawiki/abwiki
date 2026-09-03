import React from 'react';
import StatCard from '../components/StatCard';

import MedianWagesChart, { wageTable } from '../components/figures/MedianWages';
import HousingAffordabilityChart, { housingTable } from '../components/figures/HousingAffordability';
import ConsumerDebtChart, { consumerDebtTable } from '../components/figures/MNPConsumerDebtIndexChart';
import PovertyChart, { povertyTable } from '../components/figures/PovertyChart';
import ERWaitTimesChart, { erTable } from '../components/figures/ERWaitTimesChart';
import FamilyDoctorsChart, { familyDoctorTable } from '../components/figures/FamilyDoctorsChart';
import EmploymentChart, { employmentTable } from '../components/figures/EmploymentChart';
import UnemploymentChart, { unemploymentTable } from '../components/figures/UnemploymentChart';
import GdpPerCapitaChart, { gdpPerCapitaTable } from '../components/figures/GdpPerCapitaChart';
import IndustryConcentrationChart, { concentrationTable } from '../components/figures/IndustryConcentrationChart';
import OilShareChart, { oilShareTable } from '../components/figures/OilShareChart';
import HouseholdDebtChart, { householdDebtTable } from '../components/figures/HouseholdDebtChart';
import PISAChart, { pisaTable } from '../components/figures/PISAChart';
import PISAGapChart, { pisaGapTable } from '../components/figures/PISAGapChart';

import { meta as wageMeta } from '../data/affordability/WageData';
import { meta as housingMeta } from '../data/affordability/HousingAffordabilityData';
import { meta as debtMeta } from '../data/affordability/ConsumerDebt';
import { meta as povertyMeta } from '../data/affordability/Poverty';
import { meta as erMeta } from '../data/healthcare/ERData';
import { meta as doctorMeta } from '../data/healthcare/FamilyDoctorData';
import { meta as employmentMeta } from '../data/economy/Employment';
import { meta as householdDebtMeta } from '../data/economy/HouseholdDebt';
import { meta as unemploymentMeta } from '../data/economy/Unemployment';
import { meta as gdpPerCapitaMeta } from '../data/economy/GdpPerCapita';
import { concentrationMeta, oilShareMeta } from '../data/diversification/Diversification';
import { meta as pisaMeta } from '../data/education/PISA';

const MainContent = () => (
  <main className="main-content">
    <section className="topic" id="affordability">
      <h2 className="topic-heading">Affordability</h2>
      <div className="stats-section">
        <StatCard
          meta={wageMeta}
          table={wageTable}
          description="What a typical Alberta employee earns in a week, restated in today's dollars so the years are comparable."
        >
          <MedianWagesChart />
        </StatCard>

        <StatCard
          meta={housingMeta}
          table={housingTable}
          description="How much of a median household's income it takes to carry a typical home in Alberta's two largest cities."
        >
          <HousingAffordabilityChart />
        </StatCard>

        <StatCard
          meta={debtMeta}
          table={consumerDebtTable}
          description="How many Albertans say they are within $200 of not being able to cover their monthly bills and debt payments."
        >
          <ConsumerDebtChart />
        </StatCard>

        <StatCard
          meta={povertyMeta}
          table={povertyTable}
          description="Albertans living below the official poverty line, and Albertans in households that struggled to afford food."
        >
          <PovertyChart />
        </StatCard>
      </div>
    </section>

    <section className="topic" id="healthcare">
      <h2 className="topic-heading">Healthcare</h2>
      <div className="stats-section">
        <StatCard
          meta={erMeta}
          table={erTable}
          description="How long the slowest tenth of emergency patients wait before a doctor sees them."
        >
          <ERWaitTimesChart />
        </StatCard>

        <StatCard
          meta={doctorMeta}
          table={familyDoctorTable}
          description="How many primary care providers across the province list themselves as open to new patients."
        >
          <FamilyDoctorsChart />
        </StatCard>
      </div>
    </section>

    <section className="topic" id="economy">
      <h2 className="topic-heading">Economy</h2>
      <div className="stats-section">
        <StatCard
          meta={employmentMeta}
          table={employmentTable}
          description="The share of Albertans aged 15 and over who are working, and the share who are working or looking."
        >
          <EmploymentChart />
        </StatCard>

        <StatCard
          meta={unemploymentMeta}
          table={unemploymentTable}
          description="Albertans who are out of work and looking for it, as a share of everyone working or looking."
        >
          <UnemploymentChart />
        </StatCard>

        <StatCard
          meta={gdpPerCapitaMeta}
          table={gdpPerCapitaTable}
          description="What Alberta's economy produces for each person living here, with inflation removed."
        >
          <GdpPerCapitaChart />
        </StatCard>

        <StatCard
          meta={householdDebtMeta}
          table={householdDebtTable}
          description="How much Alberta households owe for every dollar of after-tax income they take home in a year."
        >
          <HouseholdDebtChart />
        </StatCard>
      </div>
    </section>

    <section className="topic" id="diversification">
      <h2 className="topic-heading">Economic diversification</h2>
      <p className="topic-note">
        Whether Alberta is building a broader range of industries depends on what you
        count. These two figures use the same idea — how concentrated the province is —
        applied first to where people work and then to what the economy earns. They give
        different answers, and the difference is worth understanding before quoting
        either.
      </p>
      <div className="stats-section">
        <StatCard
          meta={concentrationMeta}
          table={concentrationTable}
          description="How evenly Alberta's jobs are spread across industries, expressed as the number of equally sized industries that would be equivalent."
        >
          <IndustryConcentrationChart />
        </StatCard>

        <StatCard
          meta={oilShareMeta}
          table={oilShareTable}
          description="Oil and gas as a share of what Alberta produces, and as a share of who it employs."
        >
          <OilShareChart />
        </StatCard>
      </div>
    </section>

    <section className="topic" id="education">
      <h2 className="topic-heading">Education</h2>
      <div className="stats-section">
        <StatCard
          meta={pisaMeta}
          table={pisaTable}
          description="How Alberta 15-year-olds score on the OECD's international assessment."
        >
          <PISAChart />
        </StatCard>

        <StatCard
          meta={pisaMeta}
          title="Gap between Alberta's top and bottom quarter of students"
          table={pisaGapTable}
          description="The spread between Alberta's strongest and weakest quarter of students, which shows how evenly the system performs."
        >
          <PISAGapChart />
        </StatCard>
      </div>
    </section>
  </main>
);

export default MainContent;
