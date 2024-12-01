import React from 'react';

const FAQ = () => {
  return (
    <div classname="home-page">
      {/* header section */}
      <header classname="header">
        <h1>Frequently Asked Questions (FAQ)</h1>
      </header>
      <p>
        <b>What is the Alberta Wiki?</b>
      </p>
      <p>
        The Alberta Wiki is a single easy-to-use portal that makes numerical data on Albertan easily available in a single memorable location.  While a large variety of high-quality is publicly available, data sources are published at different times, by different organizations, and often relayed to the public at irregular intervals by news outlets.  As a result, it becomes difficult to track performance on key quantiative metrics over time, which is important for ensuring Alberta is making progress towards the priorities of the Albertan public.
      </p>

      <p>
        <b>How are the categories to feature determined?</b>
      </p>
      <p>
        Categories were selected based on Leger polling data that tracks the concerns of Albertans via the <a href="https://leger360.com/alberta-government-report-card-august/">"Alberta Government Report Card"</a>.
      </p>

      <p>
        <b>I found an error.  How do I report it?</b>
      </p>
      <p>
        You can send an email to (address) and our volunteer team will review it and issue corrections if necessary.
      </p>

    </div>
  );
};

export default FAQ;
