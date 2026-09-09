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
    {/* CC BY-SA asks for credit, a link to the licence, and a note that the
        work was changed. Share-alike binds the adapted outline, not the rest
        of the site: this page is a collection containing it, not a derivative
        of it. */}
    <p className="footer-credit">
      Alberta outline adapted from{' '}
      <a
        href="https://commons.wikimedia.org/wiki/File:Canada_Alberta_location_map.svg"
        target="_blank"
        rel="noopener noreferrer"
      >
        a location map by NordNordWest
      </a>{' '}
      and simplified to an outline, under{' '}
      <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener noreferrer">
        CC BY-SA 3.0
      </a>.
    </p>
    <p>Hosted in Calgary, Alberta.</p>
  </footer>
);

export default Footer;
