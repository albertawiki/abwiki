## What this changes

<!-- One or two sentences. If it corrects a published figure, say which one and
     what the correct value is. -->

## Type

- [ ] Correction to a published figure
- [ ] Refresh of an existing series after a new release
- [ ] New indicator
- [ ] Figure or site change (no data change)
- [ ] Tooling, build or docs

## Sources

<!-- Link the original document for every number you added or changed, and say
     where in it the figure appears — table and vector, or report and page.
     Coverage of a source is not a source. -->

| Figure | Source document | Where in it |
|---|---|---|
|  |  |  |

## Checklist

- [ ] Numbers come from the original document, not from reporting about it
- [ ] Every source is publicly reachable without a login or paywall
- [ ] `meta.lastChecked` reflects the date I actually opened the source
- [ ] `meta.notes` say what this measurement does **not** capture
- [ ] Missing observations are `null`, never `0`
- [ ] No axis is truncated in a way that exaggerates a movement
- [ ] Series on different bases or scopes are drawn separately, not spliced
- [ ] Nothing in the copy, annotations or commit message attributes a movement
      to a party, government or official
- [ ] `npm run test:ci` passes
- [ ] The dataset is registered in `src/data/index.js`
- [ ] The dataset is published in `src/figures/catalogue.mjs` with a binding
- [ ] I ran **Deploy to staging** against this branch and looked at the result

<!-- The last one is the point of having a staging site. Actions -> Deploy to
     staging -> Run workflow -> pick this branch, then open
     https://d11nekqs1klb33.cloudfront.net and read the figures you touched. -->

## Anything you are unsure about

<!-- Genuinely useful. If you are not sure a caveat is worded right, or whether
     a measure is comparable across years, say so and we will work it out in
     review. -->
