import React from 'react';
import usePageTitle from '../hooks/usePageTitle';
import Footer from '../components/Footer';
import { REPO_URL } from '../content/principles';

const FAQ = () => {
  usePageTitle('Frequently asked questions');

  return (
    <div>
      <article className="prose">
        <h1>Frequently asked questions</h1>

        <h2>What is alberta.wiki?</h2>
        <p>
          A single, memorable place to see how Alberta is doing on the issues Albertans
          say matter most. Plenty of good data about the province already exists, but it
          comes out at different times, from different organisations, and mostly reaches
          the public through whichever number a news outlet chose to quote. That makes
          performance hard to track over time, which is what you need if you want to tell
          progress from activity.
        </p>

        <h2>How are the topics chosen?</h2>
        <p>
          Topics follow polling on what Albertans say concerns them most, including
          Leger's{' '}
          <a href="https://leger360.com/alberta-government-report-card-august/" target="_blank" rel="noopener noreferrer">
            Alberta Government Report Card
          </a>. The idea is to cover what people are worried about rather than whatever
          happens to be easiest to measure.
        </p>

        <h2>Is this site partisan?</h2>
        <p>
          We work at not being. We describe what each measurement captures and what it
          misses, and we don't attribute movements to a party, a government or a policy.
          Contributions that do get turned down. Most of these indicators move for reasons
          spanning several governments, and a few of them, like interest rates and
          commodity prices, are barely within provincial control at all.
        </p>

        <h2>Why does a chart stop before the current year?</h2>
        <p>
          Because the measurement does. Poverty and food insecurity come from a survey
          fielded the year after the period they cover, PISA runs every three years, and
          emergency department figures are published annually in arrears. Each card shows
          when it was last checked and how often it updates, so a flat line at the end
          means the period hasn't been measured yet rather than that nothing happened.
        </p>

        <h2>Why do some charts show two lines for the same thing?</h2>
        <p>
          Because the way it's measured changed partway through. Statistics Canada
          rebased Canada's official poverty line in 2023, so we draw the 2018-base and
          2023-base series separately. Joining them would put a step in the chart that
          never happened in the world.
        </p>

        <h2>Where do the numbers come from?</h2>
        <p>
          Every figure lists its sources on the card. Click "Sources" under any chart for
          the original table or report, and "Data table" for the underlying values.
          Everything comes from public documents: Statistics Canada, the Government of
          Alberta, the OECD, and published survey results.
        </p>

        <h2>I found an error. How do I report it?</h2>
        <p>
          Please open an issue on{' '}
          <a href={`${REPO_URL}/issues/new`} target="_blank" rel="noopener noreferrer">GitHub</a>{' '}
          with the figure, what you think it should be, and a link to the source. If you'd
          rather not use GitHub, any of the maintainers listed in the repository can take
          it. Corrections go up as their own commit, so the record shows what changed.
        </p>

        <h2>Can I use these charts?</h2>
        <p>
          Yes. Our figures and calculations are free to use and share under{' '}
          <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">
            CC BY 4.0
          </a>. The underlying data belongs to the organisations cited under each chart, so
          please credit them too.
        </p>

        <h2>How can I help?</h2>
        <p>
          See the <a href="/contribute">Contribute</a> page. Corrections and new data
          sources are the most useful things to send.
        </p>
      </article>
      <div className="footer-spacing" />
      <Footer />
    </div>
  );
};

export default FAQ;
