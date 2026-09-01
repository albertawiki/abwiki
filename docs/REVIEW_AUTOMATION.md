# How we check a change before it publishes

The question this document answers: **how do we know something is accurate and
looks correct before it goes on the site?**

It is a harder question here than for most software. A bug in a normal web app
shows up as something visibly broken. A wrong number on alberta.wiki looks
exactly like a right one — it renders cleanly, sits under a plausible citation,
and gets screenshotted into an argument. The failure is silent, and the cost is
the only thing the project actually has, which is being trusted by people who
disagree with each other.

So the review model is built around one idea: **make the two failure modes
visible to a human, cheaply, on every change.**

- *Is it accurate?* → show what numbers changed, and flag which ones look odd.
- *Does it look right?* → render it in a real browser and compare it to last time.

Neither of these decides anything. Both exist to put the right thing in front of
a reviewer, because judging whether a figure is honest is not automatable and
should not be.

## What comparable projects do

### Our World in Data — the closest analogue

[OWID](https://ourworldindata.org) is the same shape as this project several
orders of magnitude larger: a curated public-data publication with hundreds of
sources, heavy provenance obligations, and an open-source codebase
([owid/etl](https://github.com/owid/etl),
[owid/owid-grapher](https://github.com/owid/owid-grapher)). Their review model
is worth copying almost directly, and it has four parts:

1. **A staging server per pull request.** Every PR to their ETL repo gets a
   dedicated environment running the full admin site and database with that PR's
   changes, so a reviewer looks at the actual result rather than the diff.
2. **`etl anomalist`** — automated anomaly detection that compares new
   indicators against their old counterparts and surfaces unusual patterns for
   review. They describe it publicly as
   ["in-house tools that flag unusual patterns, helping us spot when something
   seems off"](https://ourworldindata.org/data-insights/spotting-and-fixing-data-issues-how-we-help-improve-data-quality-on-and-off-our-publication).
3. **Chart diff** — a review interface comparing charts on the staging server
   against the live site, where a human approves or rejects each changed chart
   individually before it can ship.
4. **`owidbot`** — posts the diff results onto the GitHub pull request and
   reminds the reviewer that charts still need approving before merge.

The instructive part is not the sophistication, it is the sequencing: *detect
automatically, decide manually, and put the decision in the pull request where
it cannot be skipped.* Their anomaly detector does not block a merge. It tells a
person where to look.

Also worth noting what they do **after** publishing: when their tools flag
something, they go back to the original data provider and work with them to
correct it. That is a posture worth adopting — being a careful reader of a
statistical agency's output is a contribution to the commons, not a criticism.

### Git scraping — Simon Willison

[Git scraping](https://simonwillison.net/2020/Oct/9/git-scraping/) is the
technique of committing a snapshot of a source to a repository on a schedule, so
the commit history becomes a record of how that source changed over time. As
Willison puts it, the changes are often more interesting than the data.

For us this solves a specific problem: **proving what a source said on the day we
read it.** Statistics Canada revises. RBC restates. Alberta Health republishes a
prior year with a different number. Today we record `retrieved: 2026-08-31` and
ask readers to take our word for it. Snapshotting the raw source response would
make that claim checkable, and would turn "did they revise this, or did we
transcribe it wrong?" from an argument into a diff.

This is the single highest-value thing not yet built here. See below.

### Data validation frameworks — Great Expectations, dbt tests

[Great Expectations](https://greatexpectations.io/) and
[dbt-expectations](https://github.com/calogica/dbt-expectations) are the
industry-standard way to assert properties of a dataset (ranges, uniqueness,
nullability, distribution) and fail a pipeline when they break.

**We should not adopt either.** They are built for warehouse-scale pipelines with
many tables and many consumers. This project has ten small time series in JSON
files. The equivalent assertions already live in `src/data/datasets.test.js` in
about eighty lines, run in under a second, and read as plain English. Adding a
validation framework would add a dependency, a config surface, and a second place
to look, in exchange for capability we do not need. The *idea* — declare what
must be true of the data and check it mechanically — is the part worth taking,
and we have taken it.

### Everyone else

- **Wikipedia** is the reference model for governance rather than tooling:
  published principles, edits attributable to a person, disputes settled on a
  talk page in public, and a history nobody can quietly rewrite. Our
  "corrections get their own commit and stay in the changelog" rule is a small
  version of the same instinct.
- **The COVID Tracking Project** (2020–21) is the best-documented case of a
  volunteer data project under real scrutiny. Their public write-ups on
  double-entry data collection and the discipline of publishing definitions
  alongside numbers are worth reading before this project grows past one
  maintainer.
- **CKAN / Code for America / open civic data portals** solve *distribution* —
  cataloguing and serving datasets. They are not a model for curation or review,
  because a portal's job is to publish what an agency gave it, not to decide
  whether it means what it appears to mean.

## What we built

Both gates run on every pull request and both report into the PR, because a
check that only shows up as a green tick trains reviewers to stop reading it.

### Accuracy

| Tool | Question it answers | When |
|---|---|---|
| `npm run test:ci` | Does every dataset declare a source, a check date, and its caveats? | Every push |
| `npm run check:sources` | Do our published figures still match the source API? Has a new release landed? | Every PR (advisory), weekly (opens an issue) |
| `npm run review:data` | What numbers does this branch change, and which look odd? | Every PR (posts a comment) |

`data-diff` reports changes as *values* rather than as JSON hunks — a wall of
reformatted JSON is where a wrong digit hides. It flags four things for a human
to open the source for:

- a value that moved more than twice that series' **typical step** (its median
  absolute change — deliberately not the largest, because the largest step is
  itself an outlier and using it as the yardstick means an equally large new
  jump never trips);
- a value we previously withheld that is now published;
- a published value being withdrawn;
- a non-numeric field changing — a `scope` or a source `vintage` — because those
  are how comparability breaks silently.

The threshold is set to be **sensitive rather than specific**. A false positive
costs a reviewer a glance; a false negative publishes a wrong number under our
name. At this project's size that is a handful of flags a year.

### Looking correct

`npm run review:visual` runs the built site in a real browser at desktop and
mobile viewports and compares one screenshot per figure against a committed
baseline.

This exists because of a specific failure. The unit tests render charts in
jsdom, which has no layout engine and does not deliver `ResizeObserver`. A chart
can therefore pass every unit test while rendering blank, overflowing its card,
or collapsing on a phone — and the live employment chart did render blank, in
production, for months. Alongside the baselines it asserts that every card draws
marks against a real axis, that nothing overflows, that the page never scrolls
sideways, that every source link is `https`, and that the employment chart
degrades *visibly* when its API fails rather than silently.

Two details that make it usable rather than annoying:

- **Baselines are recorded in CI, not locally.** Font rasterisation differs
  between Windows, macOS and Linux, so a baseline from a contributor's laptop
  would never match the runner. The `Record visual baselines` workflow records
  them on the platform that checks them. Local baselines are gitignored.
- **The live employment API is stubbed from a fixture.** Its real series changes
  monthly, so its baseline would otherwise fail every month for a reason that is
  not a regression — and a check that cries wolf gets ignored, which is worse
  than not having it.

### What is still a human's job

Deliberately. None of this can tell you whether:

- the number is actually in the cited document, on the page claimed;
- the caveats say what the measurement genuinely misses;
- the indicator belongs on the site at all;
- the framing is non-partisan.

Those are the four things [CONTRIBUTING.md](../CONTRIBUTING.md) asks a reviewer
to check, and they are the whole job. The automation exists to make sure a
reviewer spends their attention there instead of on scanning JSON.

## What to build next

In the order I would do it.

### 1. Snapshot sources when we read them

The git-scraping pattern. A scheduled job fetches each machine-readable source,
writes the raw response to `sources/<dataset>/<date>.json`, and commits it if it
changed. Two payoffs: a revision becomes a diff in the commit log instead of a
mystery, and `retrieved:` stops being a claim and becomes a receipt.

Cheap to build — a workflow and about thirty lines. It is first because it gets
more valuable the longer it has been running, so the cost of not starting it
compounds.

For PDF sources, snapshot the PDF itself and record its hash. When Alberta
Health republishes an annual report with restated numbers, we would know.

### 2. A deploy preview per pull request

OWID's staging server, scaled down. A PR builds and deploys to a preview URL,
and the review comment links to it. Reviewing a chart change by reading a diff of
`chartTheme.js` is not reviewing it.

CloudFront can serve previews from a prefixed S3 path; Netlify or Cloudflare
Pages would do it with less work if we are willing to split hosting from
production.

### 3. Chart-honesty lint

Several rules in CONTRIBUTING.md are currently enforced only by a reviewer
remembering them, and are mechanically checkable:

- more than three series in one figure (the palette is only validated to three);
- a y-axis whose domain excludes zero without an explanatory comment;
- two series in one chart whose `meta.notes` mention different bases — the
  splice check;
- a hardcoded colour that is not from `chartTheme`;
- a dataset whose `nextExpected` has passed by more than one cadence period.

These belong as unit tests, not as a new tool.

### 4. Accessibility in the visual run

`axe-core` via `@axe-core/playwright`, on the pages the visual review already
loads. Close to free given the harness now exists. Contrast is the one to watch:
three of our series colours sit below 3:1 on a white card, which is why every
figure ships a data table, and a check would stop that guarantee from quietly
lapsing.

### 5. Cross-source corroboration

Where two independent sources publish the same measure — Alberta Health and CIHI
both report ED waits; the Economic Dashboard and Statistics Canada both publish
the employment rate — fetch both and flag disagreement. This is the strongest
accuracy check available to us, because it catches the errors that a
single-source reconciliation cannot: a source that is internally consistent and
wrong.

It is last because it needs the second source wired up for each indicator, which
is real work per dataset rather than one piece of infrastructure.

## The thing to keep hold of

Every tool here reports to a person. None of them approves anything.

The temptation with review automation is to let a green tick stand in for
judgement, and the specific way this project would fail is by publishing a
number that passed every check and was still wrong — wrong scope, wrong year,
right value from the wrong table. The checks narrow where to look. Someone still
has to open the document.
