import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Home from './pages/Home';
import FAQ from './pages/FAQ';
import Contribute from './pages/Contribute';
import Topic from './pages/Topic';
import Figure from './pages/Figure';
import NotFound from './pages/NotFound';
import ThemeToggle from './components/ThemeToggle';
import { topics } from './figures';
import './App.css';

// The topics are the site's structure, so they are the middle of the nav:
// the dashboard before them, the pages about the project after.
const NAV = [
  { to: '/', label: 'Dashboard' },
  ...topics.map(({ slug, label }) => ({ to: `/${slug}`, label })),
  { to: '/contribute', label: 'Contribute' },
  { to: '/faq', label: 'FAQ' },
];

const App = () => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const toggleMobileMenu = () => setMobileMenuOpen((open) => !open);

  return (
    <Router>
      <header className="header-bar">
        <Link to="/" className="logo">
          <img src="/tall_logo.png" className="header-logo" alt="" />
          alberta.wiki
        </Link>

        <button
          type="button"
          className={`hamburger-menu ${isMobileMenuOpen ? 'open' : ''}`}
          onClick={toggleMobileMenu}
          aria-label="Menu"
          aria-expanded={isMobileMenuOpen}
        >
          <div /><div /><div />
        </button>

        <nav>
          <ul>
            {NAV.map(({ to, label }) => (
              <li key={to}><Link to={to}>{label}</Link></li>
            ))}
          </ul>
          <ThemeToggle />
        </nav>

        <div className={`mobile-nav ${isMobileMenuOpen ? 'active' : ''}`}>
          {NAV.map(({ to, label }) => (
            <Link key={to} to={to} onClick={toggleMobileMenu}>{label}</Link>
          ))}
          <ThemeToggle />
        </div>
      </header>

      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Explicit routes rather than a `/:slug` catch-all, so a typo in a
              topic link is a 404 rather than a blank topic page. */}
          {topics.map((topic) => (
            <Route
              key={topic.slug}
              path={`/${topic.slug}`}
              element={<Topic topic={topic} />}
            />
          ))}
          <Route path="/f/:figureId" element={<Figure />} />
          <Route path="/contribute" element={<Contribute />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
