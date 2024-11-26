import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Home from './pages/Home';
import FAQ from './pages/FAQ';
// Import additional pages (if you want separate pages for specific issues)
import './App.css';

const App = () => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(prevState => !prevState);
  };

  return (
    <Router>
      <div>
        {/* Header Bar with Logo and Hamburger Menu */}
        <header className="header-bar">
          <div className="logo"><img src="./tall_logo.png" className="header-logo"/>alberta.wiki</div>

          {/* Hamburger Menu Icon */}
          <div className={`hamburger-menu ${isMobileMenuOpen ? 'open' : ''}`} onClick={toggleMobileMenu}>
            <div></div>
            <div></div>
            <div></div>
          </div>

          {/* Desktop Navigation */}
          <nav>
            <ul>
              <li>
                <Link to="/">Dashboard</Link>
              </li>
              <li>
                <Link to="/faq">FAQ</Link>
              </li>
            </ul>
          </nav>

          {/* Mobile Navigation */}
          <div className={`mobile-nav ${isMobileMenuOpen ? 'active' : ''}`}>
            <Link to="/" onClick={toggleMobileMenu}>Dashboard</Link>
            <Link to="/faq" onClick={toggleMobileMenu}>FAQ</Link>
          </div>
        </header>


        {/* Routing Setup */}
        <div className='container'>
          <Routes>
            <Route exact path="/" element={<Home/>} />
            <Route path="/faq" component={FAQ} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
