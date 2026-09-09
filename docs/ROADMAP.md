# Roadmap

What alberta.wiki could measure next, and what it would take. Each entry names
the source, says whether it is machine-readable, and states honestly what the
measure does not capture — the same standard a contributor's proposal is held to.

Ordered by value per unit of effort, not by topic.

## Tier 1 — high value, source already proven

These use APIs the site already talks to, or Statistics Canada vectors the
freshness checker can validate on day one.

### Unemployment rate, and the participation rate beside it

The employment rate alone is ambiguous: it falls when people retire as well as
when they lose work. Publishing unemployment and participation next to it turns
one ambiguous line into a readable picture of the labour market.

- **Source:** Alberta Economic Dashboard, same table endpoint as the employment
  chart; ultimately StatCan 14-10-0287-01. Monthly, live.
- **Effort:** an afternoon. The fetch pattern already exists.
- **Doesn't capture:** underemployment, or people who have stopped looking.
- **Form:** three small multiples sharing a y-axis, not one chart with three
  lines — they are different measures and should not be read as a ranking.

### Youth unemployment (15–24)

Consistently the sharpest labour indicator, and the one most closely tied to
whether young Albertans stay in the province.

- **Source:** same table, `age=15 to 24 years`. Monthly, live.
- **Effort:** hours, once the above exists.
- **Doesn't capture:** students working part-time by choice.

### Interprovincial migration

Whether people are moving to Alberta or leaving is the plainest single summary
of how the province is doing, and it is genuinely non-partisan — it is the sum
of a great many private decisions.

- **Source:** StatCan 17-10-0045-01 (quarterly, by province of origin and
  destination). Machine-readable via WDS.
- **Effort:** an afternoon.
- **Doesn't capture:** international migration, which moves for federal-policy
  reasons and should be a separate series.
- **Form:** net migration as a bar above and below zero — a diverging measure
  where zero genuinely means "nothing", so the form fits the data.

### Rent

The affordability section currently covers ownership costs but not rent, which is
what most Albertans under 35 actually pay.

- **Source:** CMHC Rental Market Survey (average and median rent by bedroom
  count, Calgary and Edmonton, annual each January) plus StatCan 18-10-0004
  rented-accommodation CPI for a monthly read.
- **Effort:** a day. CMHC's Housing Market Information Portal has a bulk export;
  the API is less pleasant than StatCan's.
- **Doesn't capture:** the gap between advertised rents and what sitting tenants
  pay, which is the whole story for anyone who has not moved recently.
- **Note:** worth pairing with vacancy rate from the same survey; rent without
  vacancy invites the wrong conclusion.

### Real median household income

The single best summary of household living standards, and a natural companion
to the wage chart.

- **Source:** StatCan 11-10-0190-01, deflated by Alberta CPI as the wage series
  already is. Annual.
- **Effort:** hours — the deflation helper exists.
- **Doesn't capture:** distribution. Publish alongside a decile or Gini series
  rather than alone.

## Tier 2 — high value, needs source work

### Surgical wait times

Consistently among the top healthcare concerns, and the one where "we funded
more surgeries" is most often substituted for "waits got shorter".

- **Source:** CIHI publishes provincial 90th-percentile waits for hip and knee
  replacement, cataract surgery, and cancer surgery. Alberta Health Services
  publishes its own by procedure.
- **Effort:** a few days. CIHI's data tables are downloadable but the format
  changes between releases.
- **Doesn't capture:** the wait before a specialist referral, which is often the
  longer half and is not measured anywhere.
- **Note:** pick a small fixed set of procedures and hold to it. Rotating which
  procedures are shown is how a wait-time chart becomes a talking point.

### Emergency department waits, monthly and by site

The current chart is one number a year for the 16 largest sites. Health Quality
Alberta's Focus dashboard carries the same measure monthly, per facility.

- **Source:** [focus.hqa.ca](https://focus.hqa.ca/charts/patient-time-to-see-an-emergency-doctor/).
  Investigate whether the underlying data is fetchable.
- **Effort:** a day to investigate, more if it has to be scraped.
- **Why it matters:** a provincial annual figure hides that the experience in
  Red Deer differs from Calgary. It would also let the chart update in-year
  rather than once every June.

### Rural emergency department closures

Alberta's most acute healthcare access problem is not covered by any current
figure, because the ER wait measure covers only the 16 largest sites — and a
closed department has no wait time at all.

- **Source:** AHS issues service-disruption notices; there is no published time
  series. Would require accumulating notices going forward.
- **Effort:** significant, and it means becoming a data publisher rather than a
  data curator — a different commitment with a different failure mode.
- **Honest assessment:** the most valuable thing on this list and the one most
  likely to go stale. Do not start it without someone committed to maintaining
  it.

### Class sizes and per-student funding

Education is currently represented only by PISA, which updates once every three
years and last moved in 2022. The section is effectively frozen.

- **Source:** Alberta Education annual reports; StatCan 37-10-0109-01 for
  per-student expenditure. Funding must be inflation-adjusted **and**
  enrolment-adjusted, or it measures population growth.
- **Effort:** a few days, mostly in getting the adjustment right and defensible.
- **Doesn't capture:** class size is reported as a divisional average, which
  hides the distribution that parents actually experience.

### Housing starts and completions

Speaks directly to whether supply is responding, and is a leading indicator for
the affordability measures already published.

- **Source:** CMHC starts and completions, monthly by centre. Also on the
  Alberta Economic Dashboard.
- **Effort:** an afternoon via the dashboard endpoint.
- **Doesn't capture:** what is being built or at what price point.

## Tier 3 — worth doing once the site has more traffic

- **Crime severity index** (StatCan 35-10-0026-01, annual). Widely misread —
  publish only with violent and non-violent split out, and a plain note that it
  is police-reported, so it moves with reporting rates as well as with crime.
- **Opioid deaths** (Alberta substance use surveillance system, quarterly, and
  genuinely well published). Grim but among the most-searched Alberta statistics.
- **Life expectancy** (StatCan 13-10-0114-01). Slow-moving, which is exactly why
  it belongs on a site arguing for attention to trends over headlines.
- **Household electricity and natural gas costs** (Alberta Utilities Commission
  rate history). Highly salient in Alberta; needs care to avoid comparing
  regulated and competitive rates as if they were the same thing.
- **Provincial debt and debt servicing costs** as a share of revenue (Alberta
  budget and fiscal plan documents, annual). Publish as a share, not a total, or
  it is just a chart of inflation.

## Visualisation and site improvements

Ordered by how much they improve the site's core job.

### A headline row on the home page

The dashboard currently opens with a wall of charts. A reader who wants "how is
Alberta doing" should get five or six current values first — latest figure,
direction of travel, when it was measured — and reach the charts below.

Small, high-impact, and it is the piece that makes the site shareable: a
screenshot of a stat row travels; a screenshot of nine charts does not.

### A page per topic

`/healthcare`, `/affordability` and so on, each with the topic's figures, its
sources, and a plain-language explanation of what each measure captures. Better
for search, better for linking, and it gives a Reddit or Facebook post something
specific to point at.

### Per-figure permalinks and shareable images

`alberta.wiki/f/er-wait-time-physician-assessment` for every figure, with an
Open Graph image generated at build time. This is the single change most likely
to get the site circulated: people share a chart, and the chart needs to carry
its own attribution and URL when it does.

### Direction-of-travel indicators

Each card showing whether the latest value is better or worse than the one
before, and by how much. Requires deciding, per indicator and in the data file,
which direction is good — an explicit `betterDirection` field rather than a
convention, so the judgement is visible and reviewable rather than buried in a
component.

### Downloadable CSV per figure

A "Download data" link beside the table. Cheap to build, and it makes the site
useful to journalists and students, who are the readers most likely to cite it.

### "Last updated" and "next expected" surfaced on the home page

The metadata already exists on every dataset. Showing it prominently is how the
site distinguishes "this is not measured yet" from "nothing is happening" —
which is the most common misreading of any dashboard.

### Dark mode

The chart theme is already structured for it (tokens in `chartTheme.js`), but the
dark palette steps need validating against a dark surface before shipping. Do not
ship an automatic colour flip.

## Data refresh that opens a pull request

**Built.** `.github/workflows/data-freshness.yml`, weekly on Mondays. See
[DATA_REFRESH.md](DATA_REFRESH.md) for how it works and what it will not do.

## Deliberately not on this list

- **Composite indices.** A single "Alberta score" made of weighted indicators.
  The weights are political choices dressed as arithmetic, and no reader can
  audit them.
- **Comparisons to other provinces as the default framing.** Useful as context on
  a specific chart, corrosive as an organising principle — it turns a measurement
  site into a scoreboard.
- **Anything requiring us to model or project.** The site's credibility rests on
  only ever reporting what somebody has measured and published.
- **Screen reader testing as a project task.** The site is built and verified to
  WCAG 2.2 AA, and `docs/ACCESSIBILITY.md` states honestly that no screen reader
  has been run against it. Closing that gap properly means a person who uses one
  daily, not a developer pretending to. Decided 2026-09-08; it belongs with a
  real user, not on a backlog.
