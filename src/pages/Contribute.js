import React from 'react';
import usePageTitle from '../hooks/usePageTitle';
import Footer from '../components/Footer';
import { principles, contributionTypes, REPO_URL } from '../content/principles';

const Contribute = () => {
  usePageTitle('Contribute');

  return (
    <div>
      <article className="prose">
        <h1>Contribute</h1>
        <p className="intro-text">
          alberta.wiki is built in the open. Anyone can propose a correction, a new
          indicator, or a better way of showing one, and every change gets reviewed
          against the same published standards.
        </p>

        <div className="callout">
          <p style={{ margin: 0 }}>
            The repository is at{' '}
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer">github.com/albertawiki/abwiki</a>.
            Start with an issue if you're proposing something new, or go straight to a pull
            request if you're fixing something specific.
          </p>
        </div>

        <h2>What we are trying to do</h2>
        <p>
          A lot of public debate in Alberta happens around announcements. A programme
          launches, a funding number gets quoted, a headline follows. The thing people
          actually want to know, like whether the emergency room wait got shorter or
          whether a family can afford the rent, is measured somewhere else entirely:
          months later, by a different organisation, in a document almost nobody reads.
        </p>
        <p>
          This site gathers those measurements in one place and keeps them current. If
          Albertans can see the numbers on the issues they care about, it gets harder for
          anyone, of any political stripe, to pass an announcement off as a result.
        </p>

        <h2>How we decide what goes on the site</h2>
        <p>
          Every dataset and figure is reviewed against these principles. They double as
          the checklist a reviewer works through on your pull request, so nothing in
          review should come as a surprise.
        </p>
        {principles.map((p) => (
          <div className="principle" key={p.id} id={p.id}>
            <h3>{p.title}</h3>
            <p style={{ margin: 0 }}>{p.body}</p>
          </div>
        ))}

        <h2>Ways to help</h2>
        <p>
          You don't need to write code to help. These are roughly in order of how much
          time they take.
        </p>
        <ul>
          {contributionTypes.map((c) => (
            <li key={c.title}>
              <strong>{c.title}</strong> <em>({c.effort})</em> — {c.body}
            </li>
          ))}
        </ul>

        <h2>What happens to your pull request</h2>
        <ol>
          <li>
            Automated checks run first: the site has to build, and every dataset has to
            declare a source with a link and a date it was checked.
          </li>
          <li>
            A maintainer opens your cited source and looks for the number. If we can't
            find it, we'll ask whereabouts in the document it is.
          </li>
          <li>
            We check the framing against the principles above, particularly whether the
            chart claims more than the measurement supports.
          </li>
          <li>
            Merged changes go to a staging site, then to alberta.wiki once someone has
            checked them. Corrections to published figures get their own commit, so the
            history shows what was wrong.
          </li>
        </ol>

        <h2>What we will turn down</h2>
        <ul>
          <li>Figures sourced from news coverage rather than from the original document.</li>
          <li>Indicators chosen to make a case rather than to describe a condition.</li>
          <li>Copy or annotations that credit or blame a party, government or official.</li>
          <li>Charts whose axes, groupings or smoothing make a movement look larger than it is.</li>
          <li>Sources behind a paywall or a login, however reputable.</li>
          <li>Projections and modelled forecasts. This site reports what has been measured.</li>
        </ul>
        <p>
          Turning something down usually isn't a judgement about whether it's true or
          whether it matters. More often it means the thing belongs in a piece of analysis
          rather than on a dashboard of measured indicators.
        </p>

        <h2>Reporting an error</h2>
        <p>
          A wrong number is the most useful thing you can report. Open an issue on{' '}
          <a href={`${REPO_URL}/issues/new`} target="_blank" rel="noopener noreferrer">GitHub</a>{' '}
          with the figure, what you think it should be, and a link to the source. We'd
          much rather publish a correction than leave a number up that we aren't sure of.
        </p>
      </article>
      <div className="footer-spacing" />
      <Footer />
    </div>
  );
};

export default Contribute;
