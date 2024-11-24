// src/pages/Home.js
import React, { useState } from 'react';
import Footer from '../components/Footer';
import MainContent from './MainContent';

const Home = () => {
  return (
    <div className="home-page">
      {/* Header Section */}
      <header className="header">
        <h1>alberta.wiki</h1>
        <p className="intro-text">
          A comprehensive, data-driven overview of key issues affecting Alberta, Canada.
        </p>
      </header>

      <MainContent/>

      {/* Footer Section */}
      <Footer />
    </div>
  );
};

export default Home;
