import React from 'react';
import usePageTitle from '../hooks/usePageTitle';
import Footer from '../components/Footer';
import MainContent from './MainContent';

const Home = () => {
  usePageTitle();

  return (
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
};

export default Home;
