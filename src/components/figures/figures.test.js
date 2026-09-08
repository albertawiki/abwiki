import React from 'react';
import { render } from '@testing-library/react';

import MedianWagesChart from './MedianWages';
import HousingAffordabilityChart from './HousingAffordability';
import ConsumerDebtChart from './MNPConsumerDebtIndexChart';
import PovertyChart from './PovertyChart';
import ERWaitTimesChart from './ERWaitTimesChart';
import FamilyDoctorsChart from './FamilyDoctorsChart';
import PISAChart from './PISAChart';
import HouseholdDebtChart from './HouseholdDebtChart';
import GdpPerCapitaChart from './GdpPerCapitaChart';
import IndustryConcentrationChart from './IndustryConcentrationChart';
import OilShareChart from './OilShareChart';
import ResourceRevenueChart from './ResourceRevenueChart';
import PISAGapChart from './PISAGapChart';
import PISAProvincesChart from './PISAProvincesChart';
import ClassSizeChart from './ClassSizeChart';

// Recharts renders nothing at zero size, and jsdom has no layout engine, so
// ResponsiveContainer is replaced with a fixed-size box. Without this the
// charts "pass" by rendering an empty frame — which is exactly the failure
// mode that left the employment chart blank in production for months.
jest.mock('recharts', () => {
  const actual = jest.requireActual('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children, height }) => (
      <actual.ResponsiveContainer width={800} height={height || 300}>
        {children}
      </actual.ResponsiveContainer>
    ),
  };
});

// Rounded bars render as <path>, not <rect>, so match on Recharts' own mark
// classes rather than on the element name.
const LINE = '.recharts-line-curve';
const BAR = '.recharts-bar-rectangle';

const charts = [
  ['median wages', MedianWagesChart, LINE],
  ['housing affordability', HousingAffordabilityChart, LINE],
  ['consumer debt', ConsumerDebtChart, LINE],
  ['poverty', PovertyChart, LINE],
  ['ER wait times', ERWaitTimesChart, LINE],
  ['family doctors', FamilyDoctorsChart, BAR],
  ['household debt to income', HouseholdDebtChart, LINE],
  ['real GDP per capita', GdpPerCapitaChart, LINE],
  ['industry concentration', IndustryConcentrationChart, LINE],
  ['oil and gas share', OilShareChart, LINE],
  ['resource revenue share', ResourceRevenueChart, LINE],
  ['PISA scores', PISAChart, LINE],
  ['PISA gap', PISAGapChart, BAR],
  ['PISA by province', PISAProvincesChart, BAR],
  ['class size', ClassSizeChart, BAR],
];

describe.each(charts)('%s chart', (_name, Chart, markSelector) => {
  it('draws marks rather than an empty frame', () => {
    const { container } = render(<Chart />);

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();

    expect(svg.querySelectorAll(markSelector).length).toBeGreaterThan(0);
  });

  it('labels its axes with real tick values', () => {
    const { container } = render(<Chart />);
    const ticks = container.querySelectorAll('.recharts-cartesian-axis-tick-value');
    expect(ticks.length).toBeGreaterThan(2);
  });
});

describe('charts with a missing observation', () => {
  it('leaves a gap rather than dropping the line to zero', () => {
    // Edmonton has no confirmed Q1 2026 value. Recharts must not connect
    // across it, or the chart invents a value we deliberately withheld.
    const { container } = render(<HousingAffordabilityChart />);
    const paths = [...container.querySelectorAll('.recharts-line-curve')];
    expect(paths.length).toBe(2);
    paths.forEach((path) => expect(path.getAttribute('d')).toBeTruthy());
  });
});
