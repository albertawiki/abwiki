# Getting alberta.wiki in front of Albertans

The goal is not traffic. It is for alberta.wiki to become the thing people reach
for when an argument about Alberta needs a number — the way people reach for a
transit app without thinking about it. That is a slower target than a viral post
and it changes what is worth doing.

Two consequences run through everything below:

1. **Being cited beats being visited.** One journalist who uses the site as a
   standing reference is worth more than a Reddit thread that peaks at 900
   upvotes and is forgotten in a week.
2. **Neutrality is the distribution strategy.** The moment the site is read as
   carrying a side, half of Alberta stops accepting its numbers and the project
   has failed at its actual purpose. This constrains what we post, where, and how
   we respond when someone tries to recruit the site to their argument.

## What this document is

Strategy and constraints: which channels are worth the effort, how to behave in
each, and what would damage the project. It is not a work list. Anything here
that turns out to be a task belongs in the issue tracker, and the one thing that
did has been moved there.

## Before promoting, and before each push

The blocker this section used to describe — every URL serving byte-identical
HTML, so a shared figure previewed as the site's generic title — is fixed. Each
route is prerendered with its own metadata, each figure offers its own chart as
the preview image, and each carries schema.org `Dataset` markup.

Four things are worth confirming before a push, because all four have been
wrong at some point and none is visible from the site itself:

```bash
# A permalink serves its own title, not the site default
curl -s https://alberta.wiki/f/er-wait-time-physician-assessment | grep -o "<title>[^<]*</title>"

# Its social card exists and is a PNG
curl -sI https://alberta.wiki/og/er-wait-time-physician-assessment.png | head -1

# Every cited document still resolves
npm run check:links

# No published figure has drifted from its source
npm run check:sources
```

Then paste a permalink into Slack or Discord and look at it. A scraper's cache
is the only real test, and it costs ten seconds.

The last two also run weekly and file what they find — see
[DATA_REFRESH.md](DATA_REFRESH.md) — but run them by hand before a push. A dead
citation found by a journalist is worth more damage than a dozen found by the
job.

## Channel by channel

### Reddit

The largest concentration of engaged Albertans, and the least forgiving of
self-promotion. r/Calgary, r/Edmonton and r/alberta all have low tolerance for
accounts that show up only to link their own project.

**What works:** answering a question that is already being asked. These
subreddits generate them constantly — "has the ER wait actually gotten worse?",
"are wages keeping up?", "is it cheaper to live in Edmonton?". Answer with the
number, the source, and a link to the specific figure. That is a helpful comment
that happens to contain a link, which is a completely different object from a
promotional post.

**Practical approach:**

- Build comment history first. A three-month-old account with one submission
  reads as astroturf regardless of what it says.
- Message the moderators of r/alberta before any submission. A non-commercial,
  non-partisan, open-source data resource is usually welcomed when asked about in
  advance and resented when not.
- When you do submit, lead with a specific finding, not the site. "Alberta's
  90th-percentile ER wait has gone from 3.4 to 7.0 hours since 2020-21 — here is
  the source" is a post. "Check out my new site" is spam.
- **Do not defend a political reading in the comments.** Someone will use the ER
  chart to attack a government and someone else will blame a previous one. The
  right reply from the project account is the measurement's caveats — that it
  covers only the 16 largest sites, that it excludes rural closures. Nothing
  builds durable neutrality faster than visibly declining to take the win.

r/CanadaHousing and r/PersonalFinanceCanada are secondary, for the affordability
figures specifically.

### Facebook

Where the demographic least served by existing data journalism actually is, and
where community groups are large, local, and moderated by people you can talk to.

- Calgary and Edmonton community and neighbourhood groups, plus municipal
  politics groups, and the many "[Town] Community Notice Board" groups outside
  the two cities. Rural Alberta is badly served by data journalism and unusually
  receptive.
- Approach the admins directly rather than posting cold. A short, plain message
  — non-partisan, open-source, free, here is the link — gets a yes far more often
  than most people expect.
- Facebook rewards the image, not the link. This is where per-figure Open Graph
  images pay for themselves.
- Expect the comments to be more partisan than Reddit's and less interested in
  methodology. The discipline is the same: reply with what the measure does and
  does not capture, never with a political reading.

### Discord

Smaller numbers, much higher quality. Calgary and Edmonton city servers, Alberta
tech and startup servers, university servers (U of C, U of A, MacEwan, Mount
Royal), and local civic-tech communities.

Discord's value is not reach — it is recruiting the ten people who will
contribute data, spot an error, or write a fetch script. Post in the projects or
introductions channel, be present afterward, and treat it as a hiring channel
rather than an audience.

### Journalists and newsrooms

The highest-leverage channel by a wide margin, because a citation is permanent
and compounding.

Worth approaching directly, with a specific figure rather than a general pitch:

- CBC Calgary and CBC Edmonton
- Calgary Herald, Edmonton Journal
- **The Sprawl** (Calgary) and **Taproot Edmonton** — reader-funded, data-friendly,
  small enough that an email reaches a person. Start here.
- LiveWire Calgary, The Tyee's Alberta coverage
- Rural weeklies via Alberta Weekly Newspapers Association, which are chronically
  short of research capacity and disproportionately grateful

**What to send:** not "please cover my site". Send a specific, checkable finding
with the source attached, and mention that the site keeps the series current. A
reporter who uses it once and finds the citation solid will come back, and the
second visit is the one that matters.

Be explicit that the material is CC BY and that charts can be reproduced. Removing
that friction is worth more than any pitch.

### Institutions and repeat users

The slowest channel and the one that produces durable use.

- **Public libraries.** Calgary and Edmonton Public Library both maintain local
  research guides. Getting listed is a form and an email.
- **University instructors.** Political science, public policy, economics,
  statistics, and journalism courses all need Canadian datasets with real
  provenance. A single instructor assigning it reaches a cohort a year, and
  students are exactly the people who file good corrections.
- **Civic organisations** across the spectrum — chambers of commerce, food banks,
  poverty-reduction coalitions, municipal associations. That the site is useful to
  organisations who disagree with each other is the strongest possible evidence
  of its neutrality, and worth stating plainly when it becomes true.
- **Wikipedia.** Alberta articles cite primary statistics constantly. Adding this
  site as an external link is against the spirit of the guidelines and will be
  reverted; improving those articles' citations *to the underlying sources* is
  legitimate and is how the underlying data reaches the most people.

### Search

Boring, compounding, and probably the largest long-term source of use.

People search "Alberta ER wait times", "Alberta poverty rate", "average wage
Alberta". The site should be the best answer to each.

Built already: topic pages and per-figure pages with real URLs, per-page titles
and descriptions, a visible "checked against source" date on every card, a
generated `sitemap.xml`, and `robots.txt` pointing at it.

Outstanding work is tracked as issues, not listed here. The substance worth
recording is why this site is unusually well placed for search: every figure
already carries a title, a unit, a geography, a cadence, a licence and a
machine-readable source, which is most of what schema.org's `Dataset` type asks
for. The metadata exists; only the markup is missing.

The domain name is a genuine asset here. `alberta.wiki` is memorable and reads as
a reference work rather than a publication.

## Rhythm

Publishing something regularly matters more than any launch.

**Each quarter,** when the Canadian Income Survey, RBC, MNP or Alberta Health
publishes, the site has a legitimate news hook: a number changed, here it is, here
is the source. Four of those a year, posted as findings rather than promotions,
builds the habit that a launch cannot.

**Each year,** a plain "how Alberta did this year" summary of every indicator, no
commentary. Ideally in a quiet news week, and ideally the same week every year so
it becomes expected.

The failure mode to avoid is a large launch followed by silence. A site whose
newest figure is eighteen months old is worse than no site, because it teaches
people the number is not worth checking.

## Measuring whether it is working

Direct traffic and returning visitors matter; total pageviews do not. The real
indicators:

- Citations in news coverage and in other people's arguments
- People linking a specific figure in a thread the project was not part of
- Corrections filed by strangers — the clearest sign the site is being read
  closely by people who do not know you
- Contributors who are not you

**Nothing is counting yet.** Use privacy-respecting analytics — Plausible,
GoatCounter, or simply CloudFront access logs, which cost nothing extra and are
already being generated — and say so in the footer. A site asking to be trusted
about data should not be running surveillance on its readers, and one that adds
a third-party script after promising that has a harder story to tell than one
that never did.

## Things that would set the project back

- Posting a chart with a political caption. One is enough to define the site.
- Accepting funding or a partnership from a party, campaign, or advocacy
  organisation, however aligned. If funding is ever needed, take it from readers
  or from a foundation with no position on the indicators.
- Replying to bad-faith comments in kind. The project account should be the most
  boring participant in any thread it is in.
- Letting an indicator go stale rather than marking it stale.
- Adding an indicator because it would circulate well. The selection criteria are
  published on the Contribute page; departing from them once costs more than any
  single chart is worth.

## First ninety days

Rewritten now that the site is built and the remaining gap is known.

1. **Week 1. Pre-flight and analytics.** Run the four checks above. Decide on
   analytics before the first push rather than after: without something
   counting, none of "Measuring whether it is working" below is answerable, and
   the first weeks are the ones worth measuring. This is the one item in this
   document with nothing built behind it.
2. **Week 2. Quiet soft launch.** Two or three Discord servers and one email to
   The Sprawl or Taproot. Fix what they tell you is broken. This is the cheapest
   audience to get wrong.
3. **Weeks 3–5. r/alberta**, moderators messaged first, led by a specific
   finding rather than the site. Then r/Calgary and r/Edmonton a week apart.
   There are several findings on the site now that stand on their own: the ER
   wait doubling from 3.4 to 7.0 hours, royalties swinging from 6% to 33% of
   provincial revenue, class size reporting stopping in 2019.
4. **Weeks 6–8. Facebook community groups**, admin-first, with images. Library
   research-guide submissions. Emails to three or four instructors.
5. **Weeks 9–13. The first quarterly update post** when the next release lands.
   That post, not the launch, is what establishes the site as a thing that keeps
   going. The data-refresh automation in the roadmap exists to make sure there
   is always something true to post.
