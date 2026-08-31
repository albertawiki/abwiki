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
    body: `An indicator earns a place here because Albertans have said the underlying
issue matters to them — through polling, through elections, through what they raise
with their representatives. We do not add a number because it is available, or
because it is striking. We add it because someone deciding how Alberta is doing
would want it.`,
  },
  {
    id: 'reliable-source',
    title: 'The source has to be reliable and public',
    body: `Every figure comes from an original document anyone can open: a Statistics
Canada table, a government annual report, an OECD publication, a published survey
deck. We do not source from news coverage of a number — we source from the number.
If the original is behind a login or a paywall, it does not go on the site.`,
  },
  {
    id: 'cite-everything',
    title: 'Every number is traceable to its document',
    body: `Each dataset records the exact table, vector, report and page it came from,
and the date a maintainer last checked it. A reader who doubts a chart should be able
to reach the source in one click and the specific cell in about a minute.`,
  },
  {
    id: 'non-partisan',
    title: 'Non-partisan, and boring about it',
    body: `We describe what the measurement is and what it does and does not capture.
We do not attribute a movement to a government, a party, or a policy — not in the
copy, not in the chart annotations, not in the commit message. Readers draw their own
conclusions; that is the entire point of showing them the numbers.`,
  },
  {
    id: 'honest-charts',
    title: 'The chart cannot say more than the data does',
    body: `Axes are not truncated to manufacture a trend. Series measured on different
bases are drawn separately rather than spliced. Survey results carry their margin of
error. Revisions are visible rather than silently overwritten. A figure that needs a
caveat gets one on the card, not in a footnote nobody opens.`,
  },
  {
    id: 'reproducible',
    title: 'Anyone can reproduce it',
    body: `Where a source publishes an API or a machine-readable table, we fetch it
with a script in the repository so the numbers can be regenerated on demand. Where a
source publishes only a PDF, we record the figure by hand along with the document and
page, and the extraction is described well enough for someone else to repeat it.`,
  },
  {
    id: 'corrections',
    title: 'We correct in public',
    body: `Mistakes get fixed in a commit that says what was wrong, not quietly edited
away. Two of the figures on this site were wrong for months — poverty and food
insecurity were labelled by collection year instead of reference year, and real wages
were deflated with national rather than Alberta inflation. Both are recorded in the
repository history.`,
  },
];

export const contributionTypes = [
  {
    title: 'Correct a number',
    body: 'The fastest contribution to review, and the most valuable. Open an issue with the figure you think is wrong and a link to the source that says otherwise.',
    effort: 'Minutes',
  },
  {
    title: 'Refresh a series',
    body: 'Most datasets have a next expected release date recorded on the card. When a new release lands, append the point, update lastChecked, and cite the new document.',
    effort: 'An hour',
  },
  {
    title: 'Propose an indicator',
    body: 'Open an issue describing the indicator, the source, why it matters to Albertans, and what it does not capture. Agreeing the measurement before anyone writes code saves the most time.',
    effort: 'An hour',
  },
  {
    title: 'Build a figure',
    body: 'Add the dataset with its provenance, add a chart that follows the house rules, and wire it into a topic section. The existing figures are the template.',
    effort: 'An afternoon',
  },
  {
    title: 'Write a fetch script',
    body: 'Turn a hand-maintained series into one regenerated from its source. These are the contributions that keep the site current without anyone remembering to update it.',
    effort: 'An afternoon',
  },
];
