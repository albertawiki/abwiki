# alberta.wiki

Non-partisan public data on the issues that matter to Albertans, in one place,
traced to the original documents.

**[alberta.wiki](https://alberta.wiki)**

## Why

Public debate in Alberta runs on announcements. A programme is launched, a
funding number is quoted, a headline is written — and the thing people actually
care about, whether the emergency room wait got shorter or whether a family can
afford the rent, is measured somewhere else, months later, by someone else, in a
document almost nobody reads.

This site collects those measurements and keeps them current. The bet is simple:
if it is easy for Albertans to see the hard numbers on the issues they care
about, it gets harder for anyone of any political stripe to substitute an
announcement for a result.

## What is here

| Topic | Indicators |
|---|---|
| Affordability | Real median wage, cost of owning a home, consumer debt, poverty and food insecurity |
| Healthcare | Emergency department waits, primary care providers accepting patients |
| Economy | Employment rate (live, monthly) |
| Education | PISA scores, and the gap between Alberta's strongest and weakest students |

Every figure carries its sources, the caveats needed to read it honestly, and the
underlying numbers as a table. `docs/ROADMAP.md` lists what could come next.

## How it works

- **React + Recharts**, built by Create React App, deployed as a static site to
  S3 behind CloudFront.
- **Data lives in `src/data/`.** Each dataset exports a `meta` block declaring
  its unit, geography, update cadence, sources with retrieval dates, and its
  caveats. Series backed by a machine-readable source live in a `.json` file
  alongside.
- **`scripts/check-sources.mjs`** compares published figures against the
  Statistics Canada API. It runs weekly in CI and opens an issue when a source
  has revised a number we publish or released one we are missing.
- **Tests enforce provenance.** A dataset without a linked source, a check date,
  and caveats fails the build.

## Running it

```bash
npm install
npm start              # http://localhost:3000
npm run test:ci        # tests, including dataset provenance
npm run build          # production build
npm run check:sources  # compare published figures against Statistics Canada
```

Node 20 or later.

## Contributing

Corrections are the most valuable thing you can send. If a number here is wrong,
[open an issue](https://github.com/albertawiki/abwiki/issues/new) with the figure and
a link to the source that says otherwise — you do not need to fix it yourself.

See **[CONTRIBUTING.md](CONTRIBUTING.md)** for how data is organised and what a
pull request needs, and [alberta.wiki/contribute](https://alberta.wiki/contribute)
for the principles every dataset and figure is reviewed against.

## Documentation

| | |
|---|---|
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to add or correct data, and what review looks for |
| [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) | Every source, how it was extracted, and what is unresolved |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | AWS setup and the deploy pipeline |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Indicators and site work worth doing next |
| [docs/PROMOTION.md](docs/PROMOTION.md) | Getting the site in front of Albertans |

## Licence

Code is [MIT](LICENSE). Original figures and calculations are published under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The underlying data
remains the property of the organisations cited under each chart — please credit
them too.
