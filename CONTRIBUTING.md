# Contributing to alberta.wiki

Thanks for helping. This site exists so that Albertans can see the hard numbers
on the issues they care about, in one place, traced to original documents. That
goal drives everything below.

The same standards are published for readers at
[alberta.wiki/contribute](https://alberta.wiki/contribute). This file is the
version for people writing the code.

## The short version

- **Corrections are the most valuable contribution.** If a number here is wrong,
  open an issue. You do not need to fix it yourself.
- **Cite the original document, never coverage of it.** A Statistics Canada
  table, not an article about the table.
- **Say what the measurement misses.** Every dataset carries notes; a figure
  without caveats is usually a figure someone will misread.
- **No attribution of cause.** Not to a party, a government, or a policy. Not in
  the copy, the chart, or the commit message.

## Ways to contribute

| | Effort | Start with |
|---|---|---|
| Correct a number | Minutes | An issue |
| Refresh a series after a new release | An hour | A pull request |
| Propose a new indicator | An hour | An issue |
| Build a figure for an agreed indicator | An afternoon | A pull request |
| Write a fetch script for a manual series | An afternoon | An issue, then a PR |

Propose new indicators as an issue before writing code. Agreeing *what* to
measure is the part that takes discussion; the code is usually the easy half.

## Setting up

```bash
npm install
npm start              # dev server on http://localhost:3000
npm run test:ci        # tests, including dataset provenance checks
npm run build          # production build
npm run check:sources  # compare published figures against Statistics Canada
npm run review:data    # what numbers does this branch change?
npm run review:visual  # render every figure in a real browser and compare
```

The visual review needs its browser once: `npx playwright install chromium`.

Node 22 or later.

## How data is organised

```
src/data/
  _lib/meta.js                 dataset() helper — the provenance contract
  index.js                     registry; every dataset must be listed here
  affordability/
    wages.json                 the numbers
    WageData.js                meta + anything derived from them
  healthcare/ education/ economy/
```

Series backed by a machine-readable source live in a `.json` file so that
`scripts/check-sources.mjs` and the site read exactly the same values. Series
that come from PDFs live inline in the `.js` module, because a human transcribed
them and the transcription needs the surrounding comments.

### Adding or updating a dataset

1. **Find the original.** A government table, an annual report, a published
   survey deck. If it is only available behind a login or a paywall, we cannot
   use it.
2. **Write the `meta` block.** Every field is required:

   ```js
   export const meta = dataset({
     id: 'er-wait-time-physician-assessment',  // unique slug
     title: 'Emergency department wait to see a doctor',
     unit: 'Hours (90th percentile)',          // what one value means
     geography: 'Alberta\u2019s 16 largest emergency departments',
     cadence: 'annual (fiscal year)',
     lastChecked: '2026-08-31',                // when you opened the source
     nextExpected: '2026-09',                  // when the next release is due
     sources: [{ text: '…', url: 'https://…', retrieved: '2026-08-31' }],
     notes: ['What this measure does and does not capture.'],
   });
   ```

   `text` should name the specific table, vector, or performance measure — enough
   that a reader can find the cell, not just the website.

3. **Add the series.** Use `null` for a missing observation, never `0`. A zero
   draws a line to the floor and reads as a collapse.
4. **Register it** in `src/data/index.js`, which is what the tests walk.
5. **Publish it** by adding an entry to `src/figures/catalogue.mjs` and a
   binding in `src/figures/index.js`. A dataset registered but not published is
   checked by the tools and shown to nobody; a test fails on either half being
   missing.
6. **Run `npm run test:ci`.** The provenance tests will reject a dataset with a
   missing source, an unparseable date, or no notes.

### Adding a figure

Charts import shared tokens from `src/components/figures/chartTheme.js`. Use
them rather than hard-coded colours.

- **At most three series per chart.** The palette is validated for
  colour-vision deficiency at three slots. A fourth means splitting the figure.
- **Colour follows the entity, never its rank.** Calgary stays blue whether or
  not it is the higher line.
- **One y-axis.** Never two scales on one plot — the alignment between them is
  arbitrary and invents a correlation.
- **Do not truncate an axis to make a trend look bigger.** Rates and counts start
  at zero unless the real variation would vanish, and if you depart from zero,
  say why in a comment.
- **Never splice two measures into one line.** Different bases, different
  definitions, or a changed scope get separate series and a note.
- **Export a table.** Each chart module exports a `table` object that
  `StatCard` renders. Some of our series colours sit below 3:1 contrast on a
  white card, so the table is the accessibility fallback as well as the
  transparency mechanism.

### Where a figure appears

Every figure is listed once, in `src/figures/catalogue.mjs`, and renders in
three places from that one entry: the dashboard, its topic page, and its own
permalink at `/f/<id>`. The catalogue imports nothing, so `scripts/generate-sitemap.mjs`
reads the same list the site renders and the sitemap cannot drift from it.

An entry's `id` is a public URL. Once a figure is published, people link to it,
and renaming the id breaks those links silently: the page still loads and says
the figure does not exist. Treat an id as fixed. If a figure's title needs to
change, change `title` and leave `id` alone.

### Correcting a published figure

Make it its own commit, and say in the message what was wrong and what the
correct value is. Do not fold a correction into an unrelated change. The
repository history is the correction record.

## Pull request review

Automated first. Three things run and report onto your pull request:

- **the build and tests**, which fail if a dataset is missing a source, a check
  date, or its caveats;
- **the data diff**, which comments with every published number your branch
  changes and flags any that moved unusually — see
  [docs/REVIEW_AUTOMATION.md](docs/REVIEW_AUTOMATION.md);
- **the visual review**, which renders every figure in a real browser at desktop
  and mobile sizes and compares it against a baseline.

If you changed a chart or updated data on purpose, the visual review will fail
until the baselines are re-recorded. Run the **Record visual baselines**
workflow from the Actions tab against your branch; it records them on Linux,
which is what CI compares against, and commits them. Do not record them locally
— platform font rendering differs and they will not match.

Then a maintainer will:

1. Open your cited source and find the number. If we cannot locate it, we will
   ask where in the document it is rather than close the PR.
2. Check the framing against the principles — particularly whether the figure
   claims more than the measurement supports.
3. Check that nothing in the copy or annotations attributes a movement to a
   political actor.

4. Put your branch on the staging site and look at the figures there.

Merging publishes to alberta.wiki, so the look at staging happens on the branch,
while the change can still be turned down. See
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## What gets turned down

- Figures sourced from news coverage rather than the original document.
- Indicators chosen to support a case rather than describe a condition.
- Copy or annotations crediting or blaming a party, government or official.
- Charts whose axes, groupings or smoothing exaggerate a movement.
- Sources behind a paywall or login.
- Projections and modelled forecasts. This site reports what has been measured.

Being turned down is not a judgement about whether something is true or matters.
It usually means it belongs in analysis rather than on a dashboard of measured
indicators.

## Code of conduct

Be straightforward and assume good faith. Disagreements about data are welcome
and are the point; disagreements about people are not. Maintainers may close
threads that stop being about the numbers.

## Licence

Contributions are made under the repository's MIT licence. Original figures and
calculations are published under CC BY 4.0.
