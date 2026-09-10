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
 * `dataset` names the dataset a figure draws on, and defaults to the figure's
 * own id because they almost always match. It is declared here so that a build
 * script can reach a figure's provenance — the thing the structured data on
 * each figure page is made of — without loading the registry, which imports
 * React. A test asserts the declaration agrees with the actual binding.
 *
 * `id` is a public URL. Once someone has linked to a figure, changing its id
 * breaks their link silently, so ids are fixed once published.
 */

export const SITE_ORIGIN = 'https://alberta.wiki';
export const SITE = 'alberta.wiki';

// The homepage carries the brand and a tagline; every other page carries its
// own name and then the brand. These live here rather than in the React hook
// that applies them, because scripts/prerender-routes.mjs has to write the
// same values into HTML at build time and cannot import React.
export const DEFAULT_TITLE = `${SITE} | Data that matters most to Albertans`;
export const DEFAULT_DESCRIPTION =
  'Wages, wait times, class sizes and more, on the issues Albertans say matter '
  + 'most. Every figure traces back to an original public document.';

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
      'How Alberta students perform, how evenly, and how large its classes were when '
      + 'the province still counted them. The test results are run once every three '
      + 'years, so they move slowly. Class size reporting ended after 2018/19.',
  },
];

export const catalogue = [
  {
    id: 'median-weekly-wage-real',
    topic: 'affordability',
    title: 'What does a typical Alberta worker earn in a week?',
    description:
      "What a typical Alberta employee earns in a week, restated in today's dollars so "
      + 'the years are comparable.',
  },
  {
    id: 'housing-affordability-rbc',
    topic: 'affordability',
    title: 'How affordable is a home in Calgary and Edmonton?',
    description:
      "How much of a median household's income it takes to carry a typical home in "
      + "Alberta's two largest cities.",
  },
  {
    id: 'consumer-debt-insolvency-margin',
    topic: 'affordability',
    title: 'What share of Albertans are $200 from not covering their bills?',
    description:
      'What share of Albertans say they are within $200 of not being able to cover '
      + 'their monthly bills and debt payments.',
  },
  {
    id: 'poverty-and-food-insecurity',
    topic: 'affordability',
    title: 'What share of Albertans live in poverty or struggle to afford food?',
    description:
      'Albertans living below the official poverty line, and Albertans in households '
      + 'that struggled to afford food.',
  },

  {
    id: 'er-wait-time-physician-assessment',
    topic: 'healthcare',
    title: 'How long is the wait to see an emergency doctor?',
    description:
      'How long the slowest tenth of emergency patients wait before a doctor sees them.',
  },
  {
    id: 'primary-care-accepting-new-patients',
    topic: 'healthcare',
    title: 'How many providers are taking new patients?',
    description:
      'How many primary care providers across the province list themselves as open to '
      + 'new patients.',
  },

  {
    id: 'employment-rate',
    topic: 'economy',
    title: 'What share of Albertans are working, or looking for work?',
    description:
      'The share of Albertans aged 15 and over who are working, and the share who are '
      + 'working or looking.',
  },
  {
    id: 'unemployment-rate',
    topic: 'economy',
    title: 'What share of Albertans who want work cannot find it?',
    description:
      'Albertans who are out of work and looking for it, as a share of everyone working '
      + 'or looking.',
  },
  {
    id: 'real-gdp-per-capita',
    topic: 'economy',
    title: 'How much does Alberta produce per person?',
    description:
      "What Alberta's economy produces for each person living here, with inflation "
      + 'removed.',
  },
  {
    id: 'household-debt-to-income',
    topic: 'economy',
    title: 'How much do Alberta households owe for every dollar they earn?',
    description:
      'How much Alberta households owe for every dollar of after-tax income they take '
      + 'home in a year.',
  },
  {
    id: 'resource-revenue-share',
    topic: 'economy',
    section: 'diversification',
    title: 'How much of provincial revenue comes from oil and gas?',
    description:
      'The share of Alberta government revenue that came from oil and gas royalties, '
      + 'which has ranged from 6% to 33% since 2008.',
  },
  {
    id: 'effective-industries-jobs',
    topic: 'economy',
    section: 'diversification',
    title: "How evenly are Alberta's jobs spread across industries?",
    description:
      "How evenly Alberta's jobs are spread across industries. A higher score means more "
      + 'evenly spread: 19 would mean every industry employing the same number of people.',
  },
  {
    id: 'oil-and-gas-share',
    topic: 'economy',
    section: 'diversification',
    title: "How much of Alberta's output and jobs is oil and gas?",
    description:
      'Oil and gas as a share of what Alberta produces, and as a share of who it '
      + 'employs.',
  },

  {
    id: 'pisa-alberta',
    topic: 'education',
    title: 'How do Alberta students score on international tests?',
    description:
      "How Alberta 15-year-olds score on the OECD's international assessment.",
  },
  {
    id: 'pisa-provinces',
    topic: 'education',
    title: 'How does Alberta compare with other provinces?',
    description:
      'Alberta beside the other provinces on the 2022 round of the international '
      + 'assessment, in mathematics, reading and science.',
  },
  {
    id: 'class-size-by-grade',
    topic: 'education',
    title: "How big are Alberta's classes, against the guideline?",
    description:
      'Average class size against the guideline Alberta set, for the fifteen years the '
      + 'province collected it.',
  },
  {
    id: 'pisa-alberta-gap',
    topic: 'education',
    // Two figures share the PISA dataset, so this one names what it shows
    // rather than inheriting the dataset's title, and names the dataset it
    // draws on so a build script can find the provenance without loading the
    // React registry that does the actual binding.
    dataset: 'pisa-alberta',
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

/** The pages that are neither a topic nor a figure. */
const PAGES = {
  '/contribute': 'Contribute',
  '/faq': 'Frequently asked questions',
};

/**
 * Title, description and canonical URL for one route.
 *
 * One function, two consumers: the React hook that sets these after the page
 * loads, and the build script that writes them into the HTML before it does.
 * A social scraper never runs the first, so if the two disagree the site lies
 * to everything that does not execute JavaScript. A test asserts they agree.
 */
/**
 * The picture a link preview shows, and how large it claims to be.
 *
 * A figure previews as the chart itself, written by
 * `scripts/render-og-images.mjs` at twice its 1200x630 layout. The dimensions
 * are the file's real ones, because a scraper reserves space from them before
 * the image itself arrives.
 *
 * Everything else previews as the logo, on a small card. The large card is
 * only worth claiming where there is something worth showing large: a 512px
 * logo stretched across 1200 looks worse than a small one shown small.
 */
// Cached, and returning the same object for the same figure, because the hook
// that applies these takes the value as an effect dependency: a fresh object
// every render would rewrite four meta tags on every render.
const DEFAULT_IMAGE = Object.freeze({ url: `${SITE_ORIGIN}/logo512.png`, card: 'summary' });
const figureImages = new Map();

export function socialImage(figure) {
  if (!figure) return DEFAULT_IMAGE;

  if (!figureImages.has(figure.id)) {
    figureImages.set(figure.id, Object.freeze({
      url: `${SITE_ORIGIN}/og/${figure.id}.png`,
      card: 'summary_large_image',
      alt: `Chart: ${figure.title}`,
      width: 2400,
      height: 1260,
    }));
  }

  return figureImages.get(figure.id);
}

export function metaForRoute(path) {
  const canonical = `${SITE_ORIGIN}${path}`;
  const figure = catalogue.find((f) => `/f/${f.id}` === path);
  const image = socialImage(figure);

  if (path === '/') {
    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      canonical: `${SITE_ORIGIN}/`,
      image,
    };
  }

  const topic = topics.find((t) => `/${t.slug}` === path);
  if (topic) {
    return {
      title: `${topic.label} in Alberta \u00b7 ${SITE}`,
      description: topic.lede,
      canonical,
      image,
    };
  }

  if (figure) {
    return {
      title: `${figure.title} \u00b7 ${SITE}`,
      description: figure.description,
      canonical,
      image,
    };
  }

  if (PAGES[path]) {
    return {
      title: `${PAGES[path]} \u00b7 ${SITE}`,
      description: DEFAULT_DESCRIPTION,
      canonical,
      image,
    };
  }

  return { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, canonical, image };
}
