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
          indicator, or a better way to show one — and every change is reviewed against
          the same published standards.
        </p>

        <div className="callout">
          <p style={{ margin: 0 }}>
            The repository is at{' '}
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer">github.com/albertawiki/abwiki</a>.
            Start with an issue if you are proposing something new, or go straight to a
            pull request if you are fixing something specific.
          </p>
        </div>

        <h2>What we are trying to do</h2>
        <p>
          Public debate in Alberta runs on announcements. A programme is launched, a
          funding number is quoted, a headline is written, and the thing everyone
          actually cares about — whether the emergency room wait got shorter, whether a
          family can afford the rent — is measured somewhere else, months later, by
          someone else, in a document almost nobody reads.
        </p>
        <p>
          This site collects those measurements in one place and keeps them current. The
          bet is straightforward: if it is easy for Albertans to see the hard numbers on
          the issues they care about, it becomes harder for anyone of any political
          stripe to substitute an announcement for a result.
        </p>

        <h2>How we decide what goes on the site</h2>
        <p>
          Every dataset and every figure is reviewed against these principles. They are
          also the checklist a reviewer works through on your pull request, so there are
          no surprises.
        </p>
        {principles.map((p) => (
          <div className="principle" key={p.id} id={p.id}>
            <h3>{p.title}</h3>
            <p style={{ margin: 0 }}>{p.body}</p>
          </div>
        ))}

        <h2>Ways to help</h2>
        <p>
          You do not need to write code to contribute usefully. These are roughly in
          order of how much time they take.
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
            A maintainer opens your cited source and finds the number. If we cannot find
            it, we will ask where in the document it is rather than reject it.
          </li>
          <li>
            We check the framing against the principles above — particularly whether the
            chart claims more than the measurement supports.
          </li>
          <li>
            Merged changes deploy automatically. Corrections to published figures are
            merged as their own commit so the history shows what was wrong.
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
          Turning something down is not a judgement about whether it is true or whether it
          matters. It usually means it belongs in a piece of analysis rather than on a
          dashboard of measured indicators.
        </p>

        <h2>Reporting an error</h2>
        <p>
          If a number here is wrong, that is the most important thing you can tell us.
          Open an issue on{' '}
          <a href={`${REPO_URL}/issues/new`} target="_blank" rel="noopener noreferrer">GitHub</a>{' '}
          with the figure, what you believe it should be, and a link to the source. We
          would rather publish a correction than a number we are not sure of.
        </p>
      </article>
      <div className="footer-spacing" />
      <Footer />
    </div>
  );
};

export default Contribute;
