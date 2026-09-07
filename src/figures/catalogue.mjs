/**
 * What the site publishes, as data.
 *
 * This file holds no React and imports nothing, so the build scripts can read
 * it directly. `generate-sitemap.mjs` does exactly that: the sitemap is
 * derived from the same list the site renders, rather than maintained beside
 * it and left to drift.
 *
 * `src/figures/index.js` joins each entry here to its chart component and its
 * dataset. A figure listed here with no binding there fails a test.
 *
 * `id` is a public URL. Once someone has linked to a figure, changing its id
 * breaks their link silently, so ids are fixed once published.
 */

export const SITE_ORIGIN = 'https://alberta.wiki';

export const topics = [
  {
    slug: 'affordability',
    label: 'Affordability',
    lede:
      'What it costs to live in Alberta, and what Albertans have to meet those costs '
      + 'with. Wages are shown in constant dollars so that years can be compared, and '
      + 'housing costs as a share of income rather than as a price.',
  },
  {
    slug: 'healthcare',
    label: 'Healthcare',
    lede:
      'What Albertans encounter when they try to get care. Both figures here measure '
      + 'access rather than outcomes, and neither covers rural sites, which is where '
      + 'access is hardest to obtain and hardest to measure.',
  },
  {
    slug: 'economy',
    label: 'Economy',
    lede:
      'What Alberta produces, who is working, and what households owe. Labour figures '
      + 'come live from Statistics Canada each month; the rest are annual.',
    sections: [
      {
        id: 'diversification',
        heading: 'Economic diversification',
        note:
          'Whether Alberta is building a broader range of industries depends on what you '
          + 'count, and the three figures here do not agree. Revenue shows the exposure '
          + 'most directly: a quarter to a third of what the province collects in a good '
          + 'year comes from royalties. Jobs show the least exposure, because oil and gas '
          + 'produces a large share of output with a small share of the workforce, and '
          + 'work that exists because of oil is counted under construction, transport and '
          + 'professional services. Read the employment measure as what it is, a measure '
          + 'of how evenly jobs are spread, rather than as a summary of resource '
          + 'dependence.',
      },
    ],
  },
  {
    slug: 'education',
    label: 'Education',
    lede:
      'How Alberta students perform, and how evenly. Alberta is currently represented '
      + 'here only by PISA, which is run once every three years, so this page moves '
      + 'slowly and says nothing about class sizes or funding.',
  },
];

export const catalogue = [
  {
    id: 'median-weekly-wage-real',
    topic: 'affordability',
    description:
      "What a typical Alberta employee earns in a week, restated in today's dollars so "
      + 'the years are comparable.',
  },
  {
    id: 'housing-affordability-rbc',
    topic: 'affordability',
    description:
      "How much of a median household's income it takes to carry a typical home in "
      + "Alberta's two largest cities.",
  },
  {
    id: 'consumer-debt-insolvency-margin',
    topic: 'affordability',
    description:
      'How many Albertans say they are within $200 of not being able to cover their '
      + 'monthly bills and debt payments.',
  },
  {
    id: 'poverty-and-food-insecurity',
    topic: 'affordability',
    description:
      'Albertans living below the official poverty line, and Albertans in households '
      + 'that struggled to afford food.',
  },

  {
    id: 'er-wait-time-physician-assessment',
    topic: 'healthcare',
    description:
      'How long the slowest tenth of emergency patients wait before a doctor sees them.',
  },
  {
    id: 'primary-care-accepting-new-patients',
    topic: 'healthcare',
    description:
      'How many primary care providers across the province list themselves as open to '
      + 'new patients.',
  },

  {
    id: 'employment-rate',
    topic: 'economy',
    description:
      'The share of Albertans aged 15 and over who are working, and the share who are '
      + 'working or looking.',
  },
  {
    id: 'unemployment-rate',
    topic: 'economy',
    description:
      'Albertans who are out of work and looking for it, as a share of everyone working '
      + 'or looking.',
  },
  {
    id: 'real-gdp-per-capita',
    topic: 'economy',
    description:
      "What Alberta's economy produces for each person living here, with inflation "
      + 'removed.',
  },
  {
    id: 'household-debt-to-income',
    topic: 'economy',
    description:
      'How much Alberta households owe for every dollar of after-tax income they take '
      + 'home in a year.',
  },
  {
    id: 'resource-revenue-share',
    topic: 'economy',
    section: 'diversification',
    description:
      'The share of Alberta government revenue that came from oil and gas royalties, '
      + 'which has ranged from 6% to 33% since 2008.',
  },
  {
    id: 'effective-industries-jobs',
    topic: 'economy',
    section: 'diversification',
    description:
      "How evenly Alberta's jobs are spread across industries. A higher score means more "
      + 'evenly spread: 19 would mean every industry employing the same number of people.',
  },
  {
    id: 'oil-and-gas-share',
    topic: 'economy',
    section: 'diversification',
    description:
      'Oil and gas as a share of what Alberta produces, and as a share of who it '
      + 'employs.',
  },

  {
    id: 'pisa-alberta',
    topic: 'education',
    description:
      "How Alberta 15-year-olds score on the OECD's international assessment.",
  },
  {
    id: 'pisa-alberta-gap',
    topic: 'education',
    // Two figures share the PISA dataset, so this one names what it shows
    // rather than inheriting the dataset's title.
    title: "Gap between Alberta's top and bottom quarter of students",
    description:
      "The spread between Alberta's strongest and weakest quarter of students, which "
      + 'shows how evenly the system performs.',
  },
];

/**
 * The figures the home page rotates through.
 *
 * Exactly one per topic, in this order. That rule is the point rather than a
 * convenience: a featured slot filled by whichever chart looks worst this
 * month would turn a measurement site into a campaign, and "evocative" is one
 * short step from "alarming". One per topic means the rotation cannot drift
 * into a single narrative no matter who edits it, and a test enforces it.
 *
 * Within that constraint, prefer a figure that is current, well sourced, and
 * needs no companion chart to be read honestly.
 */
export const featured = [
  'er-wait-time-physician-assessment',
  'median-weekly-wage-real',
  'real-gdp-per-capita',
  'pisa-alberta',
];

/** Every URL the site publishes, in the order a reader would meet them. */
export const routes = () => [
  '/',
  ...topics.map(({ slug }) => `/${slug}`),
  ...catalogue.map(({ id }) => `/f/${id}`),
  '/contribute',
  '/faq',
];
