# Accessibility

alberta.wiki is built to **WCAG 2.2 Level AA**. Every route is checked against
that standard on every change, in both themes and at two viewport sizes.

## Why that standard, and not Alberta's

There isn't an Alberta one to follow.

Alberta has no accessibility legislation covering web content. Ontario has the
AODA; British Columbia, Manitoba and Saskatchewan each have an accessibility
act; the federal *Accessible Canada Act* binds federally regulated entities.
Alberta has none of these, and nothing legally obliges this site.

The Government of Alberta's own [accessibility page](https://www.alberta.ca/accessibility)
says its site "conforms to the Web Content Accessibility Guidelines of the
Worldwide Web Consortium (W3C)" — naming no version and no conformance level.
That is not a standard a project can be measured against.

So this one is chosen rather than inherited. WCAG 2.2 AA is the current W3C
Recommendation and is stricter than the 2.1 AA that other Canadian
jurisdictions legislate, so meeting it satisfies anything Alberta might later
require.

## What is checked, and how

`e2e/accessibility.spec.mjs` runs on every pull request:

- **axe-core** over every route — the dashboard, all four topic pages, a figure
  permalink, Contribute, FAQ and the 404 — tagged `wcag2a`, `wcag2aa`,
  `wcag21a`, `wcag21aa`, `wcag22aa`.
- The dashboard again in **dark mode**, because dark is a separate palette
  rather than an inversion, so its contrast is a separate question.
- Both at **desktop and mobile** widths.

An automated scan catches roughly a third of WCAG failures. It cannot tell
whether a chart's description is useful or whether a reading order makes sense.
So four checks sit alongside it that a scanner will not do:

| Check | Why it is not a scanner's job |
|---|---|
| Every control is in the tab order and announces something | A scanner sees a name; it does not see whether the control can be reached |
| Focus stays visible while tabbing | A focus ring styled to nothing is invisible to a scanner and to a keyboard user both |
| Headings descend without skipping a level | Requires reading the outline, not one element |
| Every chart offers a data table | The accessible equivalent of an SVG is the numbers behind it |

## What was wrong when this was first measured

The first audit found four faults, all of them real:

| Fault | Detail |
|---|---|
| Muted text | `--text-muted` `#898781` measured **3.4:1** against the page. Now `#73716c`, at 4.62:1 |
| Links | `--link` `#2a78d6` measured **4.19:1**, just under. Now `#2771c9`, at 4.64:1 |
| Links in prose | Distinguishable from body text by colour alone, failing 1.4.1. Now underlined |
| Carousel dots | 10px targets, under the 24px WCAG 2.2 minimum. Now 24px targets around a 10px dot |

**The chart series colours were deliberately not changed.** `--series-1` is still
`#2a78d6`, the value `--link` used to hold. A chart mark is a graphic and answers
to 3:1 rather than 4.5:1, and that palette is validated for colour-vision
deficiency. Darkening it to satisfy a text rule that does not apply to it would
have traded a real property for a spurious one.

## Charts

Charts are where a data site is least accessible and least able to fix it with
markup. A line in an SVG means nothing to a screen reader no matter how it is
labelled.

The approach here is substitution rather than annotation:

- **Every figure carries a data table** with the same numbers, opened from the
  card. A test fails any figure that does not offer one.
- **Colour is never the only signal.** Series are also distinguished by position
  and by direct labels, and the palette is validated for colour-vision
  deficiency at three series, which is why no chart carries a fourth.
- **Direction is stated in words** where a reader could otherwise misread which
  way is better — see `directionLabel` in `chartTheme.js`.

## What is not covered

Honesty about the limits of this:

- **No screen reader has been run against the site.** axe-core checks markup, not
  the experience. NVDA, JAWS and VoiceOver each behave differently.
- **No testing with disabled users.** The checks encode rules; they do not
  substitute for someone telling us what does not work.
- **WCAG AAA is not attempted**, including the 7:1 contrast level.
- **Charts are not navigable by keyboard.** A reader cannot tab through data
  points; they get the table instead.

If something does not work, that is a defect. The FAQ says so and asks people to
open an issue.
