// The standards every dataset and figure on alberta.wiki is held to.
//
// This is the single source of truth: the Contribute page renders it, and
// CONTRIBUTING.md and the pull request template point back here. If a
// principle changes, change it here and the site and the review checklist
// stay in step.

export const REPO_URL = 'https://github.com/albertawiki/abwiki';

export const principles = [
  {
    id: 'in-albertans-interest',
    title: 'It has to matter to Albertans',
    body: `We add an indicator when Albertans have said the underlying issue matters
to them, whether through polling, elections, or what they raise with their
representatives. That a number happens to be available isn't a reason on its own,
and neither is how striking it looks.`,
  },
  {
    id: 'reliable-source',
    title: 'The source has to be reliable and public',
    body: `Every figure comes from an original document anyone can open: a Statistics
Canada table, a government annual report, an OECD publication, a published survey
deck. News coverage of a number doesn't count, because we need the number itself. If
the original sits behind a login or a paywall, we leave it off the site.`,
  },
  {
    id: 'cite-everything',
    title: 'Every number is traceable to its document',
    body: `Each dataset records the exact table, vector, report and page it came from,
along with the date a maintainer last checked it. If you doubt a chart, you should be
able to reach its source in one click and find the specific cell in about a minute.`,
  },
  {
    id: 'non-partisan',
    title: 'Non-partisan, and boring about it',
    body: `We describe what a measurement captures and what it leaves out. We don't
attribute a movement to a government, a party or a policy, in the copy or the chart
annotations or the commit message. Most of these numbers move for reasons that span
several governments anyway, and a few are barely within provincial control at all.`,
  },
  {
    id: 'honest-charts',
    title: 'The chart cannot say more than the data does',
    body: `We don't truncate an axis to manufacture a trend, and we draw series
measured on different bases as separate lines rather than splicing them. Survey
results carry their margin of error, and revisions stay visible instead of being
overwritten. Where a figure needs a caveat to read it properly, that caveat goes on
the card itself.`,
  },
  {
    id: 'reproducible',
    title: 'Anyone can reproduce it',
    body: `Where a source publishes an API or a machine-readable table, we fetch it
with a script in the repository, so the numbers can be regenerated on demand. Where a
source publishes only a PDF, we record the figure by hand along with the document and
page, and describe the extraction well enough for someone else to repeat it.`,
  },
  {
    id: 'corrections',
    title: 'We correct in public',
    body: `Mistakes get their own commit, saying what was wrong, rather than being
quietly edited away. Two figures here were wrong for months: poverty and food
insecurity were labelled by collection year instead of reference year, and real wages
were deflated using national inflation rather than Alberta's. Both fixes are in the
repository history.`,
  },
];

export const contributionTypes = [
  {
    title: 'Correct a number',
    body: 'The quickest thing to review and usually the most useful. Open an issue with the figure you think is wrong and a link to the source that says otherwise.',
    effort: 'Minutes',
  },
  {
    title: 'Refresh a series',
    body: 'Most datasets show a next expected release date on the card. Once that release lands, append the new point, update lastChecked, and cite the document you took it from.',
    effort: 'An hour',
  },
  {
    title: 'Propose an indicator',
    body: 'Open an issue describing the indicator, its source, why it matters to Albertans, and what it misses. Settling the measurement before anyone writes code saves the most time.',
    effort: 'An hour',
  },
  {
    title: 'Build a figure',
    body: 'Add the dataset with its provenance, add a chart that follows the house rules, and wire it into a topic section. The existing figures work as a template.',
    effort: 'An afternoon',
  },
  {
    title: 'Write a fetch script',
    body: 'Turn a hand-maintained series into one regenerated from its source. These keep the site current without anyone having to remember to update it.',
    effort: 'An afternoon',
  },
];
