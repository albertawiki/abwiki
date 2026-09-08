# Changelog

What changed on alberta.wiki, and why.

Corrections to published figures are listed first in each release and never
edited away. If a number was wrong on this site, that fact stays in the record —
it is the same standard we ask of the sources we cite.

Dates are the date the work was done. Data is labelled by the release it came
from, not by when we picked it up.

## Unreleased

The first substantial pass since the site went up in December 2024. Everything
below is on `feature/data-refresh-2026` (PR #1).

### Corrections

Three published figures were wrong.

- **Real median wage was deflated with national CPI instead of Alberta CPI.**
  The series used 136 / 137 / 141.6 / 151.2 / 157.1 for 2019–2023; Alberta's
  all-items CPI for those years is 143.1 / 144.7 / 149.3 / 158.9 / 164.1.
  Alberta inflation ran higher than the national figure over this period, so the
  chart understated how much real wages had fallen. Now uses Statistics Canada
  vector `v41694625` (Alberta all-items CPI).

- **Poverty and food insecurity were labelled by the wrong year.** Points were
  labelled by the year the Canadian Income Survey was *collected* while carrying
  values for the year it *describes*, shifting the entire series forward by one.
  The poverty values did not match the source table under either labelling. Both
  series are now labelled by reference year and taken directly from tables
  11-10-0093-01 and 13-10-0835-01.

- **The employment chart had been rendering an empty frame in production.** It
  called the Alberta Economic Dashboard's retired code-based endpoint, which now
  returns HTTP 500. The component logged the failure to the console and rendered
  nothing, so the chart looked like a styling bug rather than a broken fetch. It
  now uses the dashboard's current table endpoint and, when that is unreachable,
  falls back to verified annual averages with a visible notice on the figure.

### Data brought current

- Emergency department waits extended to 2024-25 (7.0 hours, up from 6.7), using
  Alberta Health's restated 2021-22 and 2022-23 values.
- Primary care providers accepting new patients extended to March 2025 (462).
  The count now includes nurse practitioners, so each row carries a `scope`
  field and the 2025 bar is drawn in a different colour — 163 → 462 is partly a
  change in what is being counted.
- Housing affordability extended to Q1 2026. Each row records which RBC report
  it was read from, because RBC revises the series between editions.
- Consumer debt rebuilt as a full quarterly series (2023-Q1 to 2025-Q4) from the
  MNP wave decks. It previously sampled roughly one wave a year, which made a
  poll with a ±7 point margin of error look like a smooth annual trend.
- Real wages extended to 2014–2025; poverty and food insecurity to 2024.
- PISA unchanged. The 2025 round publishes in December 2026.

Two gaps are documented rather than filled. RBC's Q1 2026 report gives Edmonton
as 36.8% while also saying it is "down 0.5 points from Q4", which was published
as 33.1%; both cannot be true, so that point is withheld. MNP published national
results for waves 36 and 37 but the provincial decks were not retrievable, so
those quarters are shown as gaps. See [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md).

### Provenance became structural

Every dataset now declares what it measures, over what geography, how often it
updates, every source with the date a maintainer last opened it, and the caveats
needed to read it honestly. Each figure renders that as **Sources**, **How to
read this** and **Data table** drawers.

This is the change the rest of the project hangs off. A number with no visible
source, no stated caveat and no underlying table is the kind of number this site
exists to replace, so the site should not be able to display one. Tests now fail
the build if a dataset is missing any of it.

### Charts stopped overstating

- One colour palette, validated for colour-vision deficiency against a white
  card. Colour follows the entity, never its rank — Calgary stays blue whether
  or not it is the higher line.
- Series measured on different bases are drawn separately rather than spliced.
  The two Market Basket Measure bases are two lines, because joining them would
  put a step in the chart that never happened in the world.
- Missing observations are `null` and render as gaps. A missing quarter dropped
  from a categorical axis silently compresses time; a missing value written as
  zero draws a line to the floor and reads as a collapse.
- No axis is truncated to make a movement look larger than it is.

### Contribution model

- [CONTRIBUTING.md](CONTRIBUTING.md) — how data is organised, the provenance
  contract, the chart rules, and what review actually checks.
- Pull request template and issue templates for corrections and new indicators.
- A `/contribute` page rendering the same principles the reviewer works through,
  from a single shared module, so the public standards and the internal
  checklist cannot drift apart.

### Review automation

Answering "how do we know it is accurate and looks right before we publish?"
See [docs/REVIEW_AUTOMATION.md](docs/REVIEW_AUTOMATION.md) for the reasoning.

- **`scripts/check-sources.mjs`** reconciles published figures against the
  Statistics Canada API. Runs weekly and opens an issue when a source has
  revised a number we publish or released one we are missing.
- **`scripts/data-diff.mjs`** reports what a branch changes as values rather
  than JSON hunks, and flags what deserves a second look: a value that moved
  more than twice that series' typical step, a withheld value now published, a
  withdrawn one, a scope or vintage change.
- **Visual review** (`e2e/`, Playwright) runs the built site in a real browser
  at desktop and mobile viewports, one baseline per figure. This is the check
  jsdom structurally cannot do — it has no layout engine and does not deliver
  `ResizeObserver`, so a chart can pass every unit test and still render blank
  or collapse on a phone.
- Both post their results onto the pull request. A check that only appears as a
  green tick teaches reviewers to stop reading it.

Figures now honour `prefers-reduced-motion`, which readers who ask for it should
get regardless, and which has the side effect of making screenshots capture the
chart rather than a frame of its mount animation.

### Deployment

- Push to `main` builds, tests, and deploys to S3 behind CloudFront using OIDC
  rather than long-lived keys.
- Fingerprinted assets upload before `index.html`, so a visitor never receives
  an entry point referencing assets that are not up yet.
- Only unhashed paths are invalidated; hashed ones never need it.
- The deploy fails with a message pointing at the setup guide when AWS is not
  configured, rather than deep inside the credentials action.

Requires one-time AWS setup — see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

The review point moved from after the merge to before it.

- **Staging takes any branch, on demand.** Run *Deploy to staging* from the
  Actions tab and pick a branch. The `staging` environment previously had a
  deployment branch policy allowing only `main`, so the only thing that could be
  previewed was something already merged. During development that was worked
  around with manual `aws s3 sync` from a laptop, which skipped the tests, the
  clean checkout and the post-deploy verification that the pipeline runs.
- **Push to `main` deploys production.** Merging is the decision to publish,
  which is why the preview happens on the branch. The tick box confirming that
  staging had been checked is gone with the step it guarded.
- *Deploy to production* still runs by hand against `main`, for re-deploying a
  commit already merged. It refuses to run anywhere else.
- One staging bucket, last run wins, so the run summary now records the branch
  as well as the commit.

### Chart encoding, after review by an engineer

**Two time series became lines.** Oil and gas share of provincial revenue was
seventeen bars across seventeen consecutive fiscal years; emergency department
waits were five. Bars encode magnitude as length from a baseline and read as
separate categories, and a reader looking at consecutive years wants the trend.
Every other annual series here was already a line, so these were an
inconsistency rather than a decision.

**The primary care figure stays bars, deliberately.** Its 2025 point counts
nurse practitioners as well as physicians. A bar can be coloured to say that,
and a line through it would splice two definitions into one continuous path,
which this project forbids elsewhere.

**The PISA chart was exaggerating a non-result.** It ran 450 to 570 now; it ran
480 to 560 before, and on that axis a seven-point move looked like a cliff.
Checking what the publisher says about those moves settled it: CMEC reports
Alberta mathematics as 511, 511 and 504 across 2015, 2018 and 2022, with
standard errors of 5.9, 6.1 and 6.7, and marks none of them as significantly
different from the 2012 baseline. Reading fell 532 to 525 and is likewise not
marked significant, while the Canadian fall of 520 to 507 over the same period
is. The notes now say so instead of leaving the reader a margin of error and a
dramatic slope.

A chart that makes a non-result look like a collapse is doing the same job as a
truncated axis, which the contributing guide already forbade. Both rules are
now written down: line for time and bars for categories, and choose the y range
against the size of the thing measured rather than the size of the data.

### Accessibility, measured against WCAG 2.2 AA

There is no Alberta standard to follow. Alberta has no accessibility
legislation covering web content, and the province’s own accessibility page
names no WCAG version or conformance level. The site now commits to WCAG 2.2
AA, the current W3C Recommendation, which is stricter than the 2.1 AA other
Canadian jurisdictions legislate.

The first audit found four faults and all were real:

- **Muted text measured 3.4:1** against the page background, needing 4.5.
  `--text-muted` went from `#898781` to `#73716c`, now 4.62:1.
- **Links measured 4.19:1**, just under. `--link` went from `#2a78d6` to
  `#2771c9`, now 4.64:1.
- **Links inside prose** were distinguishable from body text by colour alone,
  failing 1.4.1 Use of Colour. They are underlined.
- **The carousel dots were 10px targets**, under the 24px minimum WCAG 2.2
  introduced. The visible dot is still 10px inside a 24px target.

**The chart series colours were left alone.** `--series-1` still holds the
`#2a78d6` that `--link` used to. A chart mark is a graphic and answers to 3:1,
not 4.5:1, and that palette is validated for colour-vision deficiency.
Darkening it to satisfy a text rule it is not subject to would have traded a
real property for a spurious one.

Every route is now scanned with axe-core on each change, in both themes and at
two viewport sizes, plus four checks a scanner cannot make: every control
reachable and named, focus visible while tabbing, headings that descend without
skipping, and a data table behind every chart. Browser checks went from 67 to
95.

The FAQ states the standard and asks people to report what does not work.
[docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md) records what is not covered: no
screen reader has been run against the site, no disabled users have tested it,
and charts are not keyboard-navigable.

### Two withheld quarters of the consumer debt figure are now published

Waves 36 and 37 had been left as gaps because the provincial breakdown was not
retrievable and the only Alberta figure available was secondary coverage. MNP
has since published its own Alberta releases for both, so they come from the
primary source: 42% for the quarter fielded in March 2026, and 52% for the one
fielded in June 2026, the highest in the series.

The secondary figure of 42% for wave 36 matched what MNP eventually published,
which is reassuring but did not make it citable at the time.

**A caveat recorded rather than smoothed over.** MNP’s stated
quarter-over-quarter changes do not reconcile with the levels it published
itself. The April 2026 release calls 42% a one-point rise from a level it had
published as 38%, and the July 2026 release calls 52% a thirteen-point rise from
42%. Both imply a previous level near 39 to 41%, and they cannot both be right
about wave 36. Each release states its own wave clearly, and the level is what
this figure publishes, so the levels are recorded and the stated changes are
not used.

Checked at the same time and found to have nothing newer: RBC housing
affordability, whose latest report still covers 2026-Q1; the Alberta Health
annual report, whose latest edition is still 2024-25; and the count of primary
care providers accepting new patients, whose latest release is still May 2025.

### Education gains two figures, and one honest absence

- **Average class size, against the guideline Alberta set.** By grade cohort,
  from Alberta Education's own 2019 Class Size Initiative Review. Kindergarten
  to Grade 3 was 19.7 in the first year of the initiative and 20.4 in the last
  year measured, against a guideline of 17. The other three cohorts ended at or
  below theirs.
- **The series ends in 2018/19**, because school authorities are no longer
  required to submit class size data. The figure says so, and will not update.
- **PISA by province.** Alberta beside Canada and Ontario in mathematics,
  reading and science, with every province and its standard error in the data
  table. Alberta's own scores match what the site already published from the
  OECD volumes, which is how the transcription was checked.
- **Classroom complexity is not published.** No Alberta or Statistics Canada
  series measures it, and the education page now says so rather than leaving
  the impression that nobody has asked.

**A figure we did not publish.** The class-level submissions behind the class
size averages are on the open data portal: fifteen years, about 200,000 rows a
year. Aggregating them directly does not reproduce Alberta Education's published
averages, because its method excludes Colony and Hutterite schools, counts a
team-taught class as several classes, and places a combined class such as Grade
3/4 in the higher cohort. Our recomputation differed by up to 1.5 students in
Grades 10-12. Where the department has published a number, that is the number.

Two tests were too narrow and were widened rather than worked around: one
assumed a dataset with no next release date must be a monthly series, when it
can instead be one nobody collects any more; the other assumed a geography's
comparators are always columns, when they can be rows.

### The 2020 wage peak now says why it is a peak

The median weekly wage chart direct-labels 2020 as its high point and said
nothing about why. The nominal median rose 7.7% in one year, from $1,040 to
$1,120 a week, in the middle of a recession.

That is a change in who was counted rather than in what anyone was paid. Job
losses in 2020 fell most heavily on low-paid work, and the measure covers
employees, so the lowest-paid leaving employment raised the median of those
who remained. It fell back the next year as those jobs returned.

A reader who took 2020 as a wage peak had the story backwards, and the chart
was inviting exactly that. The notes now carry it, in third position where
house style puts a caveat about how a figure is misread.

### Every topic introduces itself, and the prose stops running short

- **Each topic section on the dashboard now opens with an introduction.**
  Economic diversification had one and the four topics did not, which read as
  an oversight rather than as emphasis. The text is the same lede the topic's
  own page opens with, taken from `catalogue.mjs` rather than written a second
  time, because two descriptions of the same figures drift apart and the one
  nobody is looking at drifts first. A test fails a topic with no lede.
- **Section introductions and the source lists now span the content column.**
  They had been capped at 52rem while the headings, their rules and the card
  grid ran the full width, so they stopped a third of the way short and read as
  unfinished.

### A featured figure on the home page, and a visible permalink on every card

The dashboard opened with fifteen charts and no suggestion of where to start.

- **A rotating featured figure** at the top of the home page, advancing every
  eight seconds, with previous and next arrows, a dot per figure and a pause
  button.
- **It stops whenever someone might be reading.** On hover, on keyboard focus
  anywhere inside it, when the reader presses pause, and entirely when the
  operating system asks for reduced motion, in which case the timer never
  starts and no pause button appears. It stays silent to screen readers while
  it is moving and announces politely once it has stopped.
- **The featured set is one figure per topic**, declared in
  `src/figures/catalogue.mjs` and enforced by a test. A slot filled by whichever
  chart looks worst this month would turn a measurement site into a campaign,
  and the rule means the rotation cannot drift into a single narrative whoever
  edits it.
- **Every card now carries "Link to this figure"** beside its Sources, How to
  read this and Data table buttons. Card titles have linked to their permalinks
  since those were added, but nothing said so.
- **A figure's page has a way back to its topic at the bottom** as well as in
  the breadcrumb at the top, and the "Other figures in Healthcare" heading now
  links to the topic too.

### Corrections: two diversification figures described the wrong coverage

- **The oil and gas figure claimed five geographies and carries one.** Its card
  subtitle read "Alberta, Canada, Ontario, Quebec and British Columbia" while
  the series holds Alberta alone. Both diversification datasets were spreading
  one shared `geography` string, and only the other one covered five places.
  Now reads "Alberta".
- **The employment concentration dataset was registered against the wrong
  series.** `src/data/index.js` paired its `meta` with `diversificationData`,
  the Alberta-only file, instead of `concentrationData`, the five-province one.
  The chart and data table always read the right file, so nothing published was
  wrong, but every integrity and freshness check on that dataset had been
  walking a series it does not describe.
- Its subtitle now separates what is drawn from what is tabulated: "Alberta,
  Canada and Ontario charted; Quebec and British Columbia in the data table".
  Three lines are drawn because the palette is validated for colour-vision
  deficiency at three series.

A test now fails any dataset whose `geography` names a province with no column
of data for it, which is what found the second of these.

### Every page sits in the same column

The topic pages, the figure permalinks and the 404 rendered flush against the
viewport edge. The gutters and the 1200px column had been set on the
dashboard's own class rather than on the element that wraps the router, so
every page added after it started with none.

- Moved the frame to `.container`, which every route passes through. The
  dashboard is pixel-identical; only the pages that were missing it moved.
- The 404 body now uses a narrow centred measure. A centred heading over a
  full-width block holding four short links read as an unfinished page.
- Breadcrumbs lost the top margin that had been compensating for the missing
  padding.
- A browser check on every route asserts the heading, breadcrumb and body sit
  at least 16px off the edge. It only has teeth on the mobile project: at
  desktop width the column's max-width centres the content and supplies a
  gutter whether or not padding exists, which is noted in the test.

### Making the diversification section answer the question it asks

A reader could not tell from the effective-industries figure whether a higher
score meant more diversified or less, and once told, could not see why Alberta
scored above Ontario and Canada.

- **A new figure: oil and gas royalties as a share of provincial revenue.**
  Statistics Canada table 10-10-0017-01, machine-readable, and covered by
  `check:sources`. It has ranged from 6.2% in 2020-21 to 32.8% in 2022-23. This
  is the exposure the other two figures miss.
- **The revenue figure now leads the section**, because it answers what people
  mean by diversification more directly than an employment index does.
- **The employment figure says which direction is which**, in three places: a
  labelled y-axis reading "More evenly spread", a description that anchors the
  scale, and a first note that leads with the plain meaning instead of the
  Herfindahl formula. House style has required that ordering since the
  `chart-notes` skill was written; this figure predated it.
- **Retitled to say jobs.** "How evenly jobs are spread across industries,
  compared with other provinces", so it is not read as a summary of the economy.
- **The section note now says why the figures disagree.** Oil and gas produces a
  large share of output with a small share of the workforce, and work that
  exists because of oil is counted under construction, transport and
  professional services. Alberta scores as the most evenly spread of the large
  provinces because its distinctive industry employs few people, not because it
  is the least resource-dependent.

Also disclosed in the notes and `docs/DATA_SOURCES.md`: royalties are the
province's share of resources it owns rather than a tax; Statistics Canada
counts them more narrowly than Alberta's own budget does; and the table's
reference year is the fiscal year ending nearest 31 December, so its 2024 is
Alberta's 2024-25.

### A page per topic, and a page per figure

The site was one route. There was one URL to find, one thing to share, and
nothing for a search engine to tell apart.

- **`/affordability`, `/healthcare`, `/economy` and `/education`**, each with
  its own heading, an introduction saying what the topic's figures do and do not
  measure, and a list of every source behind them. Economic diversification is a
  section within Economy rather than a fifth page.
- **A permalink per figure at `/f/<id>`**, carrying the chart, its sources and
  its caveats. People share charts rather than dashboards, and a chart that
  travels without its source becomes the kind of context-free number this site
  exists to replace. The caveats are open on these pages rather than behind a
  button.
- **The dashboard still carries every figure.** Each topic heading links to that
  topic's page and each card title to its own.
- **A figure registry.** `src/figures/catalogue.mjs` lists what is published and
  imports nothing, so `scripts/generate-sitemap.mjs` reads the same list the
  site renders. Before this the dashboard held the only copy of each figure's
  description and ordering, in JSX, and no other page could render one.
- **`sitemap.xml`, generated at build time**, with all 21 URLs, and
  `robots.txt` pointing at it. Every page is a client-side route, so nothing
  links to a permalink from outside and a crawler has no other way to find one.
- **Canonical URLs and per-page descriptions**, since the same figure now
  appears on three routes.
- **A 404 page.** An unmatched route rendered a blank frame; it now says what is
  published and links to it.
- Fixed the header overflowing the viewport once the topics joined the
  navigation. The links were 40px apart at 18px with seven items, which came to
  1366px on a 1280px screen. Tightened, and the hamburger now takes over below
  1100px rather than 768px.

Tests went from 137 to 185, and browser checks from 23 to 45. The new ones cover
which figures each route shows, that every permalink resolves, that the sitemap
matches the catalogue, and that no dataset is published without a figure or
drawn without being registered.

### Other

- Per-page titles. Client-side routing left every page sharing `index.html`'s
  title, so a shared link to the FAQ showed the dashboard's.
- `color-scheme: light` declared, so a browser's automatic dark mode does not
  invent a palette for charts whose colours were contrast-checked for white.
- Tests went from 1 to 80, plus 20 browser checks across two viewports.
- Series moved into JSON files beside their modules. Contributors edit numbers
  in JSON and prose in JavaScript, and the diff and freshness tools read exactly
  what the site renders.

### Known not-verified

Nothing outstanding as of 2026-09-01. Mobile layout was unverified when the
branch was first written — the browser tooling available then rendered at a
fixed 877px viewport and did not deliver `ResizeObserver` — and is now covered
by the Playwright mobile project.

## 2024-12-02 — initial site

Dashboard with affordability, healthcare, economy and education sections; FAQ;
S3 and CloudFront hosting. See the git history before `0756303`.
