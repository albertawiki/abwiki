import React from 'react';
import usePageMeta from '../hooks/usePageMeta';
import Footer from '../components/Footer';
import MainContent from './MainContent';
import { SITE_ORIGIN } from '../figures';

const Home = () => {
  usePageMeta({ canonical: `${SITE_ORIGIN}/` });

  return (
    <div className="home-page">
      <header className="header">
        <h1>alberta.wiki</h1>
        <p className="intro-text">
          How Alberta is doing on the issues Albertans say matter most. Every figure
          here traces back to an original public document, and the numbers behind each
          chart are one click away.
        </p>
      </header>

      <MainContent />

      <div className="footer-spacing" />
      <Footer />
    </div>
  );
};

export default Home;
