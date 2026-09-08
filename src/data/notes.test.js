import { datasets } from './index';

/**
 * House style for the "How to read this" notes.
 *
 * These check the rules in .claude/skills/chart-notes/SKILL.md that can be
 * checked mechanically. They cannot tell whether a caveat is *true* or
 * complete — only a reviewer reading the source can — but they do stop the
 * two failure modes that recur: notes drifting back into an aphoristic voice,
 * and notes that quietly take a political side.
 *
 * A failure here is a prompt to rewrite, not to add an exception.
 */

const allNotes = datasets.flatMap(({ meta }) =>
  meta.notes.map((text, i) => ({ id: meta.id, index: i + 1, text })),
);

/** Constructions the site's copy pass removed, which keep coming back. */
const BANNED_VOICE = [
  [/\bis the (?:point|whole point|entire point)\b/i, 'aphoristic closer ("is the point")'],
  [/\bthat is (?:the whole|exactly the|precisely)\b/i, 'aphoristic closer'],
  [/\bis not\b[^.]{0,40}\bit is\b/i, 'binary contrast ("is not X, it is Y")'],
  [/\bdeliberately not\b/i, 'binary contrast ("deliberately not")'],
  [/\bwhich is what[^.]{0,40}\blook like\b/i, 'aphoristic closer'],
  [/—/, 'em dash used for drama; use a comma or a full stop'],
  [/\bmay possibly\b|\bmight potentially\b/i, 'hedging stack'],
];

/**
 * Naming a decision-maker attributes a movement to them. Naming a mechanism
 * (a benefit programme, an interest rate, a price) describes a cause without
 * assigning credit or blame, and is required rather than discouraged.
 */
const PARTISAN = [
  [/\b(?:UCP|NDP|Conservative|Liberal|New Democrat)\b/, 'names a political party'],
  [/\bthe (?:premier|minister|government)(?:'s|s')\b/i, 'attributes to a decision-maker'],
  [/\bunder (?:the )?(?:premier|minister)\b/i, 'attributes to a decision-maker'],
];

describe('every "How to read this" note', () => {
  it('exists in a readable quantity', () => {
    datasets.forEach(({ meta }) => {
      expect(meta.notes.length).toBeGreaterThanOrEqual(3);
      expect(meta.notes.length).toBeLessThanOrEqual(6);
    });
  });

  it('is one to three sentences, not a paragraph', () => {
    const tooLong = allNotes
      .filter(({ text }) => text.split(/\s+/).length > 60)
      .map(({ id, index, text }) => `${id} #${index} (${text.split(/\s+/).length} words)`);
    expect(tooLong).toEqual([]);
  });

  it('says something, rather than gesturing at it', () => {
    const tooShort = allNotes
      .filter(({ text }) => text.split(/\s+/).length < 8)
      .map(({ id, index }) => `${id} #${index}`);
    expect(tooShort).toEqual([]);
  });

  it('avoids the constructions the copy pass removed', () => {
    const offenders = [];
    allNotes.forEach(({ id, index, text }) => {
      BANNED_VOICE.forEach(([pattern, why]) => {
        if (pattern.test(text)) offenders.push(`${id} #${index}: ${why}`);
      });
    });
    expect(offenders).toEqual([]);
  });

  it('never attributes a movement to a party, government or official', () => {
    const offenders = [];
    allNotes.forEach(({ id, index, text }) => {
      PARTISAN.forEach(([pattern, why]) => {
        if (pattern.test(text)) offenders.push(`${id} #${index}: ${why}`);
      });
    });
    expect(offenders).toEqual([]);
  });

  it('is a complete sentence', () => {
    const malformed = allNotes
      .filter(({ text }) => !/^[A-Z“"']/.test(text.trim()) || !/[.!?]["”']?$/.test(text.trim()))
      .map(({ id, index }) => `${id} #${index}`);
    expect(malformed).toEqual([]);
  });
});

describe('the first note', () => {
  it('says what the number is, before any caveat', () => {
    // House order: definition first, caveats after. A first note that opens on
    // a limitation leaves the reader qualifying something they cannot yet name.
    const opensOnCaveat = datasets
      .filter(({ meta }) =>
        /^(?:however|but|note that|beware|caution|it (?:does not|cannot)|this (?:does not|cannot))/i
          .test(meta.notes[0].trim()))
      .map(({ meta }) => meta.id);
    expect(opensOnCaveat).toEqual([]);
  });
});

describe('every title', () => {
  // Titles are the question a reader arrives with. A question makes a promise,
  // and these are the ways the promise gets broken.
  it('asks a question', () => {
    const statements = datasets
      .filter(({ meta }) => !meta.title.trim().endsWith('?'))
      .map(({ meta }) => `${meta.id}: "${meta.title}"`);
    expect(statements).toEqual([]);
  });

  it("never asks on the reader's behalf", () => {
    // A median describes nobody in particular, so a title cannot say "me".
    const personal = datasets
      .filter(({ meta }) => /\b(me|my|I)\b/.test(meta.title))
      .map(({ meta }) => meta.id);
    expect(personal).toEqual([]);
  });

  it('says "how many" only about a count', () => {
    // "How many" invites a number. A share answers with a percentage, which is
    // a different question from the one the reader was asked.
    const miscounted = datasets
      .filter(({ meta }) => /^how many\b/i.test(meta.title.trim()))
      .filter(({ meta }) => /%|per cent|percent|share|ratio|rate|index|score/i.test(meta.unit))
      .map(({ meta }) => `${meta.id}: "${meta.title}" over unit "${meta.unit}"`);
    expect(miscounted).toEqual([]);
  });

  it('promises money only when the unit is money', () => {
    const unitIsMoney = (unit) => /\$|dollar/i.test(unit);

    // A ratio may name dollars without promising a dollar amount. "How much do
    // households owe for every dollar they earn" answers 188%, and saying it
    // per dollar earned is what makes that percentage mean anything. What the
    // rule is for is a title asking the size of a bill over a unit that is a
    // share.
    const isRatioPhrasing = (title) => /\b(for|per) every dollar\b|\bper dollar\b/i.test(title);

    const overpromised = datasets
      .filter(({ meta }) => /\bcosts?\b|\bearns?\b|\bpays?\b/i.test(meta.title))
      .filter(({ meta }) => !isRatioPhrasing(meta.title))
      .filter(({ meta }) => !unitIsMoney(meta.unit))
      .map(({ meta }) => `${meta.id}: "${meta.title}" over unit "${meta.unit}"`);
    expect(overpromised).toEqual([]);
  });

  it('is short enough to read as a heading', () => {
    const long = datasets
      .filter(({ meta }) => meta.title.length > 70)
      .map(({ meta }) => `${meta.id} (${meta.title.length} chars)`);
    expect(long).toEqual([]);
  });
});

describe('card text around the notes', () => {
  it('states what is measured without stating a conclusion', () => {
    const CONCLUSIONS =
      /\b(?:crisis|disaster|shameful|worst in|best in|failing|thriving|booming|collapse of)\b/i;
    const offenders = datasets
      .filter(({ meta }) => CONCLUSIONS.test(meta.title) || CONCLUSIONS.test(meta.unit))
      .map(({ meta }) => meta.id);
    expect(offenders).toEqual([]);
  });

  it('gives a unit that names its denominator', () => {
    // "%" alone leaves the reader guessing what the share is of.
    const bare = datasets
      .filter(({ meta }) => /^%$|^percent$/i.test(meta.unit.trim()))
      .map(({ meta }) => meta.id);
    expect(bare).toEqual([]);
  });
});
