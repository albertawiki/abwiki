import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Home from './pages/Home';
import FAQ from './pages/FAQ';
import Contribute from './pages/Contribute';
import './App.css';

const NAV = [
  { to: '/', label: 'Dashboard' },
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
        </nav>

        <div className={`mobile-nav ${isMobileMenuOpen ? 'active' : ''}`}>
          {NAV.map(({ to, label }) => (
            <Link key={to} to={to} onClick={toggleMobileMenu}>{label}</Link>
          ))}
        </div>
      </header>

      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/contribute" element={<Contribute />} />
          <Route path="/faq" element={<FAQ />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
