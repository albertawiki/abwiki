import React from 'react';
import { Link } from 'react-router-dom';
import usePageMeta from '../hooks/usePageMeta';
import Footer from '../components/Footer';
import { topics } from '../figures';

/**
 * Nothing at this address.
 *
 * Figure permalinks are meant to be linked to from elsewhere, so a wrong or
 * outdated one is a normal event rather than an error. This page says what is
 * published instead of leaving a blank frame, which is what an unmatched route
 * rendered before.
 */
const NotFound = ({ what = 'There is nothing published at this address.' }) => {
  usePageMeta({ title: 'Page not found', noindex: true });

  return (
    <div className="not-found-page">
      <header className="header">
        <h1>Page not found</h1>
        <p className="intro-text">{what}</p>
      </header>

      <main className="main-content">
        <p>
          The <Link to="/">dashboard</Link> carries every figure the site publishes.
          By topic:
        </p>
        <ul>
          {topics.map((topic) => (
            <li key={topic.slug}>
              <Link to={`/${topic.slug}`}>{topic.label}</Link>
            </li>
          ))}
        </ul>
      </main>

      <div className="footer-spacing" />
      <Footer />
    </div>
  );
};

export default NotFound;
