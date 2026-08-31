import React from 'react';
import Footer from '../components/Footer';
import { REPO_URL } from '../content/principles';

const FAQ = () => (
  <div>
    <article className="prose">
      <h1>Frequently asked questions</h1>

      <h2>What is alberta.wiki?</h2>
      <p>
        A single, memorable place to see how Alberta is actually doing on the issues
        Albertans say matter most. High-quality data about the province already exists,
        but it is published at different times, by different organisations, and reaches
        the public mostly through whichever number a news outlet chose to quote. That
        makes it hard to track performance over time — which is exactly what you need in
        order to tell progress from activity.
      </p>

      <h2>How are the topics chosen?</h2>
      <p>
        Topics follow polling on what Albertans say they are most concerned about,
        including Leger's{' '}
        <a href="https://leger360.com/alberta-government-report-card-august/" target="_blank" rel="noopener noreferrer">
          Alberta Government Report Card
        </a>. The intent is that the site covers what people are worried about, not what
        happens to be easiest to measure.
      </p>

      <h2>Is this site partisan?</h2>
      <p>
        No, and we work at it. We describe what each measurement captures and what it
        misses. We do not attribute movements to a party, a government or a policy, and
        we turn down contributions that do. Most of these indicators move for reasons
        that span multiple governments, and several — interest rates, commodity prices,
        a pandemic — are barely within any provincial government's control at all.
      </p>

      <h2>Why does a chart stop before the current year?</h2>
      <p>
        Because the measurement does. Poverty and food insecurity come from a survey
        fielded the year after the period they describe. PISA runs once every three
        years. Emergency department figures are published annually in arrears. Each card
        shows when it was last checked and how often it updates, so a flat line at the
        end means "not measured yet" rather than "nothing happened".
      </p>

      <h2>Why do some charts show two lines for the same thing?</h2>
      <p>
        Because the way it is measured changed. Statistics Canada rebased Canada's
        official poverty line in 2023, so the 2018-base and 2023-base series are drawn
        separately. Joining them into one line would create a step in the chart that
        never happened in the world.
      </p>

      <h2>Where do the numbers come from?</h2>
      <p>
        Every figure lists its sources on the card — click "Sources" under any chart to
        get the original table or report, and "Data table" to see the underlying values.
        Everything is drawn from public documents: Statistics Canada, the Government of
        Alberta, the OECD, and published survey results.
      </p>

      <h2>I found an error. How do I report it?</h2>
      <p>
        Please open an issue on{' '}
        <a href={`${REPO_URL}/issues/new`} target="_blank" rel="noopener noreferrer">GitHub</a>{' '}
        with the figure, what you believe it should be, and a link to the source. If you
        would rather not use GitHub, any of the maintainers listed in the repository can
        take it. Corrections are published as their own commit so the record shows what
        changed.
      </p>

      <h2>Can I use these charts?</h2>
      <p>
        Yes. Original figures and calculations are free to use and share under{' '}
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">
          CC BY 4.0
        </a>. The underlying data belongs to the organisations cited under each chart —
        please credit them too.
      </p>

      <h2>How can I help?</h2>
      <p>
        See the <a href="/contribute">Contribute</a> page. Corrections and new data
        sources are the most useful things you can send.
      </p>
    </article>
    <div className="footer-spacing" />
    <Footer />
  </div>
);

export default FAQ;
