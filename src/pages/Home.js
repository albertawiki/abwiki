import React from 'react';
import Footer from '../components/Footer';
import MainContent from './MainContent';

const Home = () => (
  <div className="home-page">
    <header className="header">
      <h1>alberta.wiki</h1>
      <p className="intro-text">
        How Alberta is actually doing, on the issues Albertans say matter most.
        Every figure is traced to an original public document, and every number
        behind every chart is one click away.
      </p>
    </header>

    <MainContent />

    <div className="footer-spacing" />
    <Footer />
  </div>
);

export default Home;
