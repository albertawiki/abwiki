---
name: chart-notes
description: House style for writing the "How to read this" notes on an alberta.wiki figure (the meta.notes array), and the card title, unit and description that sit around them. Use whenever adding a dataset, editing an existing dataset's notes, reviewing a pull request that touches meta.notes, or writing any reader-facing copy attached to a figure. Triggers on "how to read this", "chart notes", "meta.notes", "caveats", "add a dataset", "add a figure", "indicator description".
---

# Writing "How to read this"

These notes are the most important prose on the site. A reader who takes a
number from here and puts it in an argument is relying on them to have told
them what the number does not say.

They are also where an agent's voice slips most easily, because each one is
short and it is tempting to make it land. Do not make it land. Make it true.

## The model: Our World in Data

[OWID's indicator pages](https://ourworldindata.org/grapher/gini-coefficient-wb)
carry a section called "What you should know about this indicator". Their
bullets look like this, verbatim:

> The Gini coefficient is a common measure of income inequality, which
> summarizes the distribution and expresses it in terms of a number from 0 to 1.
> Higher values indicate higher inequality.

> The exact surveys that countries run can change over time, creating breaks
> across which data points are less comparable.

Note what is absent: no aphorism, no rhetorical build, no telling the reader
what to think. The first bullet defines the measure and states which direction
is which. A later one warns about comparability. Each bullet is one idea and
survives being read alone.

That is the target register. We separate the same two things they do: what the
measurement *is*, and what a reader should be careful about.

## Order

Write notes in this order. Skip any that do not apply; do not reorder.

1. **What the number is**, in plain words, and **which direction means what**
   if that is not obvious. Always first.
2. **What it does not capture** — who is excluded, what the measure is silent
   about, what a reader would wrongly assume it covers.
3. **Methodology a reader needs** — seasonal adjustment, base years, the
   denominator, whether we derived it ourselves.
4. **Breaks in comparability** — rebasing, scope changes, revisions, changes in
   what is counted.
5. **Where the series stops or stalls**, if it lags or has gaps.

Three to six notes. Each one to three sentences.

## Voice

**Write declaratively. State the fact and stop.**

The site's prose was rewritten once to remove AI cadence, and notes are where
it creeps back. These constructions are banned:

| Do not write | Write instead |
|---|---|
| "It is deliberately not the average — it describes the bad days." | "We show it instead of the average because it describes the days when capacity is short." |
| "Two answers to the same question, and the gap between them is the point." | "Oil and gas is 5 to 8 per cent of Alberta jobs and 12 to 33 per cent of output." |
| "This is a listing, not a registry." | "This counts providers who have listed themselves as accepting patients." |
| "A median is not an average." | "This is a median, so half of Alberta employees earn less than the figure shown." |

The pattern in every case: an assertion made by rejecting a foil, or a sentence
built to land a beat. State the positive claim on its own.

Also avoid:

- **Closing flourishes.** "…which is the whole point." "…and that matters."
- **Em dashes** used for drama. A comma, a semicolon or a full stop.
- **Triads for rhythm.** Three items only when there are three things.
- **Hedging stacks.** "may possibly suggest" — either it does or it might.
- **Adjectives where a number exists.** Not "a wide margin of error" but
  "±7 percentage points".
- **Second person imperatives.** "Read the trend, not the quarter" becomes
  "Individual quarters move by more than the margin of error."

Use "we" only for choices this project made: "We take the fourth quarter of each
year." Never for the source's choices.

## Neutrality

This is the site's hardest rule and notes are where it is easiest to break.

- **Never attribute a movement to a party, government, minister or policy.**
  Not approvingly, not critically, not by implication.
- Naming a *mechanism* is fine and often required: "Pandemic-era benefits such
  as CERB pushed measured poverty to a record low in 2020." That describes a
  cause without assigning credit.
- Naming a *decision-maker* is not: avoid "the government's cuts", "after the
  province reduced funding".
- Do not tell the reader the number is good or bad. "Alberta ranks poorly" is
  a judgement; "Alberta's figure is below the national average" is a fact.
- Where a number is commonly misused in argument, say what it cannot support
  rather than which side is wrong.

## Things that must always be disclosed

If any of these is true and unstated, the notes are incomplete:

- The figure is **derived by us** rather than published. Say so, name the
  formula, and put the inputs in the data table.
- The series has a **base change, scope change or rebasing**.
- It is a **survey**, and its margin of error at this geography. Give the
  number.
- It is **seasonally adjusted**, or is not and should not be compared month to
  month.
- The publisher **revises** it, and whether we record as-first-published.
- Some observations are **withheld or missing**, and why.
- The series **ends earlier** than the chart's other series or than today.
- The measure is a **ratio whose denominator moves**, so it can change without
  the numerator changing. This catches out more readers than anything else.

## Titles, units and descriptions

The notes sit inside a card with three other pieces of reader-facing text.

- **`title`** — a plain noun phrase naming what is measured. "Household debt
  compared with income", not "Debt-to-income ratio" (jargon) or "Albertans are
  borrowing less" (a conclusion).
- **`unit`** — what one value means, including the denominator. "% of the
  labour force", not "%".
- **`description`** — one sentence, in the card, saying what the figure shows.
  Plain enough for a reader who will not open the notes.

None of the four may state a conclusion the reader should draw.

## Before you commit

- Read each note aloud. If it sounds like it wants applause, rewrite it.
- Cover the chart and read the notes alone. Could a reader still say what the
  number measures and what it misses?
- Check the disclosure list above, item by item.
- Run `npm run test:ci` — `src/data/datasets.test.js` fails a dataset with no
  notes and flags the banned constructions above.
