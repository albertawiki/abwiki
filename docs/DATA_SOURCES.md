# Data sources

What each published figure comes from, how it was extracted, and what is
unresolved. If you are updating a series, start here.

Machine-readable sources are checked automatically each week by
`scripts/check-sources.mjs`. PDF sources are transcribed by hand; this file is
where the extraction method is recorded so somebody else can repeat it.

## Automatically checkable

### Median weekly wage — `src/data/affordability/wages.json`

- Wage: Statistics Canada table 14-10-0064-01, vector **v2292739** — median
  weekly wage rate, Alberta, all employees 15+, both full- and part-time, all
  industries, total gender.
- Deflator: table 18-10-0005-01, vector **v41694625** — Alberta all-items CPI,
  annual average, 2002 = 100.
- Released each April for the preceding year.

**Correction, 2026-08-31.** This chart previously used CPI values of 136 / 137 /
141.6 / 151.2 / 157.1 for 2019–2023. Those are close to the Canada-level CPI,
not Alberta's (143.1 / 144.7 / 149.3 / 158.9 / 164.1). Alberta inflation was
higher over this period, so the old chart understated the real-wage decline.

### Poverty and food insecurity — `src/data/affordability/poverty.json`

- Poverty, Market Basket Measure 2018 base: table 11-10-0093-01, vector
  **v1529653318** (all persons, Alberta).
- Poverty, MBM 2023 base: same table, vector **v1793293306**. Starts at 2020.
- Food insecurity: table 13-10-0835-01, vector **v1529615071** — all persons in
  households reporting marginal, moderate or severe food insecurity.
- Both come from the Canadian Income Survey, released each April for the
  preceding reference year.

**Correction, 2026-08-31.** Points were previously labelled by collection year
(`2019-06`, `2020-06`, and so on) while carrying values for the reference year,
shifting the whole series forward by a year. The poverty values also did not
match the table under either labelling.

Because Statistics Canada rebased the MBM in 2023, the two bases are published
as separate series. They are close where they overlap, but they are not the same
measure and are not spliced into one line.

### Employment rate — `src/data/economy/Employment.js`

Fetched live in the browser from the Government of Alberta Economic Dashboard:

```
https://api.economicdata.alberta.ca/data?table=EmploymentRate_14100287
  &characteristic=employment%20rate&geoname=alberta
  &sex=both%20sexes&age=15%20years%20and%20over
```

Monthly, seasonally adjusted, back to 1976. Ultimately Statistics Canada table
14-10-0287-01.

**Fixed, 2026-08-31.** The chart previously called the dashboard's older
code-based endpoint (`/api/data?code=cc63aded-...`). That endpoint now returns
HTTP 500 — the dashboard moved to table-based queries — and the component only
logged the failure, so the chart had been rendering an empty frame. It now uses
the current endpoint and falls back to committed annual averages, with a visible
notice, when the API is unreachable.

## Transcribed from PDFs

### Cost of owning a home — `src/data/affordability/HousingAffordabilityData.js`

RBC Economics publishes its aggregate affordability measure quarterly, about
three months in arrears. Up to the June 2025 edition the report carried an
appendix table with the value, quarter-over-quarter and year-over-year change per
market. Since then the value appears only in the Calgary and Edmonton commentary.

To add a quarter: open the latest report from the
[RBC housing affordability index](https://www.rbc.com/en/economics/canadian-analysis/canadian-housing/housing-affordability/),
find the Calgary and Edmonton sections, read the aggregate measure, and record
the report month in the `report` field.

**Open question — Edmonton, Q1 2026.** The June 2026 report gives Edmonton's
aggregate measure as 36.8% and, in the same paragraph, says it is "down 0.5
percentage points from Q4" — but Q4 2025 was published as 33.1% in the March 2026
report. Those cannot both be true. 36.8% was also Edmonton's *single-detached*
measure in an earlier vintage, so this may be a transposition in RBC's copy.
Edmonton's Q1 2026 point is withheld until a later report confirms it. Calgary's
Q1 2026 figure (41.5%) is consistent across both reports and is published.

RBC also revises the series between editions, which is why each row records the
report it came from. Values before 2024-Q3 were carried over from the original
version of this dataset and predate the `report` field, so their vintage is
unknown.

### Albertans within $200 of insolvency — `src/data/affordability/ConsumerDebt.js`

The MNP Consumer Debt Index, conducted by Ipsos, quarterly. The provincial
breakdown is on the "Finances at Month-End — % $200 or less from insolvency"
slide of each wave deck, not in the press release.

Wave decks are at predictable URLs:

```
https://mnpdebt.ca/-/media/files/mnpdebt/consumer/pdf/debt-index/<year>/mnp-debt-index-wave-<n>.pdf
```

Some waves carry a `-final` suffix. The site returns 403 to some clients; a
normal browser user-agent works. Text extraction needs layout mode (pypdf's
`extraction_mode="layout"`) — the slide is a set of positioned text boxes, and
reading-order extraction scrambles the regional list into unusable fragments.

Wave-to-quarter mapping for the committed series: 24 → 2023-Q1, 27 → 2023-Q4,
28 → 2024-Q1, 29 → 2024-Q2, 30 → 2024-Q3, 31 → 2024-Q4, 32 → 2025-Q1,
33 → 2025-Q2, 34 → 2025-Q3, 35 → 2025-Q4.

**Gap — waves 36 and 37.** MNP published national results for the March 2026 and
June 2026 waves (wave 37: national 46%, fielded 11–16 June 2026), but the
provincial decks were not retrievable at those URLs on 2026-08-31. Secondary
coverage put Alberta at 42% for wave 36; that is not a primary source and is not
published here. Both quarters are absent from the chart rather than filled with a
number we cannot verify.

The previous version of this dataset sampled roughly one wave a year, which made
a noisy poll look like a smooth annual trend. It is now the full quarterly
series, with the subsample's margin of error stated in the chart notes.

### Emergency department waits — `src/data/healthcare/ERData.js`

Government of Alberta Health Annual Report, Performance Measure 1.a: "Emergency
department wait times: 90th percentile time to initial physician assessment in
the 16 largest sites (in hours)". Published each June for the fiscal year ending
March 31. All years are at
[open.alberta.ca/publications/2367-9824](https://open.alberta.ca/publications/2367-9824).

2024-25 is 7.0 hours, up from 6.7. The 2024-25 report also restates 2021-22
(4.6 → 4.5) and 2022-23 (6.3 → 6.2); the restated values are used here.

The 2025-26 report was not yet published as of 2026-08-31.

[Health Quality Alberta's Focus dashboard](https://focus.hqa.ca/charts/patient-time-to-see-an-emergency-doctor/)
carries the same measure at site level and more frequently. It is worth
investigating as a machine-readable replacement — see `docs/ROADMAP.md`.

### Primary care providers accepting new patients — `src/data/healthcare/FamilyDoctorData.js`

Counts from Alberta Find a Doctor, reported by Alberta Primary Care Networks, as
at March 31 each year.

**Scope change.** From 2025 the published count includes nurse practitioners
(418 physicians + 44 nurse practitioners = 462). Earlier years are physicians
only. The chart draws 2025 in a different colour and each row carries a `scope`
field, because 163 → 462 is partly a change in what is being counted.

This is a listing rather than a registry: it counts providers who have stated on
the site that they are accepting patients. It measures advertised availability,
not supply.

### PISA — `src/data/education/PISA.js`

OECD PISA, Volume I, Alberta rows from the Canadian annex; also published by the
Council of Ministers of Education, Canada. Every three years.

PISA 2025 was written in spring 2025 and the OECD is expected to publish results
in December 2026. Nothing on this chart changes before then.

## Sources considered and not used

- **News coverage of any of the above.** Coverage of a number is not a source.
- **Fraser Institute wait-time survey.** Physician-reported perceived waits
  rather than a measurement, published by an organisation with a stated policy
  position on the subject. The CIHI and Alberta Health administrative measures
  cover the same ground from records rather than opinion.
- **Real-time ER wait-time displays on albertahealthservices.ca.** Current
  estimates only, with no published history, so they cannot support a trend.
- **Projections and modelled forecasts of any kind.** This site reports what has
  been measured.
