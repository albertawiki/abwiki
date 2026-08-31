import React from 'react';
import { Link } from 'react-router-dom';
import { REPO_URL } from '../content/principles';

const Footer = () => (
  <footer className="footer">
    <p>
      <Link to="/contribute">Contribute</Link>
      {' · '}
      <Link to="/faq">FAQ</Link>
      {' · '}
      <a href={REPO_URL} target="_blank" rel="noopener noreferrer">Source on GitHub</a>
      {' · '}
      <a href={`${REPO_URL}/issues/new`} target="_blank" rel="noopener noreferrer">Report an error</a>
    </p>
    <p>
      Original figures and calculations are free to use and share under the{' '}
      <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">
        Creative Commons Attribution 4.0
      </a>{' '}licence.
    </p>
    <p>
      All data remain the property of their respective owners, cited under each chart.
      Refer to those sources for the most current information and for methodology.
    </p>
    <p>Hosted in Calgary, Alberta.</p>
  </footer>
);

export default Footer;
