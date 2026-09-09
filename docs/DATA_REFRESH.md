# Keeping the numbers current

A curated data site fails quietly. Nobody notices a chart is two releases
behind, and nobody notices when a statistical agency revises a number already
published under your name. Two consumer debt quarters sat unfilled here for
months — not because the work was hard, but because nobody re-checked.

`.github/workflows/data-freshness.yml` runs every Monday at 08:00 Mountain, and
on demand. What it can fix, it fixes into a pull request. What it cannot, it
reports as an issue.

## It runs on GitHub, not AWS

Worth settling explicitly, because "we already have an AWS account" makes AWS
look like the natural home. It is not.

| | GitHub Actions | AWS (Lambda plus EventBridge) |
|---|---|---|
| Credentials | The run's own scoped token. Nothing stored | A long-lived GitHub token, stored in AWS |
| Cost | Free on a public repository | Pennies, plus another thing to bill |
| Where the output goes | A branch and a pull request in this repository | A branch and a pull request in this repository |
| Moving parts | One workflow file | Function, schedule, role, packaging, secret rotation |

The deciding line is the first. The job's output is a commit and a pull request
in this repository, and an Actions run already holds a token scoped to exactly
that. Doing it from AWS means minting a long-lived GitHub credential, storing it
outside GitHub and rotating it forever, in exchange for nothing. The sources are
public HTTPS endpoints with no authentication, so there is no network reason to
sit inside the AWS account either.

## Two tiers, because there are two kinds of source

**Machine-readable.** Six datasets come from Statistics Canada vectors: the
median weekly wage, poverty and food insecurity, household debt to income, real
GDP per person, the oil and gas share of provincial revenue, and the effective
number of industries. `scripts/refresh-data.mjs` reads the vectors, writes what
has moved, and the workflow opens a pull request.

**Document-sourced.** RBC, MNP, Alberta Health, Alberta Find a Doctor, the OECD,
CMEC and Alberta Education publish PDFs. Nothing here can read one. All the job
can do is notice that a publisher's expected date has gone by and open an issue
saying so — which is most of the value, because noticing was the part that was
missing.

`scripts/lib/series.mjs` holds both lists, and a test fails if a dataset in the
registry is in neither.

## What it will not do

- **Merge.** `main` is protected and the review is the point: a person reads the
  diff and decides whether a number on the site should change.
- **Confuse a revision with a new period.** An added year is routine. A changed
  value for a year already published means the site has been showing a number
  its own citation no longer supports, and the pull request title says which of
  the two it is before anyone opens it.
- **Copy a derived column.** `perCapita` is GDP over population; `share` is
  royalties over revenue. Statistics Canada revises those inputs separately, so
  a derived value carried over from the old row would be a number that came from
  nowhere. They are recomputed from whatever the inputs now say.
- **Treat reference periods as interchangeable.** The per-capita denominator is
  the 1 July population estimate; the household debt figure is the fourth
  quarter; the government finance table's year is the fiscal year ending nearest
  31 December. Every file reading a vector published more often than it shows it
  declares `statcanPeriod`, and a test enforces that. Without it the last
  observation in the year wins, which in June is whichever quarter happened to
  be released — that is how a series gets shifted by a year.
- **Move `nextExpected`.** That is a claim about a publisher's calendar, which
  this job has no way to verify. A person moves it, having seen the publisher
  say something.
- **Reformat a file.** See below.
- **Report a transport failure as a finding.** If Statistics Canada does not
  answer, nothing was checked, and the run says exactly that. A job that reports
  "could not verify" as though it were "a figure is wrong" teaches people to
  ignore it.

## Why it edits text rather than rewriting JSON

The obvious implementation is parse, change, `JSON.stringify`. It turns a
one-value correction into a seventy-line diff, because these data files are laid
out by hand: rows on one line where they fit, expanded where they do not, and
trailing zeros kept so a column of figures lines up under itself. Reformatting
all of that produces the diff nobody reads properly — which matters more here
than usual, since the entire design is that a person reads the diff.

So `scripts/lib/json-series.mjs` edits the text. A revision replaces one value in
place. A new row is cloned from the row above it, arriving in the same shape, key
order and indentation as its neighbours. Its test rebuilds every row of every
data file from that row's own values and requires the text back byte for byte, so
if the writer would reformat anything it fails there rather than in a pull
request.

Number formatting is read from the file rather than imposed on it. A column is
written to at least as many decimal places as its narrowest existing value, and
more where a number needs them: the wages column is two places throughout and a
new `1215.2` belongs there as `1215.20`, while the effective-industries column
carries `12.86` and `13.0` side by side and a new `12.8` stays `12.8`.

## One pull request, updated in place

The branch is `automation/data-refresh`, force-pushed from `main` every run.
There is one pull request from it, updated rather than replaced, so a quiet
month leaves one thing to read instead of four.

Every run stamps `lastChecked`, whether or not a number moved. That is not
padding: `lastChecked` means the day someone or something confirmed the
published number still matches the document it cites, and a run that found
nothing has confirmed exactly that. It also means every run has something to
push, which matters because GitHub switches a scheduled workflow off after sixty
days with no repository activity — and sixty quiet days is precisely the stretch
this job exists to cover.

## Two things to know when reviewing one

**It arrives with no checks on it.** A pull request opened with `GITHUB_TOKEN`
does not trigger workflows. That is GitHub's rule and there is no way around it
short of storing a personal access token, which would trade a real credential for
a convenience. Close and reopen the pull request, or push to the branch, and the
checks run. The reader-visible data diff is written into the body by the same
`data-diff.mjs` that would otherwise have commented.

**Actions must be allowed to open pull requests.** Settings → Actions → General →
"Allow GitHub Actions to create and approve pull requests". Without it the branch
is still pushed and the run still summarises what it found; only the pull request
is missing.

## Citations are checked too

`scripts/check-links.mjs` visits every cited source and keeps three outcomes
apart, because conflating them is how a check gets ignored:

- **Gone.** A 404, or a connection that fails. The citation is wrong and someone
  has to find where the document went. This is the only outcome that fails the
  run.
- **Moved.** A redirect. The link works, but names an address the publisher has
  walked away from, and it becomes the case above the day the redirect is
  retired. Alberta Find a Doctor became Alberta Find a Provider exactly this way.
- **Blocked.** A 403 or 429. The OECD and MNP both refuse anything that is not a
  browser. Nothing is wrong with the link, and calling it broken would teach
  people to ignore the check.

It asks as a browser would, and with GET rather than HEAD — enough publishers
answer HEAD with 405 that a HEAD-based check reports healthy links as broken.

## Running it by hand

```bash
npm run refresh:data           # report, change nothing
node scripts/refresh-data.mjs --write
npm run check:sources          # the same comparison, exiting non-zero on a revision
npm run check:links            # every cited document still resolves
npm run test:scripts           # the build scripts' own tests
```

`check-sources.mjs` and `refresh-data.mjs` share `scripts/lib/compare.mjs`. They
ask different questions of the answer — the check fails a build on a revision,
the refresh writes one — but they must not come to different views of what the
source says. Two jobs with their own copies of that comparison would eventually
disagree, and a refresh proposing changes the check then rejects is worse than
either alone.
