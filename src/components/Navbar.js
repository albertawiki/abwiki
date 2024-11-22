import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar">
      <h1>Alberta Dashboard</h1>
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/health">Health Care</Link></li>
        <li><Link to="/inflation">Inflation</Link></li>
        <li><Link to="/housing">Housing</Link></li>
        <li><Link to="/economy">Economy</Link></li>
        <li><Link to="/wildfires">Wildfires</Link></li>
      </ul>
    </nav>
  );
};

export default Navbar;

